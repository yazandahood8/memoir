import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock external dependencies before importing app
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      single: vi.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({ download: vi.fn() }),
    },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  entryProcessingQueue: { add: vi.fn().mockResolvedValue(undefined) },
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

afterAll(async () => {
  await app.close();
});

describe('POST /entries', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      payload: { input_type: 'text', raw_text: 'test' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects entry without content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { input_type: 'text' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /entries', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/entries' });
    expect(res.statusCode).toBe(401);
  });

  it('returns paginated entries for authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/entries?page=1&limit=10',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().entries)).toBe(true);
  });
});
