import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

vi.mock('../../lib/queue.js', () => ({
  connection: {},
  entryProcessingQueue: { add: vi.fn() },
  digestQueue: { add: vi.fn() },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_name: string, processor: Function) => ({
    on: vi.fn(),
    _processor: processor,
  })),
  Queue: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-1' }) },
  })),
}));

beforeAll(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.stubEnv('RESEND_API_KEY', '');
});

afterAll(() => vi.unstubAllEnvs());

const { writeDigest } = await import('../../services/claude.js');

describe('digest worker — stub mode', () => {
  it('writeDigest returns stub content when ANTHROPIC_API_KEY is missing', async () => {
    const result = await writeDigest(
      ['[2026-05-01] Had a quiet morning', '[2026-05-03] Long walk in the park'],
      'May 1–7'
    );
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  it('writeDigest includes the period in stub output', async () => {
    const result = await writeDigest(['entry text'], 'Apr 1–30');
    expect(result).toContain('Apr 1–30');
  });

  it('writeDigest includes entry count in stub output', async () => {
    const transcripts = ['entry 1', 'entry 2', 'entry 3'];
    const result = await writeDigest(transcripts, 'May 1–7');
    expect(result).toContain('3');
  });
});
