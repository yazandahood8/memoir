import { Worker } from 'bullmq';
import { connection } from '../lib/queue.js';
import { supabase } from '../lib/supabase.js';
import { transcribe } from '../services/whisper.js';
import { analyzeEntry, writeChapter } from '../services/claude.js';
import { anonymize, deanonymize } from '../services/anonymizer.js';
import { generateAndSaveEmbedding } from '../services/embeddings.js';

export const analysisWorker = new Worker(
  'entry-processing',
  async (job) => {
    if (job.name === 'process-entry') {
      await processEntry(job.data.entryId);
    } else if (job.name === 'generate-chapter') {
      await generateChapter(job.data.collectionId, job.data.style ?? 'warm');
    }
  },
  { connection }
);

async function processEntry(entryId: string) {
  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (!entry) throw new Error(`Entry ${entryId} not found`);

  // Step 1: Transcription
  let transcript: string;
  if (entry.input_type === 'voice' && entry.audio_url) {
    const { data: audioData } = await supabase.storage.from('audio').download(entry.audio_url);
    const audioBuffer = Buffer.from(await audioData!.arrayBuffer());
    transcript = await transcribe(audioBuffer);
  } else {
    transcript = entry.raw_text!;
  }

  await supabase.from('entries').update({ transcript }).eq('id', entryId);

  // Step 2: Anonymize + analyze
  const { anonymized, nameMap } = anonymize(transcript);
  const rawAnalysis = await analyzeEntry(anonymized, entry.image_urls ?? []);

  // Deanonymize string fields in the analysis
  const restoredPeople = rawAnalysis.people.map((p) => {
    for (const [real, alias] of nameMap) {
      if (p === alias) return real;
    }
    return p;
  });

  await supabase.from('entries').update({
    emotions: rawAnalysis.emotions,
    people: restoredPeople,
    topics: rawAnalysis.topics,
    processed: true,
  }).eq('id', entryId);

  // Step 3: Embedding
  await generateAndSaveEmbedding(entryId, transcript);
}

async function generateChapter(collectionId: string, style: 'warm' | 'formal' | 'narrative') {
  const { data: collection } = await supabase
    .from('collections')
    .select('*, collection_entries(entries(*))')
    .eq('id', collectionId)
    .single();

  if (!collection) throw new Error(`Collection ${collectionId} not found`);

  const entries = (collection.collection_entries as { entries: unknown }[])
    .map((ce) => ce.entries)
    .filter(Boolean) as { transcript: string; created_at: string; image_urls: string[] }[];

  if (entries.length === 0) return;

  const dateRange = `${entries[0].created_at.slice(0, 10)} – ${entries[entries.length - 1].created_at.slice(0, 10)}`;
  const chapterContent = await writeChapter(entries, style, collection.name, dateRange);
  const wordCount = chapterContent.split(/\s+/).length;

  await supabase.from('chapters').upsert({
    collection_id: collectionId,
    content: chapterContent,
    style,
    word_count: wordCount,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'collection_id' });
}
