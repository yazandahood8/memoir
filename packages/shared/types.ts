export type Plan = 'free' | 'premium';
export type InputType = 'voice' | 'text';
export type CollectionStatus = 'active' | 'closed' | 'archived';
export type ChapterStyle = 'warm' | 'formal' | 'narrative';
export type DigestType = 'weekly' | 'monthly';

export interface User {
  id: string;
  email: string;
  plan: Plan;
  revenuecat_id?: string;
  settings: UserSettings;
  created_at: string;
}

export interface UserSettings {
  notifications: boolean;
  digest_day: string;
  writing_style: ChapterStyle;
  reminder_time: string;
}

export interface Entry {
  id: string;
  user_id: string;
  input_type: InputType;
  audio_url?: string;
  audio_duration_seconds?: number;
  raw_text?: string;
  transcript?: string;
  image_urls: string[];
  emotions: Record<string, number>;
  people: string[];
  topics: string[];
  location?: string;
  processed: boolean;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  status: CollectionStatus;
  started_at: string;
  ended_at?: string;
}

export interface CollectionEntry {
  collection_id: string;
  entry_id: string;
  added_at: string;
}

export interface Chapter {
  id: string;
  collection_id: string;
  content: string;
  style: ChapterStyle;
  word_count?: number;
  generated_at: string;
  pdf_url?: string;
}

export interface Digest {
  id: string;
  user_id: string;
  type: DigestType;
  content: string;
  insights: Record<string, unknown>;
  period_start: string;
  period_end: string;
  sent_at: string;
}

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
  },
} as const satisfies Record<Plan, object>;

export type Limits = typeof LIMITS;
