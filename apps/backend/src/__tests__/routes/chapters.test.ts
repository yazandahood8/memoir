import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { mockSingle } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
}));

const mockQueueAdd = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }),
    storage: { from: vi.fn().mockReturnValue({ download: vi.fn() }) },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  entryProcessingQueue: { add: mockQueueAdd },
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
  mockQueueAdd.mockClear();
});

afterAll(() => app.close());

// ── GET /chapters/:collectionId ─────────────────────────────────────────────

describe('GET /chapters/:collectionId', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({ method: 'GET', url: '/chapters/col1' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when collection does not belong to user', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await app.inject({
      method: 'GET',
      url: '/chapters/col-other',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 when chapter not yet generated', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'col1' }, error: null })           // collection ownership check
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } }); // chapter lookup

    const res = await app.inject({
      method: 'GET',
      url: '/chapters/col1',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toMatch(/not yet generated/i);
  });

  it('returns chapter when found', async () => {
    const chapter = {
      id: 'chap1',
      collection_id: 'col1',
      content: 'There are moments that resist being named…',
      generated_at: '2026-05-01T10:00:00Z',
      word_count: 520,
      style: 'warm',
    };
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'col1' }, error: null })
      .mockResolvedValueOnce({ data: chapter, error: null });

    const res = await app.inject({
      method: 'GET',
      url: '/chapters/col1',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe('chap1');
    expect(res.json().content).toContain('moments');
    expect(res.json().word_count).toBe(520);
  });
});

// ── POST /chapters/:id/regenerate ───────────────────────────────────────────

describe('POST /chapters/:id/regenerate', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/chapters/chap1/regenerate',
      payload: { style: 'warm' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid style', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/chapters/chap1/regenerate',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { style: 'haiku' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('blocks free user with 403', async () => {
    mockSingle.mockResolvedValueOnce({ data: { plan: 'free' }, error: null });

    const res = await app.inject({
      method: 'POST',
      url: '/chapters/chap1/regenerate',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { style: 'warm' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/premium/i);
  });

  it('returns 404 when chapter does not exist', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { plan: 'premium' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const res = await app.inject({
      method: 'POST',
      url: '/chapters/nonexistent/regenerate',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { style: 'narrative' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('queues regeneration for premium user', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { plan: 'premium' }, error: null })
      .mockResolvedValueOnce({ data: { collection_id: 'col1' }, error: null });

    const res = await app.inject({
      method: 'POST',
      url: '/chapters/chap1/regenerate',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { style: 'formal' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().queued).toBe(true);
    expect(mockQueueAdd).toHaveBeenCalledWith('generate-chapter', {
      collectionId: 'col1',
      style: 'formal',
    });
  });

  it('queues in correct style', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { plan: 'premium' }, error: null })
      .mockResolvedValueOnce({ data: { collection_id: 'col2' }, error: null });

    await app.inject({
      method: 'POST',
      url: '/chapters/chap2/regenerate',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { style: 'narrative' },
    });
    expect(mockQueueAdd).toHaveBeenCalledWith('generate-chapter', {
      collectionId: 'col2',
      style: 'narrative',
    });
  });
});
