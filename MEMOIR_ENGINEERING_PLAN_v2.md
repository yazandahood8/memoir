# Memoir — Complete Engineering Plan
> **App:** Memoir (`getmemoir.com`)
> **Stack:** React Native (Expo) + Node.js + Supabase + Claude API + Whisper
> **Version:** 2.0 — Full Engineering Edition
> **Includes:** Architecture · Database · Prompts · Tests · CI/CD · Jira Tasks

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Environment Variables](#5-environment-variables)
6. [Core Processing Pipeline](#6-core-processing-pipeline)
7. [Claude Prompts](#7-claude-prompts)
8. [Feature Gating — Free vs Premium](#8-feature-gating)
9. [Security & Privacy](#9-security--privacy)
10. [Testing Strategy](#10-testing-strategy)
11. [GitHub Actions — CI/CD Pipelines](#11-github-actions--cicd-pipelines)
12. [Jira Project Structure](#12-jira-project-structure)
13. [Development Roadmap — 12 Weeks](#13-development-roadmap)
14. [Future Features](#14-future-features)
15. [Cost & Revenue](#15-cost--revenue)
16. [How to Use This Plan With Claude](#16-how-to-use-this-plan-with-claude)

---

# 1. Project Overview

Memoir transforms 30-second voice recordings or short text entries into beautifully written memoir chapters. Users attach photos. Claude reads everything — words and images — and writes literary narratives.

### Core Loop
```
User records voice / types text / attaches photos
        ↓
Whisper transcribes voice → text
        ↓
Claude analyzes: emotions, people, themes
        ↓
User groups entries into a Collection (trip, year, period)
        ↓
User closes Collection → Claude writes literary chapter
        ↓
Output: Chapter + Illustrated PDF + Instagram card + Insights
```

### Automatic Outputs
- **Weekly Digest** — every Friday (free tier)
- **Monthly Digest** — deep analysis + patterns (premium)

---

# 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile | React Native (Expo SDK 51) | iOS + Android |
| Audio | Expo Audio | Voice recording |
| Images | Expo Image Picker + Manipulator | Photos + compression |
| Navigation | Expo Router | File-based routing |
| State | Zustand | Global state |
| Data Fetching | TanStack Query | Server state + caching |
| Backend | Node.js + Fastify | REST API |
| Database | PostgreSQL (Supabase) | All data |
| Auth | Supabase Auth | Email + social |
| Storage | Supabase Storage | Audio + photos |
| Queue | BullMQ + Redis | Async AI jobs |
| Transcription | OpenAI Whisper API | Voice → text |
| AI | Claude API (claude-opus-4-5) | Analysis + writing |
| Vision | Claude Vision | Photo reading |
| Search | pgvector | Semantic search |
| Embeddings | text-embedding-3-small | Vectors |
| Payments | RevenueCat | Subscriptions |
| Email | Resend | Digests |
| Hosting | Railway | Backend |
| Monitoring | Sentry | Errors |
| Analytics | PostHog | User behavior |
| Testing (Mobile) | Jest + React Native Testing Library | Unit + integration |
| Testing (Backend) | Vitest + Supertest | Unit + integration |
| E2E Testing | Detox | Full mobile E2E |
| CI/CD | GitHub Actions | Automated pipelines |
| Project Mgmt | Jira | Tasks + sprints |
| Version Control | GitHub | Code + PRs |

---

# 3. Project Structure

```
memoir/
├── .github/
│   └── workflows/
│       ├── mobile-ci.yml          # Mobile: lint + test + build
│       ├── backend-ci.yml         # Backend: lint + test + deploy
│       ├── e2e.yml                # E2E tests on PR
│       └── release.yml            # Production release
│
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   └── signup.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx          # Home
│   │   │   │   ├── collections.tsx    # Collections list
│   │   │   │   ├── search.tsx         # Semantic search
│   │   │   │   └── profile.tsx        # Settings
│   │   │   ├── entry/
│   │   │   │   ├── new.tsx            # New entry
│   │   │   │   └── [id].tsx           # Entry detail
│   │   │   ├── collection/
│   │   │   │   ├── new.tsx
│   │   │   │   ├── [id].tsx           # Entries tab
│   │   │   │   ├── chapter.tsx        # Chapter tab
│   │   │   │   └── insights.tsx       # Insights tab
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── EntryCard.tsx
│   │   │   ├── RecordButton.tsx
│   │   │   ├── PhotoStrip.tsx
│   │   │   ├── CollectionCard.tsx
│   │   │   ├── ChapterView.tsx
│   │   │   ├── ShareCard.tsx
│   │   │   ├── EmotionBars.tsx
│   │   │   └── Paywall.tsx
│   │   ├── hooks/
│   │   │   ├── useRecording.ts
│   │   │   ├── useEntries.ts
│   │   │   ├── useCollections.ts
│   │   │   └── useSubscription.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── revenuecat.ts
│   │   ├── __tests__/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── screens/
│   │   ├── e2e/
│   │   │   ├── auth.e2e.ts
│   │   │   ├── entry.e2e.ts
│   │   │   └── collection.e2e.ts
│   │   ├── jest.config.ts
│   │   ├── .detoxrc.js
│   │   └── app.json
│   │
│   └── backend/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── entries.ts
│       │   │   ├── collections.ts
│       │   │   ├── chapters.ts
│       │   │   ├── search.ts
│       │   │   └── webhooks.ts
│       │   ├── workers/
│       │   │   ├── transcription.worker.ts
│       │   │   ├── analysis.worker.ts
│       │   │   ├── chapter.worker.ts
│       │   │   └── digest.worker.ts
│       │   ├── services/
│       │   │   ├── whisper.ts
│       │   │   ├── claude.ts
│       │   │   ├── embeddings.ts
│       │   │   ├── anonymizer.ts
│       │   │   └── pdf.ts
│       │   ├── jobs/
│       │   │   └── digest.cron.ts
│       │   └── index.ts
│       ├── __tests__/
│       │   ├── routes/
│       │   ├── workers/
│       │   └── services/
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       └── types.ts
│
└── README.md
```

---

# 4. Database Schema

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  revenuecat_id TEXT,
  settings JSONB DEFAULT '{
    "notifications": true,
    "digest_day": "friday",
    "writing_style": "warm",
    "reminder_time": "21:00"
  }',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENTRIES (voice + text + photos)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL DEFAULT 'voice',  -- 'voice' | 'text'
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  raw_text TEXT,
  transcript TEXT,
  image_urls TEXT[] DEFAULT '{}',
  emotions JSONB DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  location TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT has_content CHECK (audio_url IS NOT NULL OR raw_text IS NOT NULL),
  CONSTRAINT max_images CHECK (
    array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) <= 5
  )
);

-- COLLECTIONS
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'active',  -- 'active' | 'closed' | 'archived'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- COLLECTION ENTRIES (many-to-many)
CREATE TABLE collection_entries (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, entry_id)
);

-- CHAPTERS
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  style TEXT DEFAULT 'warm',  -- 'warm' | 'formal' | 'narrative'
  word_count INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT
);

-- DIGESTS
CREATE TABLE digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'weekly' | 'monthly'
  content TEXT NOT NULL,
  insights JSONB DEFAULT '{}',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- EMBEDDINGS
CREATE TABLE embeddings (
  entry_id UUID PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
  vector VECTOR(1536)
);

-- ROW-LEVEL SECURITY
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_entries" ON entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_collections" ON collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_collection_entries" ON collection_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

CREATE POLICY "users_own_chapters" ON chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

CREATE POLICY "users_own_digests" ON digests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_embeddings" ON embeddings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_id AND e.user_id = auth.uid())
  );

-- INDEXES
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX idx_collections_user ON collections(user_id, status);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat(vector vector_cosine_ops);
```

---

# 5. Environment Variables

### Mobile (`apps/mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
```

### Backend (`apps/backend/.env`)
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=
SENTRY_DSN=
```

### Backend Test (`apps/backend/.env.test`)
```env
NODE_ENV=test
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=test_service_key
OPENAI_API_KEY=test_key
ANTHROPIC_API_KEY=test_key
REDIS_URL=redis://localhost:6379
```

---

# 6. Core Processing Pipeline

```typescript
// apps/backend/src/workers/analysis.worker.ts

async function processEntry(entryId: string) {
  const entry = await db.entries.findById(entryId);

  // STEP 1: Transcription
  let transcript: string;
  if (entry.input_type === 'voice') {
    const audioBuffer = await supabase.storage.from('audio').download(entry.audio_url);
    transcript = await whisper.transcribe(audioBuffer);
  } else {
    transcript = entry.raw_text!;
  }
  await db.entries.update(entryId, { transcript });

  // STEP 2: Anonymize
  const { anonymized, nameMap } = anonymize(transcript);

  // STEP 3: Build content (text + optional images for Premium)
  const content: any[] = [
    { type: 'text', text: buildAnalysisPrompt(anonymized) }
  ];
  if (entry.image_urls?.length > 0) {
    for (const url of entry.image_urls) {
      const imageBase64 = await fetchImageAsBase64(url);
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
      });
    }
  }

  // STEP 4: Claude analysis
  const response = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content }]
  });
  const analysis = JSON.parse(response.content[0].text);
  const restored = deanonymize(analysis, nameMap);

  // STEP 5: Save
  await db.entries.update(entryId, {
    emotions: restored.emotions,
    people: restored.people,
    topics: restored.topics,
    processed: true
  });

  // STEP 6: Embedding
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: transcript
  });
  await db.embeddings.upsert({ entry_id: entryId, vector: data[0].embedding });
}
```

---

# 7. Claude Prompts

### Analysis Prompt
```typescript
function buildAnalysisPrompt(transcript: string): string {
  return `
Analyze this journal entry. Respond ONLY with valid JSON. No explanation.

Entry: "${transcript}"

{
  "emotions": { "joy": 0.0, "sadness": 0.0, "wonder": 0.0, "stress": 0.0,
    "contentment": 0.0, "nostalgia": 0.0, "gratitude": 0.0, "reflection": 0.0 },
  "people": ["Person A"],
  "topics": ["food", "travel"],
  "key_moment": "one sentence summary"
}
`;
}
```

### Chapter Writing Prompt
```typescript
function buildChapterPrompt(
  entries: Entry[], style: 'warm' | 'formal' | 'narrative',
  collectionName: string, dateRange: string
): string {
  const styles = {
    warm: 'Write with warmth and intimacy, like a letter to a close friend.',
    formal: 'Write in structured, reflective style. Clear paragraphs, thoughtful tone.',
    narrative: 'Write like a short story with scene-setting and narrative arc.'
  };
  const transcripts = entries
    .map((e, i) => `[Entry ${i+1} — ${e.created_at}]\n${e.transcript}`)
    .join('\n\n');

  return `
You are a literary memoir writer.
Collection: "${collectionName}" | Period: ${dateRange}
Style: ${styles[style]}
${entries.some(e => e.image_urls?.length > 0)
  ? 'Photos attached. Use them for atmosphere — never describe them literally.'
  : ''}
Guidelines: first person, authentic voice, emotional truth, 400–700 words,
no invented facts, no real names.

Entries:
${transcripts}

Write the chapter now.
`;
}
```

### Weekly Digest Prompt
```typescript
function buildWeeklyDigestPrompt(entries: Entry[], weekRange: string): string {
  const transcripts = entries.map(e => `[${e.created_at}] ${e.transcript}`).join('\n\n');
  return `
Write a warm weekly digest (150–250 words).
Period: ${weekRange}
Include: emotional tone, most memorable moment, one pattern noticed, encouraging closing.

Entries:
${transcripts}
`;
}
```

---

# 8. Feature Gating

```typescript
// packages/shared/types.ts
export const LIMITS = {
  free: {
    voiceMinutesPerMonth: 30,
    textEntriesPerMonth: 20,
    activeCollections: 1,
    photosPerEntry: 0,
    chapterWriting: false,
    monthlyDigest: false,
    semanticSearch: false,
    pdfExport: false,
    shareCards: false,
  },
  premium: {
    voiceMinutesPerMonth: Infinity,
    textEntriesPerMonth: Infinity,
    activeCollections: Infinity,
    photosPerEntry: 5,
    chapterWriting: true,
    monthlyDigest: true,
    semanticSearch: true,
    pdfExport: true,
    shareCards: true,
  }
};
```

---

# 9. Security & Privacy

### Anonymization Service
```typescript
// apps/backend/src/services/anonymizer.ts
export function anonymize(text: string) {
  const nameMap = new Map<string, string>();
  let counter = 0;
  const anonymized = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, (match) => {
    if (!nameMap.has(match)) {
      nameMap.set(match, `Person ${String.fromCharCode(65 + counter++)}`);
    }
    return nameMap.get(match)!;
  });
  return { anonymized, nameMap };
}

export function deanonymize(text: string, nameMap: Map<string, string>): string {
  let result = text;
  for (const [realName, alias] of nameMap) {
    result = result.replaceAll(alias, realName);
  }
  return result;
}
```

### Key Privacy Rules
- Microphone permission requested only on mic button tap
- Audio encrypted at rest (AES-256, Supabase Storage)
- Row-Level Security on all tables
- Claude + Whisper API: data not used for model training
- User can delete account → all data gone within 24 hours
- User can export all data as ZIP anytime

---

# 10. Testing Strategy

## 10.1 Testing Pyramid

```
        /‾‾‾‾‾‾‾‾‾‾‾\
       /   E2E (Detox)  \       ← Few, slow, high value
      /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
     / Integration Tests  \     ← Medium, API + DB
    /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
   /    Unit Tests (Jest)   \   ← Many, fast, cheap
  /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

## 10.2 Mobile Unit Tests (Jest + RNTL)

### Setup
```typescript
// apps/mobile/jest.config.ts
export default {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/react-native/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ]
};
```

### Component Tests
```typescript
// apps/mobile/__tests__/components/EntryCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EntryCard } from '@/components/EntryCard';

const mockEntry = {
  id: '1',
  input_type: 'voice' as const,
  transcript: 'Had ramen at 8am. Best thing I have eaten in years.',
  emotions: { joy: 0.9, contentment: 0.7 },
  image_urls: [],
  created_at: '2026-03-04T08:30:00Z',
  processed: true,
};

describe('EntryCard', () => {
  it('renders transcript text', () => {
    render(<EntryCard entry={mockEntry} onPress={jest.fn()} />);
    expect(screen.getByText(/Had ramen at 8am/)).toBeTruthy();
  });

  it('shows voice badge for voice entries', () => {
    render(<EntryCard entry={mockEntry} onPress={jest.fn()} />);
    expect(screen.getByText(/Voice/i)).toBeTruthy();
  });

  it('shows text badge for text entries', () => {
    const textEntry = { ...mockEntry, input_type: 'text' as const };
    render(<EntryCard entry={textEntry} onPress={jest.fn()} />);
    expect(screen.getByText(/Text/i)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<EntryCard entry={mockEntry} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('entry-card'));
    expect(onPress).toHaveBeenCalledWith(mockEntry.id);
  });

  it('shows photo count when images attached', () => {
    const entryWithPhotos = { ...mockEntry, image_urls: ['url1', 'url2'] };
    render(<EntryCard entry={entryWithPhotos} onPress={jest.fn()} />);
    expect(screen.getByText('2 photos')).toBeTruthy();
  });

  it('shows processing indicator when not processed', () => {
    const unprocessed = { ...mockEntry, processed: false };
    render(<EntryCard entry={unprocessed} onPress={jest.fn()} />);
    expect(screen.getByTestId('processing-indicator')).toBeTruthy();
  });
});
```

### Hook Tests
```typescript
// apps/mobile/__tests__/hooks/useRecording.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useRecording } from '@/hooks/useRecording';

jest.mock('expo-audio', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn().mockReturnValue('file://recording.m4a'),
    })),
  },
}));

