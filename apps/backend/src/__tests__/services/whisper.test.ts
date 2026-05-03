import { describe, it, expect, vi } from 'vitest';

const mockCreate = vi.fn().mockResolvedValue('Hello world');

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockCreate,
      },
    },
  })),
  toFile: vi.fn().mockResolvedValue('mock-file'),
}));

const { transcribe } = await import('../../services/whisper.js');

describe('transcribe', () => {
  it('returns transcribed text from audio buffer', async () => {
    const result = await transcribe(Buffer.from('fake audio'));
    expect(result).toBe('Hello world');
  });

  it('throws when API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));
    await expect(transcribe(Buffer.from('fake audio'))).rejects.toThrow('API Error');
  });
});
