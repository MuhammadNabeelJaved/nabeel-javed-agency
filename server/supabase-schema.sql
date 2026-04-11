-- ============================================================================
-- Supabase pgvector schema for Nova AI Chatbot — knowledge_chunks table
--
-- Run this once in the Supabase SQL editor:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- Required env vars in server/.env:
--   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
--   SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY   (NOT the anon key)
-- ============================================================================

-- 1. Enable the pgvector extension (already available on Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Main table — one row per embedding chunk
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the parent MongoDB ChatbotKnowledge document
  mongo_id    TEXT        NOT NULL,

  -- Position of this chunk within its parent document (0-based)
  chunk_index INT         NOT NULL DEFAULT 0,

  -- Human-readable label shown in search results
  title       TEXT        NOT NULL,

  -- Text that was embedded (shown as context to Claude)
  content     TEXT        NOT NULL,

  -- 1536-dim float vector (OpenAI text-embedding-3-small)
  embedding   vector(1536),

  -- Knowledge type: 'text' | 'faq' | 'url' | 'auto' | 'file'
  type        TEXT        NOT NULL DEFAULT 'text',

  -- Access control: 'public' | 'user' | 'team' | 'admin'
  role_access TEXT        NOT NULL DEFAULT 'public',

  -- Tags mirror the parent MongoDB document's tags array
  tags        TEXT[]      NOT NULL DEFAULT '{}',

  -- Source URL for 'url'-type entries
  source_url  TEXT        NOT NULL DEFAULT '',

  -- Arbitrary metadata (chunkCount, crawledAt, etc.)
  metadata    JSONB       NOT NULL DEFAULT '{}',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Natural key used for idempotent upserts
  UNIQUE (mongo_id, chunk_index)
);

-- 3. HNSW index for fast cosine-distance vector search
--    (better recall than IVFFlat; no need to tune nlist)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
  ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Supporting indexes
CREATE INDEX IF NOT EXISTS knowledge_chunks_mongo_id_idx
  ON knowledge_chunks (mongo_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_role_access_idx
  ON knowledge_chunks (role_access);

CREATE INDEX IF NOT EXISTS knowledge_chunks_type_idx
  ON knowledge_chunks (type);

-- 5. Semantic search function with role-based access control
--
--    The function is called by vectorService.js via:
--      supabase.rpc('match_knowledge', { ... })
--
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count     INT,
  role_filter     TEXT
)
RETURNS TABLE (
  id          UUID,
  mongo_id    TEXT,
  title       TEXT,
  content     TEXT,
  type        TEXT,
  source_url  TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.mongo_id,
    kc.title,
    kc.content,
    kc.type,
    kc.source_url,
    -- Convert cosine distance to cosine similarity (higher = more similar)
    1.0 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    -- Role-based access control
    (
      role_filter = 'admin'                                            -- admin sees all
      OR kc.role_access = 'public'                                    -- everyone sees public
      OR kc.role_access = role_filter                                 -- exact role match
      OR (role_filter = 'team' AND kc.role_access IN ('public','team'))
      OR (role_filter = 'user' AND kc.role_access IN ('public','user'))
    )
    -- Minimum similarity threshold
    AND (1.0 - (kc.embedding <=> query_embedding)) > match_threshold
  ORDER BY kc.embedding <=> query_embedding   -- ascending cosine distance
  LIMIT match_count;
END;
$$;

-- 6. Row-Level Security — service-role key bypasses RLS automatically,
--    but it is good practice to enable it and grant the anon key read-only access
--    if you ever need to expose the vector store to the client.
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Allow the service-role key (used by the Node.js server) full access
CREATE POLICY "Service role full access"
  ON knowledge_chunks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Done. After running this SQL, set in server/.env:
--   OPENAI_API_KEY=sk-...          (for OpenAI text-embedding-3-small)
--   SUPABASE_URL=https://...       (your project URL)
--   SUPABASE_SERVICE_KEY=...       (service-role key from Settings > API)
-- Then restart the server and the RAG system will be active.
-- ============================================================================