describe('useRecording', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useRecording());
    expect(result.current.status).toBe('idle');
  });

  it('transitions to recording state on start', async () => {
    const { result } = renderHook(() => useRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.status).toBe('recording');
  });

  it('returns audio URI on stop', async () => {
    const { result } = renderHook(() => useRecording());
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    expect(result.current.audioUri).toBe('file://recording.m4a');
    expect(result.current.status).toBe('stopped');
  });

  it('handles permission denied gracefully', async () => {
    const Audio = require('expo-audio').Audio;
    Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const { result } = renderHook(() => useRecording());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe('Microphone permission denied');
  });
});
```

### Paywall Tests
```typescript
// apps/mobile/__tests__/components/Paywall.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Paywall } from '@/components/Paywall';

describe('Paywall', () => {
  it('shows upgrade prompt for free users', () => {
    render(<Paywall feature="photos" plan="free" onUpgrade={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText(/Upgrade to Premium/i)).toBeTruthy();
  });

  it('calls onUpgrade when button pressed', () => {
    const onUpgrade = jest.fn();
    render(<Paywall feature="photos" plan="free" onUpgrade={onUpgrade} onDismiss={jest.fn()} />);
    fireEvent.press(screen.getByText(/Upgrade/i));
    expect(onUpgrade).toHaveBeenCalled();
  });

  it('does not render for premium users', () => {
    const { toJSON } = render(
      <Paywall feature="photos" plan="premium" onUpgrade={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });
});
```

## 10.3 Backend Unit Tests (Vitest)

### Setup
```typescript
// apps/backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      threshold: { lines: 80, functions: 80, branches: 70 }
    }
  }
});
```

### Anonymizer Tests
```typescript
// apps/backend/__tests__/services/anonymizer.test.ts
import { describe, it, expect } from 'vitest';
import { anonymize, deanonymize } from '../../src/services/anonymizer';

