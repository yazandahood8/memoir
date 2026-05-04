import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { mockSingle, mockChain } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const chain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: mockSingle,
  };
  return { mockSingle, mockChain: chain };
});

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue(mockChain),
    storage: { from: vi.fn().mockReturnValue({ download: vi.fn() }) },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  entryProcessingQueue: { add: vi.fn() },
  digestQueue: { add: vi.fn() },
}));

const { build } = await import('../../index.js');

let app: Awaited<ReturnType<typeof build>>;
let authToken: string;

beforeAll(async () => {
  app = await build({ testing: true });
  await app.ready();
  const res = await app.inject({
    method: 'POST',
    url: '/auth/test-token',
    payload: { email: 'test@memoir.app' },
  });
  authToken = res.json().token;
});

beforeEach(() => {
  mockSingle.mockReset();
  mockChain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
});

afterAll(() => app.close());

describe('GET /digests', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/digests' });
    expect(res.statusCode).toBe(401);
  });

  it('returns empty array when no digests', async () => {
    mockChain.limit = vi.fn().mockResolvedValue({ data: [], error: null });

    const res = await app.inject({
      method: 'GET',
      url: '/digests',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns digest list', async () => {
    const digests = [
      { id: 'd1', type: 'weekly', content: 'A quiet week of reflection.', period_start: '2026-04-28', period_end: '2026-05-04' },
      { id: 'd2', type: 'monthly', content: 'April was transformative.', period_start: '2026-04-01', period_end: '2026-04-30' },
    ];
    mockChain.limit = vi.fn().mockResolvedValue({ data: digests, error: null });

    const res = await app.inject({
      method: 'GET',
      url: '/digests',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
    expect(res.json()[0].type).toBe('weekly');
  });
});

describe('GET /digests/:id', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/digests/d1' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when digest not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await app.inject({
      method: 'GET',
      url: '/digests/missing',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns digest when found', async () => {
    const digest = {
      id: 'd1', type: 'weekly', content: 'A quiet week of reflection.',
      period_start: '2026-04-28', period_end: '2026-05-04', user_id: 'test-user-id',
    };
    mockSingle.mockResolvedValue({ data: digest, error: null });

    const res = await app.inject({
      method: 'GET',
      url: '/digests/d1',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().type).toBe('weekly');
    expect(res.json().content).toContain('reflection');
  });
});
