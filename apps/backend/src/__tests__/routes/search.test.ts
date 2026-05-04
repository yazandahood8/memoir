import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { mockSingle } = vi.hoisted(() => ({ mockSingle: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

vi.mock('../../lib/queue.js', () => ({
  entryProcessingQueue: { add: vi.fn() },
  digestQueue: { add: vi.fn() },
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
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

beforeEach(() => mockSingle.mockReset());

afterAll(() => app.close());

describe('POST /search', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'POST', url: '/search', payload: { query: 'test' } });
    expect(res.statusCode).toBe(401);
  });

  it('rejects missing query', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/search',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects blank query', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/search',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { query: '   ' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 403 for free users', async () => {
    mockSingle.mockResolvedValue({ data: { plan: 'free' }, error: null });

    const res = await app.inject({
      method: 'POST',
      url: '/search',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { query: 'homesick in tokyo' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/premium/i);
  });

  it('returns stub results for premium user when OPENAI_API_KEY is missing', async () => {
    mockSingle.mockResolvedValue({ data: { plan: 'premium' }, error: null });
    vi.stubEnv('OPENAI_API_KEY', '');

    const res = await app.inject({
      method: 'POST',
      url: '/search',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { query: 'my best meals' },
    });
    vi.unstubAllEnvs();

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().results)).toBe(true);
    expect(res.json().stub).toBe(true);
  });

  it('returns results for premium user when OPENAI_API_KEY is present', async () => {
    mockSingle.mockResolvedValue({ data: { plan: 'premium' }, error: null });

    const res = await app.inject({
      method: 'POST',
      url: '/search',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { query: 'my best meals' },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().results)).toBe(true);
  });
});