describe('anonymize', () => {
  it('replaces full names with aliases', () => {
    const { anonymized } = anonymize('I met John Smith today.');
    expect(anonymized).toBe('I met Person A today.');
    expect(anonymized).not.toContain('John Smith');
  });

  it('uses consistent aliases for the same name', () => {
    const { anonymized } = anonymize('John Smith said hello. Then John Smith left.');
    expect(anonymized).toBe('Person A said hello. Then Person A left.');
  });

  it('assigns different aliases for different names', () => {
    const { anonymized, nameMap } = anonymize('John Smith and Jane Doe came.');
    expect(nameMap.size).toBe(2);
    expect(anonymized).toContain('Person A');
    expect(anonymized).toContain('Person B');
  });

  it('returns empty nameMap for text without names', () => {
    const { nameMap } = anonymize('Had ramen at 8am. It was amazing.');
    expect(nameMap.size).toBe(0);
  });
});

describe('deanonymize', () => {
  it('restores original names', () => {
    const { anonymized, nameMap } = anonymize('I met John Smith today.');
    const restored = deanonymize(anonymized, nameMap);
    expect(restored).toContain('John Smith');
  });

  it('handles text with no aliases', () => {
    const nameMap = new Map<string, string>();
    const result = deanonymize('No names here.', nameMap);
    expect(result).toBe('No names here.');
  });
});
```

### Whisper Service Tests
```typescript
// apps/backend/__tests__/services/whisper.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribe } from '../../src/services/whisper';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue({ text: 'Hello world' })
      }
    }
  }))
}));

describe('transcribe', () => {
  it('returns transcribed text', async () => {
    const mockBuffer = Buffer.from('fake audio');
    const result = await transcribe(mockBuffer);
    expect(result).toBe('Hello world');
  });

  it('throws on API error', async () => {
    const OpenAI = require('openai').default;
    OpenAI.mockImplementationOnce(() => ({
      audio: {
        transcriptions: {
          create: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    }));
    const mockBuffer = Buffer.from('fake audio');
    await expect(transcribe(mockBuffer)).rejects.toThrow('API Error');
  });
});
```

### Claude Service Tests
```typescript
// apps/backend/__tests__/services/claude.test.ts
import { describe, it, expect, vi } from 'vitest';
import { analyzeEntry, writeChapter } from '../../src/services/claude';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            emotions: { joy: 0.8, contentment: 0.6 },
            people: [],
            topics: ['food', 'solitude'],
            key_moment: 'Had ramen alone at 8am'
          })
        }]
      })
    }
  }))
}));

describe('analyzeEntry', () => {
  it('returns parsed analysis object', async () => {
    const result = await analyzeEntry('Had ramen at 8am. Best meal in years.');
    expect(result.emotions.joy).toBeGreaterThan(0);
    expect(result.topics).toContain('food');
    expect(result.key_moment).toBeTruthy();
  });

  it('handles image attachments', async () => {
    const result = await analyzeEntry(
      'Visited temple.',
      ['https://example.com/photo.jpg']
    );
    expect(result).toBeTruthy();
  });
});

