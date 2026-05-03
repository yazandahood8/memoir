import OpenAI from 'openai';
import { supabase } from '../lib/supabase.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAndSaveEmbedding(entryId: string, text: string): Promise<void> {
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  await supabase.from('embeddings').upsert({
    entry_id: entryId,
    vector: data[0].embedding,
  });
}
