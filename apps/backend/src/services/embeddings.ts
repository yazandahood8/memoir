import OpenAI from 'openai';
import { supabase } from '../lib/supabase.js';

export async function generateAndSaveEmbedding(entryId: string, text: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  await supabase.from('embeddings').upsert({
    entry_id: entryId,
    vector: data[0].embedding,
  });
}
