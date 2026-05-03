import OpenAI, { toFile } from 'openai';

export async function transcribe(audioBuffer: Buffer): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return '[Voice transcription pending — add OPENAI_API_KEY to enable]';
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = await toFile(audioBuffer, 'audio.m4a', { type: 'audio/mp4' });
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });
  return response as unknown as string;
}
