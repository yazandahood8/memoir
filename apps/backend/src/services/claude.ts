import Anthropic from '@anthropic-ai/sdk';
import type { Entry } from '@memoir/shared';

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface EntryAnalysis {
  emotions: Record<string, number>;
  people: string[];
  topics: string[];
  key_moment: string;
}

function buildAnalysisPrompt(transcript: string): string {
  return `Analyze this journal entry. Respond ONLY with valid JSON. No explanation.

Entry: "${transcript}"

{
  "emotions": { "joy": 0.0, "sadness": 0.0, "wonder": 0.0, "stress": 0.0,
    "contentment": 0.0, "nostalgia": 0.0, "gratitude": 0.0, "reflection": 0.0 },
  "people": ["Person A"],
  "topics": ["food", "travel"],
  "key_moment": "one sentence summary"
}`;
}

function buildChapterPrompt(
  entries: Pick<Entry, 'transcript' | 'created_at' | 'image_urls'>[],
  style: 'warm' | 'formal' | 'narrative',
  collectionName: string,
  dateRange: string
): string {
  const styles = {
    warm: 'Write with warmth and intimacy, like a letter to a close friend.',
    formal: 'Write in structured, reflective style. Clear paragraphs, thoughtful tone.',
    narrative: 'Write like a short story with scene-setting and narrative arc.',
  };
  const transcripts = entries
    .map((e, i) => `[Entry ${i + 1} — ${e.created_at}]\n${e.transcript}`)
    .join('\n\n');
  const hasPhotos = entries.some((e) => e.image_urls?.length > 0);

  return `You are a literary memoir writer.
Collection: "${collectionName}" | Period: ${dateRange}
Style: ${styles[style]}
${hasPhotos ? 'Photos attached. Use them for atmosphere — never describe them literally.' : ''}
Guidelines: first person, authentic voice, emotional truth, 400–700 words, no invented facts, no real names.

Entries:
${transcripts}

Write the chapter now.`;
}

export async function analyzeEntry(
  transcript: string,
  imageUrls: string[] = []
): Promise<EntryAnalysis> {
  const content: Anthropic.MessageParam['content'] = [
    { type: 'text', text: buildAnalysisPrompt(transcript) },
  ];

  for (const url of imageUrls) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    });
  }

  const response = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content }],
  });

  const text = (response.content[0] as { type: 'text'; text: string }).text;
  return JSON.parse(text) as EntryAnalysis;
}

export async function writeChapter(
  entries: Pick<Entry, 'transcript' | 'created_at' | 'image_urls'>[],
  style: 'warm' | 'formal' | 'narrative',
  collectionName: string,
  dateRange: string
): Promise<string> {
  const content: Anthropic.MessageParam['content'] = [
    { type: 'text', text: buildChapterPrompt(entries, style, collectionName, dateRange) },
  ];

  for (const entry of entries) {
    for (const url of entry.image_urls ?? []) {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
      });
    }
  }

  const response = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{ role: 'user', content }],
  });

  return (response.content[0] as { type: 'text'; text: string }).text;
}

export async function writeDigest(transcripts: string[], period: string): Promise<string> {
  const joined = transcripts.join('\n\n');
  const response = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `Write a warm weekly digest (150–250 words).
Period: ${period}
Include: emotional tone, most memorable moment, one pattern noticed, encouraging closing.

Entries:
${joined}`,
      },
    ],
  });
  return (response.content[0] as { type: 'text'; text: string }).text;
}
