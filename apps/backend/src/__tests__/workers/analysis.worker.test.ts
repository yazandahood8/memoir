import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: { from: vi.fn().mockReturnValue({ download: vi.fn() }) },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  connection: {},
  entryProcessingQueue: { add: vi.fn() },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_name: string, processor: Function) => ({
    on: vi.fn(),
    _processor: processor,
  })),
  Queue: vi.fn(),
}));

// Clear API keys so stub mode activates
beforeAll(() => {
  vi.stubEnv('OPENAI_API_KEY', '');
  vi.stubEnv('ANTHROPIC_API_KEY', '');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const { analyzeEntry, writeChapter } = await import('../../services/claude.js');
const { transcribe } = await import('../../services/whisper.js');
const { anonymize } = await import('../../services/anonymizer.js');

describe('AI pipeline — stub mode (no API keys)', () => {
  it('transcribe returns stub text when OPENAI_API_KEY is missing', async () => {
    const result = await transcribe(Buffer.from('fake audio'));
    expect(result).toContain('pending');
  });

  it('analyzeEntry returns stub analysis when ANTHROPIC_API_KEY is missing', async () => {
    const result = await analyzeEntry('Had ramen at 8am.');
    expect(result.emotions).toBeDefined();
    expect(typeof result.emotions.joy).toBe('number');
    expect(Array.isArray(result.topics)).toBe(true);
    expect(result.key_moment).toBeTruthy();
  });

  it('analyzeEntry stub has all required emotion keys', async () => {
    const result = await analyzeEntry('test');
    const keys = ['joy', 'sadness', 'wonder', 'stress', 'contentment', 'nostalgia', 'gratitude', 'reflection'];
    for (const key of keys) {
      expect(result.emotions[key]).toBeDefined();
    }
  });

  it('anonymize + analyzeEntry pipeline runs end-to-end', async () => {
    const text = 'I met John Smith today. We had coffee.';
    const { anonymized, nameMap } = anonymize(text);
    expect(anonymized).not.toContain('John Smith');

    const analysis = await analyzeEntry(anonymized);
    expect(analysis).toBeTruthy();
    expect(nameMap.get('John Smith')).toBe('Person A');
  });

  it('writeChapter returns stub chapter when ANTHROPIC_API_KEY is missing', async () => {
    const entries = [{ transcript: 'Arrived in Tokyo.', created_at: '2026-05-01', image_urls: [] }];
    const result = await writeChapter(entries, 'warm', 'Tokyo Trip', 'May 1–7');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });
});
