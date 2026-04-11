/**
 * vectorService.js
 *
 * Supabase pgvector integration — stores and retrieves knowledge embeddings.
 * All functions degrade gracefully if SUPABASE_URL / SUPABASE_SERVICE_KEY are
 * absent from the environment; they return null / empty arrays instead of
 * throwing so the main chatbot continues to work via keyword-based fallback.
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://xyzxyz.supabase.co
 *   SUPABASE_SERVICE_KEY  — service-role key (NOT the anon key)
 *
 * Required Supabase schema: server/supabase-schema.sql
 */

import { createClient } from '@supabase/supabase-js';

let _client = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** True when Supabase credentials are configured. */
export const isVectorDBEnabled = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Upsert a knowledge chunk with its embedding.
 * Uses (mongo_id, chunk_index) as the composite natural key — safe to call
 * multiple times; existing chunks are overwritten.
 *
 * @param {Object}   opts
 * @param {string}   opts.mongoId      — MongoDB _id of the parent ChatbotKnowledge doc
 * @param {number}   opts.chunkIndex   — 0-based position of this chunk in the doc
 * @param {string}   opts.title        — Human-readable label
 * @param {string}   opts.content      — Chunk text (what is embedded and returned)
 * @param {number[]} opts.embedding    — 1536-dimensional float array
 * @param {string}   [opts.type]       — 'text'|'faq'|'url'|'auto'|'file'
 * @param {string}   [opts.roleAccess] — 'public'|'user'|'team'|'admin'
 * @param {string[]} [opts.tags]
 * @param {string}   [opts.sourceUrl]
 * @param {Object}   [opts.metadata]
 */
export async function upsertChunk({
  mongoId,
  chunkIndex = 0,
  title,
  content,
  embedding,
  type = 'text',
  roleAccess = 'public',
  tags = [],
  sourceUrl = '',
  metadata = {},
}) {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from('knowledge_chunks').upsert(
    {
      mongo_id:    mongoId,
      chunk_index: chunkIndex,
      title,
      content,
      embedding,
      type,
      role_access: roleAccess,
      tags,
      source_url:  sourceUrl,
      metadata,
      updated_at:  new Date().toISOString(),
    },
    { onConflict: 'mongo_id,chunk_index' }
  );

  if (error) {
    throw new Error(`[VectorDB] upsert failed: ${error.message}`);
  }
}

/**
 * Delete all vector chunks for a given MongoDB document _id.
 * Call before re-embedding an updated document to avoid stale chunks.
 *
 * @param {string} mongoId
 */
export async function deleteByMongoId(mongoId) {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from('knowledge_chunks')
    .delete()
    .eq('mongo_id', String(mongoId));

  if (error) {
    throw new Error(`[VectorDB] delete failed: ${error.message}`);
  }
}

// ── Read / search ──────────────────────────────────────────────────────────────

/**
 * Semantic similarity search using cosine distance on the stored embeddings.
 * Calls the `match_knowledge` Postgres function defined in supabase-schema.sql.
 *
 * @param {number[]} queryEmbedding  — 1536-dim vector from embedText()
 * @param {Object}   opts
 * @param {number}   [opts.limit=5]           — Max results
 * @param {number}   [opts.threshold=0.60]    — Min cosine similarity (0–1)
 * @param {string}   [opts.roleAccess='public'] — Caller's access level
 * @returns {Promise<Array<{id,mongo_id,title,content,type,source_url,similarity}>>}
 */
export async function semanticSearch(queryEmbedding, {
  limit = 5,
  threshold = 0.60,
  roleAccess = 'public',
} = {}) {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count:     limit,
    role_filter:     roleAccess,
  });

  if (error) {
    throw new Error(`[VectorDB] search failed: ${error.message}`);
  }

  return data || [];
}

// ── Stats & admin ─────────────────────────────────────────────────────────────

/**
 * Return aggregate counts about the vector store.
 * @returns {Promise<{total:number, byType:Object, byRole:Object}|null>}
 */
export async function getVectorStats() {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('knowledge_chunks')
    .select('type, role_access');

  if (error) return null;

  const byType = {};
  const byRole = {};
  for (const row of data || []) {
    byType[row.type]        = (byType[row.type]        || 0) + 1;
    byRole[row.role_access] = (byRole[row.role_access] || 0) + 1;
  }

  return { total: data?.length ?? 0, byType, byRole };
}

/**
 * Hard-reset: deletes every row in knowledge_chunks.
 * Use with caution — this removes all vector embeddings.
 */
export async function clearVectorStore() {
  const client = getClient();
  if (!client) return;

  // Supabase requires a filter clause — match all rows via NOT IS NULL on PK
  const { error } = await client
    .from('knowledge_chunks')
    .delete()
    .not('id', 'is', null);

  if (error) {
    throw new Error(`[VectorDB] clear failed: ${error.message}`);
  }
}
