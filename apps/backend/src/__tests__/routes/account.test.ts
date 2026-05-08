import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const mockDeleteUser = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      admin: { deleteUser: mockDeleteUser },
    },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  entryProcessingQueue: { add: vi.fn() },
  digestQueue: { add: vi.fn() },
}));

const { build } = await import('../../index.js');

let app: Awaited<ReturnType<typeof build>>;
let authToken: string;

// Builds a thenable Supabase chain — every chained method returns `this`,
// and `await chain` (or any sub-chain) resolves to `resolveWith`.
function makeChain(resolveWith: any) {
  const chain: any = {
    then: (onFulfilled: any, onRejected?: any) =>
      Promise.resolve(resolveWith).then(onFulfilled, onRejected),
    catch: (fn: any) => Promise.resolve(resolveWith).catch(fn),
    finally: (fn: any) => Promise.resolve(resolveWith).finally(fn),
  };
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolveWith);
  return chain;
}

beforeAll(async () => {
  mockFrom.mockImplementation(() => makeChain({ data: null, error: null }));
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
  mockDeleteUser.mockResolvedValue({ error: null });
  // Default: all from() calls resolve to empty data
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }));
});

afterAll(() => app.close());

// ── GET /account/profile ────────────────────────────────────────────────────

describe('GET /account/profile', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/account/profile' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when user row is missing', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'not found' } }));

    const res = await app.inject({
      method: 'GET',
      url: '/account/profile',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toMatch(/user not found/i);
  });

  it('returns profile with zero stats when no entries', async () => {
    const user = { id: 'test-user-id', email: 'test@memoir.app', plan: 'free', created_at: '2026-01-01T00:00:00Z' };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return makeChain({ data: user, error: null });
      // entries / collections count queries → resolve with count 0
      return makeChain({ count: 0, error: null });
    });

    const res = await app.inject({
      method: 'GET',
      url: '/account/profile',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('test@memoir.app');
    expect(body.plan).toBe('free');
    expect(body.stats.entries).toBe(0);
    expect(body.stats.collections).toBe(0);
  });

  it('returns correct entry and collection counts', async () => {
    const user = { id: 'test-user-id', email: 'test@memoir.app', plan: 'free', created_at: '2026-01-01T00:00:00Z' };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return makeChain({ data: user, error: null });
      if (table === 'entries') return makeChain({ count: 17, error: null });
      if (table === 'collections') return makeChain({ count: 4, error: null });
      return makeChain({ data: [], error: null });
    });

    const res = await app.inject({
      method: 'GET',
      url: '/account/profile',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().stats.entries).toBe(17);
    expect(res.json().stats.collections).toBe(4);
  });

  it('returns premium plan', async () => {
    const user = { id: 'test-user-id', email: 'test@memoir.app', plan: 'premium', created_at: '2026-01-01T00:00:00Z' };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return makeChain({ data: user, error: null });
      return makeChain({ count: 0, error: null });
    });

    const res = await app.inject({
      method: 'GET',
      url: '/account/profile',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().plan).toBe('premium');
  });
});

// ── POST /account/export ────────────────────────────────────────────────────

describe('POST /account/export', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'POST', url: '/account/export' });
    expect(res.statusCode).toBe(401);
  });

  it('returns JSON export with correct shape', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }));

    const res = await app.inject({
      method: 'POST',
      url: '/account/export',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('exported_at');
    expect(body).toHaveProperty('entries');
    expect(body).toHaveProperty('collections');
    expect(body).toHaveProperty('chapters');
    expect(body).toHaveProperty('digests');
    expect(Array.isArray(body.entries)).toBe(true);
  });

  it('sets Content-Disposition attachment header', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }));

    const res = await app.inject({
      method: 'POST',
      url: '/account/export',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    const cd = res.headers['content-disposition'] as string;
    expect(cd).toContain('attachment');
    expect(cd).toContain('memoir-export.json');
  });

  it('includes user entries in the export', async () => {
    const entries = [{ id: 'e1', transcript: 'First memory' }];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'entries') return makeChain({ data: entries, error: null });
      return makeChain({ data: [], error: null });
    });

    const res = await app.inject({
      method: 'POST',
      url: '/account/export',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().entries).toHaveLength(1);
    expect(res.json().entries[0].id).toBe('e1');
  });
});

// ── DELETE /account ─────────────────────────────────────────────────────────

describe('DELETE /account', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/account' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 204 on successful deletion', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }));

    const res = await app.inject({
      method: 'DELETE',
      url: '/account',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it('calls auth.admin.deleteUser with the correct user id', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }));
    mockDeleteUser.mockClear();

    await app.inject({
      method: 'DELETE',
      url: '/account',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(mockDeleteUser).toHaveBeenCalledWith('test-user-id');
  });

  it('returns 500 when the database update fails', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'db error' } }));

    const res = await app.inject({
      method: 'DELETE',
      url: '/account',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(500);
  });
});