describe('writeChapter', () => {
  it('returns chapter content string', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'There is something about arriving...' }]
        })
      }
    }));

    const mockEntries = [{
      id: '1', transcript: 'Arrived in Tokyo.', created_at: '2026-03-03', image_urls: []
    }];

    const result = await writeChapter(mockEntries, 'warm', 'Tokyo Trip', 'Mar 3–16');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  });
});
```

## 10.4 Integration Tests (Backend API)

```typescript
// apps/backend/__tests__/routes/entries.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/index';

let app: any;
let authToken: string;

beforeAll(async () => {
  app = await build({ testing: true });
  await app.ready();
  // Create test user and get token
  const res = await app.inject({
    method: 'POST',
    url: '/auth/test-token',
    payload: { email: 'test@memoir.app' }
  });
  authToken = res.json().token;
});

afterAll(async () => {
  await app.close();
});

describe('POST /entries', () => {
  it('creates a text entry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        input_type: 'text',
        raw_text: 'Had ramen at 8am. Amazing.'
      }
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeTruthy();
    expect(res.json().input_type).toBe('text');
  });

  it('rejects entry without content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { input_type: 'text' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      payload: { input_type: 'text', raw_text: 'test' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('blocks photo upload for free users', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: {
        input_type: 'text',
        raw_text: 'test',
        image_urls: ['https://example.com/photo.jpg']
      }
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toContain('Premium');
  });
});

describe('GET /entries', () => {
  it('returns user entries paginated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/entries?page=1&limit=10',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().entries)).toBe(true);
    expect(res.json().total).toBeDefined();
  });
});

describe('POST /collections/:id/close', () => {
  it('closes collection and triggers chapter generation', async () => {
    // Create collection
    const col = await app.inject({
      method: 'POST',
      url: '/collections',
      headers: { Authorization: `Bearer ${authToken}` },
      payload: { name: 'Tokyo Trip' }
    });
    const collectionId = col.json().id;

    // Close it
    const res = await app.inject({
      method: 'POST',
      url: `/collections/${collectionId}/close`,
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('closed');
    // Chapter job should be queued (not yet written)
    expect(res.json().chapter_queued).toBe(true);
  });
});
```

## 10.5 E2E Tests (Detox)

### Setup
```javascript
// apps/mobile/.detoxrc.js
module.exports = {
  testRunner: { args: { '$0': 'jest', config: 'e2e/jest.config.js' } },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug/memoir.app',
      build: 'xcodebuild ...'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    }
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7_API_34' } }
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' }
  }
};
```

### Auth E2E
```typescript
// apps/mobile/e2e/auth.e2e.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('shows login screen on launch', async () => {
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
  });

  it('navigates to signup from login', async () => {
    await element(by.id('signup-link')).tap();
    await detoxExpect(element(by.id('signup-screen'))).toBeVisible();
  });

  it('signs up with email and password', async () => {
    await element(by.id('email-input')).typeText('test@memoir.app');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('signup-button')).tap();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('logs out and returns to login', async () => {
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
  });
});
```

### Entry E2E
```typescript
// apps/mobile/e2e/entry.e2e.ts
describe('Creating Entries', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });

  it('creates a text entry', async () => {
    await element(by.id('new-entry-button')).tap();
    await element(by.id('text-input')).typeText('Had ramen at 8am. Amazing.');
    await element(by.id('save-entry-button')).tap();
    await detoxExpect(element(by.id('entry-card-0'))).toBeVisible();
  });

  it('shows processing state after saving', async () => {
    await detoxExpect(element(by.id('processing-indicator'))).toBeVisible();
  });

  it('creates a voice entry', async () => {
    await element(by.id('new-entry-button')).tap();
    await element(by.id('record-button')).tap();
    await new Promise(r => setTimeout(r, 2000)); // record 2s
    await element(by.id('record-button')).tap(); // stop
    await element(by.id('save-entry-button')).tap();
    await detoxExpect(element(by.id('voice-badge'))).toBeVisible();
  });

  it('shows paywall when free user tries to add photos', async () => {
    await element(by.id('new-entry-button')).tap();
    await element(by.id('add-photo-button')).tap();
    await detoxExpect(element(by.id('paywall-screen'))).toBeVisible();
  });
});
```

### Collection E2E
```typescript
// apps/mobile/e2e/collection.e2e.ts
describe('Collections', () => {
  it('creates a collection', async () => {
    await element(by.id('collections-tab')).tap();
    await element(by.id('new-collection-button')).tap();
    await element(by.id('collection-name-input')).typeText('Tokyo Trip');
    await element(by.id('create-collection-button')).tap();
    await detoxExpect(element(by.text('Tokyo Trip'))).toBeVisible();
  });

  it('adds entry to collection', async () => {
    await element(by.text('Tokyo Trip')).tap();
    await element(by.id('add-entries-button')).tap();
    await element(by.id('entry-checkbox-0')).tap();
    await element(by.id('confirm-add-button')).tap();
    await detoxExpect(element(by.id('entry-in-collection-0'))).toBeVisible();
  });

  it('closes collection and shows chapter pending', async () => {
    await element(by.id('close-collection-button')).tap();
    await element(by.id('confirm-close-button')).tap();
    await detoxExpect(element(by.id('chapter-pending-badge'))).toBeVisible();
  });
});
```

---

# 11. GitHub Actions — CI/CD Pipelines

## 11.1 Mobile CI Pipeline

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [main, develop]
    paths: ['apps/mobile/**']
  pull_request:
    branches: [main, develop]
    paths: ['apps/mobile/**']

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && npm run lint
      - run: cd apps/mobile && npm run type-check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && npm test -- --coverage --ci
      - uses: codecov/codecov-action@v3
        with:
          flags: mobile
          directory: apps/mobile/coverage

  build-ios:
    name: Build iOS
    runs-on: macos-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && eas build --platform ios --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && eas build --platform android --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 11.2 Backend CI/CD Pipeline

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['apps/backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['apps/backend/**']

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd apps/backend && npm ci
      - run: cd apps/backend && npm run lint
      - run: cd apps/backend && npm run type-check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports: ['6379:6379']
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd apps/backend && npm ci
      - run: cd apps/backend && npm test -- --coverage
        env:
          NODE_ENV: test
          REDIS_URL: redis://localhost:6379
          SUPABASE_URL: http://localhost:54321
          SUPABASE_SERVICE_KEY: test_key
          OPENAI_API_KEY: test_key
          ANTHROPIC_API_KEY: test_key
      - uses: codecov/codecov-action@v3
        with:
          flags: backend

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway (Staging)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: memoir-backend-staging

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway (Production)
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: memoir-backend-production
      - name: Notify Sentry of deployment
        run: |
          curl -sL https://sentry.io/api/0/organizations/${{ secrets.SENTRY_ORG }}/releases/ \
            -H "Authorization: Bearer ${{ secrets.SENTRY_TOKEN }}" \
            -d '{"version":"${{ github.sha }}","projects":["memoir-backend"]}'
```

