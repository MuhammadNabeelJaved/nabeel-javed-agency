/**
 * vectorService.js
 *
 * Supabase pgvector integration — uses the Supabase REST API directly via
 * Node.js fetch instead of the @supabase/supabase-js SDK.
 *
 * WHY NOT THE SDK: supabase-js v2 opens persistent WebSocket realtime
 * connections that cause significant memory growth in long-running servers,
 * leading to OOM crashes during batch embedding jobs.
 *
 * This implementation keeps memory usage minimal — every call opens a single
 * HTTP request and frees all memory on completion.
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://xyzxyz.supabase.co
 *   SUPABASE_SERVICE_KEY  — service-role key (NOT the anon key)
 *
 * Required Supabase schema: server/supabase-schema.sql
 */

const _url = () => process.env.SUPABASE_URL;
const _key = () => process.env.SUPABASE_SERVICE_KEY;

/** True when Supabase credentials are configured. */
export const isVectorDBEnabled = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

/** Shared auth headers for every request. */
function _headers(extra = {}) {
  return {
    'Content-Type':  'application/json',
    'apikey':        _key(),
    'Authorization': `Bearer ${_key()}`,
    ...extra,
  };
}

/**
 * Always drain the response body (required to free Node.js fetch buffers +
 * TCP connections). Throws if the status indicates an error.
 * Returns the body text so callers can parse it (avoids double-read).
 */
async function _check(res, label) {
  // MUST consume the body — undrained responses hold the TCP connection open
  // and accumulate buffer memory until the process OOMs.
  const body = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`[VectorDB] ${label} failed ${res.status}: ${body.slice(0, 200)}`);
  }
  return body;
}

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Upsert a knowledge chunk with its embedding.
 * Uses (mongo_id, chunk_index) as the composite natural key — safe to call
 * multiple times; existing chunks are overwritten.
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
  if (!isVectorDBEnabled()) return;

  const res = await fetch(
    `${_url()}/rest/v1/knowledge_chunks`,
    {
      method: 'POST',
      headers: _headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
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
      }),
    }
  );

  await _check(res, 'upsert');
}

/**
 * Delete all vector chunks for a given MongoDB document _id.
 * Call before re-embedding an updated document to avoid stale chunks.
 */
export async function deleteByMongoId(mongoId) {
  if (!isVectorDBEnabled()) return;

  const res = await fetch(
    `${_url()}/rest/v1/knowledge_chunks?mongo_id=eq.${encodeURIComponent(mongoId)}`,
    { method: 'DELETE', headers: _headers({ Prefer: 'return=minimal' }) }
  );

  await _check(res, 'delete');
}

// ── Read / search ──────────────────────────────────────────────────────────────

/**
 * Semantic similarity search using cosine distance on the stored embeddings.
 * Calls the `match_knowledge` Postgres function defined in supabase-schema.sql.
 */
export async function semanticSearch(queryEmbedding, {
  limit = 5,
  threshold = 0.60,
  roleAccess = 'public',
} = {}) {
  if (!isVectorDBEnabled()) return [];

  const res = await fetch(
    `${_url()}/rest/v1/rpc/match_knowledge`,
    {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count:     limit,
        role_filter:     roleAccess,
      }),
    }
  );

  const body = await _check(res, 'semanticSearch');
  return JSON.parse(body);
}

// ── Stats & admin ─────────────────────────────────────────────────────────────

/**
 * Return aggregate counts about the vector store.
 *
 * Memory-safe implementation:
 *  - Total count is read from the Content-Range response header (no rows
 *    transferred for the count query).
 *  - Breakdown data is capped at 2 000 rows (~80 KB JSON) so the type/role
 *    aggregation never causes an OOM regardless of table size.
 */
export async function getVectorStats() {
  if (!isVectorDBEnabled()) return null;

  try {
    // ── Step 1: get total count from Content-Range header ──────────────────────
    // Fetching limit=1 keeps the payload tiny while still returning the header
    // "Content-Range: 0-0/<TOTAL>" when Prefer: count=exact is set.
    const countRes = await fetch(
      `${_url()}/rest/v1/knowledge_chunks?select=id&limit=1`,
      { headers: _headers({ Prefer: 'count=exact' }) }
    );

    if (!countRes.ok) {
      await countRes.text().catch(() => '');
      return null;
    }

    // Drain the tiny body (1 row or empty)
    await countRes.text().catch(() => '');
    const range = countRes.headers.get('content-range') || '';
    // Content-Range format:  "0-0/12345"  or  "*/0"  (when empty)
    const total = parseInt(range.split('/')[1] || '0', 10) || 0;

    // ── Step 2: breakdown by type / role (cap at 2 000 rows) ──────────────────
    // 2 000 rows × ~40 bytes each = ~80 KB — safe for in-memory aggregation.
    const dataRes = await fetch(
      `${_url()}/rest/v1/knowledge_chunks?select=type,role_access&limit=2000`,
      { headers: _headers() }
    );

    const byType = {};
    const byRole = {};

    if (dataRes.ok) {
      const body = await dataRes.text().catch(() => '[]');
      const data = JSON.parse(body);
      for (const row of data || []) {
        byType[row.type]        = (byType[row.type]        || 0) + 1;
        byRole[row.role_access] = (byRole[row.role_access] || 0) + 1;
      }
    } else {
      await dataRes.text().catch(() => '');
    }

    return { total, byType, byRole };
  } catch (e) {
    console.error('[VectorDB] getVectorStats error:', e.message);
    return null;
  }
}

/**
 * Hard-reset: deletes every row in knowledge_chunks.
 */
export async function clearVectorStore() {
  if (!isVectorDBEnabled()) return;

  // Delete all rows — Supabase requires at least one filter; use a catch-all
  const res = await fetch(
    `${_url()}/rest/v1/knowledge_chunks?id=not.is.null`,
    { method: 'DELETE', headers: _headers({ Prefer: 'return=minimal' }) }
  );

  await _check(res, 'clearVectorStore');
}
