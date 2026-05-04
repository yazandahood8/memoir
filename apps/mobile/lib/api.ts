import { supabase } from './supabase';
import type { Entry, Collection, Chapter, Digest } from '@memoir/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Entries
export const api = {
  entries: {
    create: (body: {
      input_type: 'text' | 'voice';
      raw_text?: string;
      audio_url?: string;
      audio_duration_seconds?: number;
      image_urls?: string[];
      location?: string;
    }) => request<Entry>('/entries', { method: 'POST', body: JSON.stringify(body) }),

    list: (page = 1, limit = 20) =>
      request<{ entries: Entry[]; total: number; page: number; limit: number }>(
        `/entries?page=${page}&limit=${limit}`
      ),

    get: (id: string) => request<Entry>(`/entries/${id}`),
    delete: (id: string) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  },

  collections: {
    create: (body: { name: string; description?: string }) =>
      request<Collection>('/collections', { method: 'POST', body: JSON.stringify(body) }),

    list: () => request<Collection[]>('/collections'),
    get: (id: string) => request<Collection>(`/collections/${id}`),

    update: (id: string, body: { name?: string; description?: string }) =>
      request<Collection>(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    close: (id: string) =>
      request<Collection & { chapter_queued: boolean }>(`/collections/${id}/close`, {
        method: 'POST',
      }),

    addEntries: (id: string, entry_ids: string[]) =>
      request<{ added: number }>(`/collections/${id}/entries`, {
        method: 'POST',
        body: JSON.stringify({ entry_ids }),
      }),

    removeEntry: (id: string, entryId: string) =>
      request<void>(`/collections/${id}/entries/${entryId}`, { method: 'DELETE' }),
  },

  chapters: {
    get: (collectionId: string) => request<Chapter>(`/chapters/${collectionId}`),
    regenerate: (id: string, style: 'warm' | 'formal' | 'narrative') =>
      request<{ queued: boolean }>(`/chapters/${id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ style }),
      }),
  },

  search: {
    query: (q: string) =>
      request<{ results: Array<Entry & { similarity: number }> }>('/search', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      }),
  },

  digests: {
    list: () => request<Digest[]>('/digests'),
    get: (id: string) => request<Digest>(`/digests/${id}`),
  },
};
