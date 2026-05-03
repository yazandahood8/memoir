import OpenAI from 'openai';
import { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribe(audioBuffer: Buffer): Promise<string> {
  const file = await toFile(audioBuffer, 'audio.m4a', { type: 'audio/mp4' });
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });
  return response as unknown as string;
}