## 11.3 E2E Pipeline

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'   # Every night at 2am

jobs:
  e2e-ios:
    name: E2E — iOS Simulator
    runs-on: macos-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd apps/mobile && npm ci
      - name: Build app for Detox
        run: cd apps/mobile && npx detox build --configuration ios.sim.debug
      - name: Run Detox E2E
        run: cd apps/mobile && npx detox test --configuration ios.sim.debug --ci
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: detox-artifacts-ios
          path: apps/mobile/artifacts

  e2e-android:
    name: E2E — Android Emulator
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          script: |
            cd apps/mobile && npm ci
            npx detox build --configuration android.emu.debug
            npx detox test --configuration android.emu.debug --ci
```

## 11.4 Release Pipeline

```yaml
# .github/workflows/release.yml
name: Production Release

on:
  push:
    tags:
      - 'v*'   # triggered by: git tag v1.0.0 && git push --tags

jobs:
  release-ios:
    name: Release iOS to App Store
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && eas submit --platform ios --latest
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          ASC_API_KEY_ID: ${{ secrets.ASC_API_KEY_ID }}
          ASC_API_KEY_ISSUER_ID: ${{ secrets.ASC_API_KEY_ISSUER_ID }}
          ASC_API_KEY: ${{ secrets.ASC_API_KEY }}

  release-android:
    name: Release Android to Play Store
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && npm ci
      - run: cd apps/mobile && eas submit --platform android --latest
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}

  create-github-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

## 11.5 GitHub Secrets Required

Add these in GitHub → Settings → Secrets → Actions:

```
EXPO_TOKEN                    # from expo.dev account
RAILWAY_TOKEN                 # from railway.app
SENTRY_ORG                    # from sentry.io
SENTRY_TOKEN                  # from sentry.io
ASC_API_KEY_ID                # Apple App Store Connect
ASC_API_KEY_ISSUER_ID         # Apple App Store Connect
ASC_API_KEY                   # Apple App Store Connect (base64)
GOOGLE_SERVICE_ACCOUNT_KEY    # Google Play Console (JSON base64)
CODECOV_TOKEN                 # from codecov.io
```

## 11.6 Branch Strategy

```
main          ← production only. Protected. Requires PR + passing CI.
develop       ← staging. All features merge here first.
feature/*     ← individual feature branches (feature/entry-screen)
fix/*         ← bug fixes (fix/audio-upload-crash)
release/*     ← release prep (release/v1.0.0)
```

**PR Rules (set in GitHub → Branch Protection):**
- Require CI to pass before merge
- Require 1 reviewer approval
- No direct pushes to `main` or `develop`
- Auto-delete branches after merge

---

# 12. Jira Project Structure

## 12.1 Project Setup

```
Project Name:  Memoir
Project Key:   MEM
Type:          Scrum
Sprints:       2-week sprints (6 sprints total = 12 weeks)
```

