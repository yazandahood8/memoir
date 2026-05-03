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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid() = id);

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

-- SEMANTIC SEARCH FUNCTION
CREATE OR REPLACE FUNCTION search_entries(
  query_vector VECTOR(1536),
  user_id UUID,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  transcript TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.transcript,
    e.created_at,
    1 - (em.vector <=> query_vector) AS similarity
  FROM embeddings em
  JOIN entries e ON e.id = em.entry_id
  WHERE e.user_id = search_entries.user_id
    AND e.processed = true
  ORDER BY em.vector <=> query_vector
  LIMIT match_count;
END;
$$;

-- AUTO-CREATE USER PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
