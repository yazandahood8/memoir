import { describe, it, expect, vi } from 'vitest';

const mockAnalysis = {
  emotions: { joy: 0.8, contentment: 0.6 },
  people: [],
  topics: ['food', 'solitude'],
  key_moment: 'Had ramen alone at 8am',
};

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockAnalysis) }],
      }),
    },
  })),
}));

const { analyzeEntry, writeChapter } = await import('../../services/claude.js');

describe('analyzeEntry', () => {
  it('returns parsed analysis object', async () => {
    const result = await analyzeEntry('Had ramen at 8am. Best meal in years.');
    expect(result.emotions.joy).toBeGreaterThan(0);
    expect(result.topics).toContain('food');
    expect(result.key_moment).toBeTruthy();
  });

  it('works with empty image list', async () => {
    const result = await analyzeEntry('Quiet morning.', []);
    expect(result).toBeTruthy();
  });
});

describe('writeChapter', () => {
  it('returns a chapter string', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default as unknown as ReturnType<typeof vi.fn>;
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'There is something about arriving in a city before it wakes...' }],
        }),
      },
    }));

    const entries = [{ transcript: 'Arrived in Tokyo.', created_at: '2026-03-03', image_urls: [] }];
    const result = await writeChapter(entries, 'warm', 'Tokyo Trip', 'Mar 3–16');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });
});