## 12.2 Issue Types
- **Epic** — major feature area
- **Story** — user-facing feature (from user's perspective)
- **Task** — technical implementation work
- **Bug** — defect
- **Spike** — research/investigation

## 12.3 Custom Fields
- **Platform:** Mobile / Backend / Both
- **Sprint:** Sprint 1–6
- **Story Points:** 1, 2, 3, 5, 8, 13

## 12.4 Epics

| Epic Key | Epic Name | Description |
|---|---|---|
| MEM-E1 | Foundation | Project setup, auth, basic entry creation |
| MEM-E2 | AI Pipeline | Transcription, analysis, embeddings |
| MEM-E3 | Collections | Create, manage, close collections |
| MEM-E4 | Chapter Writing | AI literary chapter generation |
| MEM-E5 | Photos | Image attachments + Claude Vision |
| MEM-E6 | Search | Semantic memory search |
| MEM-E7 | Digests | Weekly + monthly AI digests |
| MEM-E8 | Monetization | RevenueCat + Paywall + Premium gating |
| MEM-E9 | Security | Encryption, privacy, GDPR compliance |
| MEM-E10 | Export & Share | PDF, Instagram cards, share links |
| MEM-E11 | Testing | Unit, integration, E2E coverage |
| MEM-E12 | CI/CD | GitHub Actions pipelines |
| MEM-E13 | Launch | App Store, Play Store, Product Hunt |

---

## 12.5 Full Jira Task List

### ── EPIC MEM-E1: Foundation ──

**MEM-1 — Project Initialization**
- Type: Task | Points: 2 | Sprint: 1
- Initialize monorepo with npm workspaces
- Create `apps/mobile` with `npx create-expo-app memoir --template`
- Create `apps/backend` with Fastify
- Create `packages/shared` for shared types
- Set up `.gitignore`, `README.md`, `.env.example`

**MEM-2 — Supabase Setup**
- Type: Task | Points: 3 | Sprint: 1
- Create Supabase project
- Run full database schema SQL (from Section 4)
- Enable Row-Level Security on all tables
- Create storage buckets: `audio`, `images`, `pdfs`
- Test connection from backend

**MEM-3 — Authentication Screens (Mobile)**
- Type: Story | Points: 5 | Sprint: 1
- As a user, I can sign up with email and password
- As a user, I can log in to my account
- As a user, I can reset my password
- Screens: Login, Signup, ForgotPassword
- Supabase Auth integration
- Persist session with SecureStore

**MEM-4 — Auth Tests (Mobile)**
- Type: Task | Points: 3 | Sprint: 1
- Unit tests for auth screens (RNTL)
- E2E tests: signup, login, logout (Detox)
- Mock Supabase Auth in test environment

**MEM-5 — Entry Creation Screen (Text)**
- Type: Story | Points: 5 | Sprint: 1
- As a user, I can type a journal entry and save it
- Text area with character count
- Save button → POST /entries with input_type: 'text'
- Loading state + success feedback
- Navigate to entries list after save

**MEM-6 — Entry Creation Screen (Voice)**
- Type: Story | Points: 5 | Sprint: 1
- As a user, I can record my voice and save it as an entry
- Mic button with record/stop states
- Request microphone permission on tap (not on launch)
- Upload audio to Supabase Storage
- POST /entries with input_type: 'voice', audio_url

**MEM-7 — Entries API (Backend)**
- Type: Task | Points: 5 | Sprint: 1
- POST /entries — create entry (voice or text)
- GET /entries — list user entries (paginated)
- GET /entries/:id — get single entry
- DELETE /entries/:id — delete entry
- Auth middleware on all routes
- Input validation with Zod

**MEM-8 — Entries List Screen (Mobile)**
- Type: Story | Points: 3 | Sprint: 1
- As a user, I can see all my entries in a timeline
- Entry cards with: type badge, timestamp, transcript preview, emotion tags
- Pull to refresh
- Infinite scroll (pagination)
- Empty state for new users

**MEM-9 — Backend Unit Tests**
- Type: Task | Points: 3 | Sprint: 1
- Tests for /entries routes (Vitest + Supertest)
- Tests for auth middleware
- Minimum 80% coverage on new code

---

### ── EPIC MEM-E2: AI Pipeline ──

**MEM-10 — BullMQ + Redis Setup**
- Type: Task | Points: 3 | Sprint: 2
- Install and configure BullMQ + Redis
- Create queue: `entry-processing`
- Add job to queue when entry is saved
- Create worker process file

**MEM-11 — Whisper Transcription Worker**
- Type: Task | Points: 5 | Sprint: 2
- Worker picks up voice entries from queue
- Download audio from Supabase Storage
- Send to Whisper API
- Save transcript to entry
- Text entries: copy raw_text to transcript (skip Whisper)
- Mark entry as `processed: true`
- Push notification: "Your entry is ready"

**MEM-12 — Claude Analysis Worker**
- Type: Task | Points: 5 | Sprint: 2
- Anonymize transcript before sending to Claude
- Build analysis prompt (Section 7)
- Parse JSON response
- Deanonymize results
- Save emotions, people, topics to entry
- Generate embedding (text-embedding-3-small)
- Save vector to embeddings table

**MEM-13 — Anonymizer Service**
- Type: Task | Points: 3 | Sprint: 2
- Implement anonymize() function
- Implement deanonymize() function
- Unit tests for both functions (edge cases)

**MEM-14 — AI Pipeline Tests**
- Type: Task | Points: 5 | Sprint: 2
- Unit tests: Whisper service (mock API)
- Unit tests: Claude service (mock API)
- Unit tests: Anonymizer service
- Integration test: full pipeline for text entry
- Integration test: full pipeline for voice entry

---

### ── EPIC MEM-E3: Collections ──

**MEM-15 — Collections API (Backend)**
- Type: Task | Points: 5 | Sprint: 2
- POST /collections — create collection
- GET /collections — list user collections
- GET /collections/:id — collection detail with entries
- PATCH /collections/:id — update name/description
- POST /collections/:id/close — close collection
- POST /collections/:id/entries — add entries to collection
- DELETE /collections/:id/entries/:entryId — remove entry

**MEM-16 — Create Collection Screen (Mobile)**
- Type: Story | Points: 3 | Sprint: 2
- As a user, I can create a named collection
- Name input + optional description
- Calendar picker for start date
- POST /collections on save

**MEM-17 — Collection Detail Screen (Mobile)**
- Type: Story | Points: 5 | Sprint: 2
- As a user, I can see all entries in a collection
- Tab bar: Entries / Chapter / Insights
- Stats: total entries, voice count, text count, photo count
- Add entries button
- Close collection button (with confirmation dialog)
- "Chapter pending" badge after closing

**MEM-18 — Collections List Screen (Mobile)**
- Type: Story | Points: 3 | Sprint: 2
- As a user, I can see all my collections
- Cards showing: name, status, entry count, date range
- Active collections badge in gold
- Closed collections show "Chapter ready"

**MEM-19 — Collections Tests**
- Type: Task | Points: 3 | Sprint: 2
- Backend: route tests for all collection endpoints
- Mobile: component tests for CollectionCard
- Mobile: E2E — create, add entry, close collection

---

### ── EPIC MEM-E4: Chapter Writing ──

**MEM-20 — Chapter Generation Worker**
- Type: Task | Points: 8 | Sprint: 3
- Triggered when collection is closed
- Fetch all entries for collection
- Build chapter prompt (Section 7b)
- Call Claude API with entries + photos
- Save chapter to DB
- Send push notification: "Your chapter is ready"

**MEM-21 — Chapter View Screen (Mobile)**
- Type: Story | Points: 5 | Sprint: 3
- As a user, I can read my AI-written chapter
- Literary text display with Playfair Display font
- Style selector: Warm / Formal / Narrative
- Regenerate with new style button
- Word count + generation timestamp
- Scroll with chapter photos inline

**MEM-22 — Chapter Regeneration**
- Type: Story | Points: 3 | Sprint: 3
- As a premium user, I can regenerate my chapter in a different style
- POST /chapters/:id/regenerate with new style
- Free users: locked (paywall)

**MEM-23 — Chapter Tests**
- Type: Task | Points: 5 | Sprint: 3
- Unit tests: buildChapterPrompt function
- Integration test: chapter worker with mocked Claude
- Mobile: chapter view component tests

---

### ── EPIC MEM-E5: Photos ──

**MEM-24 — Photo Upload (Mobile)**
- Type: Story | Points: 8 | Sprint: 3
- As a premium user, I can attach up to 5 photos to any entry
- Expo Image Picker integration
- Compress to 1200px max with Expo Image Manipulator
- Upload to Supabase Storage
- Show photo strip on entry card
- Paywall for free users

**MEM-25 — Photo Storage (Backend)**
- Type: Task | Points: 3 | Sprint: 3
- Validate max 5 images per entry
- Validate image file types (jpg, png, webp)
- Validate file size (max 5MB before compression)
- Store URLs in entry.image_urls array

**MEM-26 — Claude Vision Integration**
- Type: Task | Points: 5 | Sprint: 3
- Update analysis worker to include images in Claude request
- Update chapter worker to include images
- Test that photos improve narrative quality
- Fallback: if image fetch fails, continue without it

**MEM-27 — Photo Tests**
- Type: Task | Points: 5 | Sprint: 3
- Unit tests: image compression utility
- Unit tests: Claude vision request builder
- Mobile: E2E — paywall appears for free user on photo tap
- Mobile: E2E — premium user can attach and save photo

---

### ── EPIC MEM-E6: Search ──

**MEM-28 — Semantic Search API (Backend)**
- Type: Task | Points: 5 | Sprint: 4
- POST /search — semantic search endpoint
- Input: query string
- Generate query embedding
- pgvector similarity search
- Return top 10 matching entries with similarity score

**MEM-29 — Search Screen (Mobile)**
- Type: Story | Points: 5 | Sprint: 4
- As a premium user, I can search my memories with natural language
- Search input: "every time I felt homesick"
- Results list with similarity-ranked entry cards
- Highlight matching context in result
- Paywall for free users

**MEM-30 — Search Tests**
- Type: Task | Points: 3 | Sprint: 4
- Backend: search endpoint with mock pgvector
- Mobile: search screen component tests

---

### ── EPIC MEM-E7: Digests ──

**MEM-31 — Weekly Digest Worker**
- Type: Task | Points: 5 | Sprint: 4
- Cron job every Friday at 8am (user timezone)
- Fetch entries from past 7 days per user
- Build digest prompt (Section 7c)
- Generate digest with Claude
- Save to digests table
- Send push notification
- Send email via Resend

**MEM-32 — Monthly Digest Worker**
- Type: Task | Points: 5 | Sprint: 4
- Cron job on last day of month
- Premium users only
- Deeper analysis: top emotions, patterns, key people
- Send via push + email

**MEM-33 — Digest Display Screen (Mobile)**
- Type: Story | Points: 3 | Sprint: 4
- As a user, I can read past digests
- Digest cards with: week/month label, summary text
- Archive list sorted by date
- Weekly digest for free users, monthly for premium

**MEM-34 — Digest Tests**
- Type: Task | Points: 3 | Sprint: 4
- Unit tests: digest workers (mock Claude)
- Unit tests: cron job scheduling logic
- Integration test: digest email sending (Resend mock)

---

### ── EPIC MEM-E8: Monetization ──

**MEM-35 — RevenueCat Setup**
- Type: Task | Points: 5 | Sprint: 5
- Create RevenueCat project
- Configure iOS + Android products ($7/month, $60/year)
- 14-day free trial setup
- Install react-native-purchases SDK
- Hook up to user account

**MEM-36 — Paywall Screen (Mobile)**
- Type: Story | Points: 5 | Sprint: 5
- As a free user, I see an upgrade screen when I hit limits
- Beautiful paywall UI with feature list
- Monthly vs Annual toggle
- "Start 14-day free trial" CTA
- Restore purchase button

**MEM-37 — Feature Gating**
- Type: Task | Points: 5 | Sprint: 5
- Implement LIMITS object (Section 8)
- useSubscription hook
- Gate photos, chapter writing, search, monthly digest, PDF
- Track monthly voice minutes usage
- Track monthly text entry count
- Backend: validate plan on all premium endpoints

**MEM-38 — Webhook: RevenueCat → Backend**
- Type: Task | Points: 3 | Sprint: 5
- POST /webhooks/revenuecat endpoint
- Handle: purchase, renewal, cancellation, refund
- Update user.plan in database accordingly

**MEM-39 — Monetization Tests**
- Type: Task | Points: 5 | Sprint: 5
- Unit tests: LIMITS feature gating logic
- Unit tests: RevenueCat webhook handler
- Mobile: paywall renders for free users
- Mobile: paywall doesn't render for premium users
- E2E: free user hits limit → paywall shown

---

### ── EPIC MEM-E9: Security ──

**MEM-40 — Privacy Dashboard Screen (Mobile)**
- Type: Story | Points: 5 | Sprint: 5
- As a user, I can see exactly what data is stored about me
- Show: entry count, audio storage used, photos stored
- Show: AI processing status
- Links to: export data, delete account, privacy policy

**MEM-41 — Data Export**
- Type: Story | Points: 5 | Sprint: 5
- As a user, I can download all my data as a ZIP file
- ZIP contains: all entries (JSON), all transcripts (TXT), all chapters (TXT), all audio files
- POST /account/export → generates ZIP → emails download link

**MEM-42 — Account Deletion**
- Type: Story | Points: 3 | Sprint: 5
- As a user, I can permanently delete my account
- Confirmation dialog with email verification
- Soft delete: 30-day recovery window
- Hard delete: all data removed after 30 days
- Cancels RevenueCat subscription

**MEM-43 — Security Audit**
- Type: Spike | Points: 3 | Sprint: 5
- Audit all RLS policies
- Verify no data leaks across users
- Test API with invalid tokens
- Verify image upload size limits enforced

---

### ── EPIC MEM-E10: Export & Share ──

**MEM-44 — PDF Export**
- Type: Story | Points: 8 | Sprint: 5
- As a premium user, I can export my chapter as a PDF
- PDF includes: chapter text + photos inline (book-style layout)
- Generated on backend with puppeteer or react-pdf
- Stored in Supabase Storage
- Download link sent via push notification

**MEM-45 — Instagram Share Card**
- Type: Story | Points: 5 | Sprint: 5
- As a user, I can share a beautiful image card from any chapter
- Card: quote + photo background + "Memoir" watermark
- Generated as PNG on backend
- Native share sheet on mobile

**MEM-46 — Export Tests**
- Type: Task | Points: 3 | Sprint: 5
- Unit tests: PDF generation service
- Unit tests: share card image generation
- Integration test: export endpoint

---

### ── EPIC MEM-E11: Testing ──

**MEM-47 — Test Coverage Audit**
- Type: Task | Points: 3 | Sprint: 6
- Check coverage reports for mobile and backend
- Identify gaps below 80% threshold
- Write missing tests

**MEM-48 — E2E Full Regression**
- Type: Task | Points: 5 | Sprint: 6
- Run full Detox suite on iOS simulator
- Run full Detox suite on Android emulator
- Fix any failing tests
- Record test videos for reference

---

### ── EPIC MEM-E12: CI/CD ──

**MEM-49 — GitHub Actions Setup**
- Type: Task | Points: 5 | Sprint: 1
- Create `mobile-ci.yml` (lint + test + build)
- Create `backend-ci.yml` (lint + test + deploy)
- Set up all required GitHub Secrets
- Test pipelines with a dummy PR

**MEM-50 — E2E Pipeline**
- Type: Task | Points: 3 | Sprint: 4
- Create `e2e.yml` pipeline
- Run on PRs to main
- Run nightly on schedule
- Upload artifacts on failure

**MEM-51 — Release Pipeline**
- Type: Task | Points: 3 | Sprint: 6
- Create `release.yml` pipeline
- Tag-triggered (v*)
- Submit to App Store + Play Store via EAS Submit
- Create GitHub Release with auto-generated notes

**MEM-52 — Staging Environment**
- Type: Task | Points: 3 | Sprint: 2
- Create Railway staging environment
- Separate Supabase project for staging
- Deploy develop branch → staging automatically
- Smoke test after each staging deploy

---

### ── EPIC MEM-E13: Launch ──

**MEM-53 — App Store Preparation**
- Type: Task | Points: 5 | Sprint: 6
- App name, subtitle, keywords, description
- 6 screenshots (all required sizes)
- App preview video (optional but recommended)
- Privacy policy URL (getmemoir.com/privacy)
- Age rating: 4+
- Submit for review (1–3 days)

**MEM-54 — Google Play Preparation**
- Type: Task | Points: 5 | Sprint: 6
- Store listing: title, short description, full description
- Feature graphic (1024x500)
- Screenshots (phone + tablet)
- Content rating questionnaire
- Privacy policy URL
- Submit for review (hours to 2 days)

**MEM-55 — Landing Page**
- Type: Task | Points: 2 | Sprint: 6
- Deploy landing page to getmemoir.com
- Add App Store + Google Play download buttons
- Remove waitlist form (replace with download links)
- Add privacy policy page

**MEM-56 — Product Hunt Launch**
- Type: Task | Points: 3 | Sprint: 6
- Create Product Hunt page (maker account)
- Prepare: tagline, description, gallery (5 images + 1 video)
- Schedule launch day
- Prepare "hunter" (someone with followers to post)
- Notify beta users to upvote on launch day

**MEM-57 — Beta Testing**
- Type: Task | Points: 3 | Sprint: 6
- Invite 50–100 beta testers via TestFlight + Play Console
- Create feedback form (Tally or Typeform)
- 2-week beta period
- Fix critical bugs from feedback
- Collect testimonials for App Store listing

---

## 12.6 Sprint Breakdown

| Sprint | Weeks | Epics | Key Deliverable |
|---|---|---|---|
| Sprint 1 | 1–2 | E1, E12 (setup) | Auth + entry creation + CI pipeline live |
| Sprint 2 | 3–4 | E2, E3 | AI analysis running + Collections working |
| Sprint 3 | 5–6 | E4, E5 | Chapters writing + Photos attached |
| Sprint 4 | 7–8 | E6, E7 | Search + Digests live |
| Sprint 5 | 9–10 | E8, E9, E10 | Payments + Privacy + PDF/Share |
| Sprint 6 | 11–12 | E11, E12, E13 | Full testing + Launch |

---

## 12.7 Jira Quick Setup Steps

1. Go to jira.atlassian.com → Create project → Scrum
2. Name: **Memoir** | Key: **MEM**
3. Create Epics (MEM-E1 through MEM-E13) first
4. Create 6 Sprints (2 weeks each)
5. Create all issues above, link each to its Epic
6. Set story points
7. Add Sprint to each issue
8. Start Sprint 1

---

# 13. Development Roadmap — 12 Weeks

### Week 1 — Foundation
- MEM-1: Monorepo setup
- MEM-2: Supabase setup + schema
- MEM-3: Auth screens
- MEM-5: Text entry screen
- MEM-6: Voice entry screen
- MEM-49: CI/CD pipelines

### Week 2 — Backend + Collections
- MEM-7: Entries API
- MEM-8: Entries list screen
- MEM-15: Collections API
- MEM-16: Create collection screen
- MEM-4, MEM-9: Tests

### Week 3 — AI Pipeline
- MEM-10: BullMQ setup
- MEM-11: Whisper worker
- MEM-12: Claude analysis worker
- MEM-13: Anonymizer
- MEM-14: AI tests

### Week 4 — Collections UI + Staging
- MEM-17: Collection detail screen
- MEM-18: Collections list
- MEM-52: Staging environment
- MEM-19: Collection tests

### Week 5 — Chapters + Photos
- MEM-20: Chapter generation worker
- MEM-21: Chapter view screen
- MEM-24: Photo upload (mobile)
- MEM-25: Photo storage (backend)
- MEM-26: Claude Vision

### Week 6 — Photos Complete + Search
- MEM-27: Photo tests
- MEM-28: Semantic search API
- MEM-29: Search screen
- MEM-22: Chapter regeneration

### Week 7 — Digests
- MEM-31: Weekly digest worker
- MEM-32: Monthly digest worker
- MEM-33: Digest screen
- MEM-34: Digest tests
- MEM-50: E2E pipeline

### Week 8 — Monetization
- MEM-35: RevenueCat setup
- MEM-36: Paywall screen
- MEM-37: Feature gating
- MEM-38: RevenueCat webhook
- MEM-39: Monetization tests

### Week 9 — Security + Export
- MEM-40: Privacy dashboard
- MEM-41: Data export
- MEM-42: Account deletion
- MEM-43: Security audit
- MEM-44: PDF export
- MEM-45: Share cards

### Week 10 — Polish
- MEM-46: Export tests
- MEM-30: Search tests
- Error handling + edge cases
- Performance optimization
- Onboarding flow (3 screens)
- Empty states + loading skeletons

### Week 11 — Beta + Full Testing
- MEM-47: Coverage audit
- MEM-48: E2E regression
- MEM-57: Beta testing (50–100 users)
- Fix critical bugs

### Week 12 — Launch
- MEM-53: App Store submission
- MEM-54: Google Play submission
- MEM-51: Release pipeline
- MEM-55: Landing page live
- MEM-56: Product Hunt launch

---

# 14. Future Features (Post-Launch)

### Month 3–4 — Social
- Instagram share card with photo background
- Public collection links (shareable web page)
- Private sharing with family (invite link)

### Month 5–6 — Collaboration
- Collaborative collections (2 people, 1 chapter)
- Family album mode

### Month 7–9 — Publishing
- Physical book printing ($35–60 via Lulu API)
- Optional public profile — "Read Yazan's story"
- Follow other people's open stories

---

# 15. Cost & Revenue

### Cost Per User / Month

| User Type | Whisper | Claude | Storage | Total |
|---|---|---|---|---|
| Voice-heavy | ~$0.18 | ~$1.20 | ~$0.10 | **~$1.50** |
| Text-only | $0.00 | ~$1.00 | ~$0.01 | **~$1.00** |
| Photo-heavy | ~$0.18 | ~$1.50 | ~$0.01 | **~$1.70** |

**Premium = $7/month → 76–86% gross margin**

### Revenue Projections

| Premium Users | Revenue | AI Costs | Net |
|---|---|---|---|
| 300 | $2,100 | $450 | ~$1,500 |
| 1,000 | $7,000 | $1,500 | ~$5,000 |
| 3,000 | $21,000 | $4,500 | ~$15,000 |
| 10,000 | $70,000 | $15,000 | ~$52,000 |

---

# 16. How to Use This Plan With Claude

## Starting a Session in VS Code

```
I am building "Memoir" — an AI journaling app.
Stack: React Native (Expo) + Node.js + Supabase + Claude API + Whisper.

Current task: [paste Jira ticket — e.g. MEM-6: Voice Entry Screen]
Relevant plan section: [paste section 6 or 7 or whichever applies]

Let's build this step by step. Start with the mobile side.
```

## When Stuck

```
I am working on MEM-[X]: [task name] for Memoir.
Here is my current code:
[paste code]

The problem is:
[describe the problem]

Here is the error:
[paste error]
```

## Starting a New Week

```
I finished Sprint [X] of Memoir. All passing.
Now starting Sprint [X+1].
First task: MEM-[X] — [task name].
Here is the task description: [paste from Section 12.5]
Here is the relevant code context: [paste relevant existing files]
Let's build it.
```

## Writing Tests

```
I finished building [feature] for Memoir.
Here is the implementation:
[paste code]

Now help me write tests for this.
Use: [Jest + RNTL for mobile / Vitest + Supertest for backend]
Cover: happy path, error cases, edge cases.
```

---

## Key Commands

```bash
# Start everything
redis-server &                          # Redis (needed for BullMQ)
cd apps/backend && npm run dev          # Backend on :3000
cd apps/mobile && npx expo start        # Mobile (scan QR with Expo Go)

# Run tests
cd apps/mobile && npm test              # Mobile unit tests
cd apps/backend && npm test             # Backend unit tests
cd apps/mobile && npx detox test        # E2E tests

# Database
# → Run SQL in Supabase Dashboard > SQL Editor

# Install dependencies
cd apps/mobile
npx expo install expo-audio expo-image-picker expo-image-manipulator
npm install @supabase/supabase-js @tanstack/react-query zustand

cd apps/backend
npm install fastify @supabase/supabase-js bullmq openai @anthropic-ai/sdk resend vitest supertest

# Create git tag for release
git tag v1.0.0 && git push --tags       # triggers release pipeline
```

---

*Memoir — getmemoir.com*
*Engineering Plan v2.0 — Complete Edition*
*Includes: Architecture · Database · Prompts · Tests · CI/CD · Jira Tasks*
