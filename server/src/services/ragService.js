/**
 * ragService.js
 *
 * Retrieval-Augmented Generation (RAG) pipeline.
 *
 * Retrieval priority for every query:
 *   1. Semantic search via Supabase pgvector  (requires OPENAI_API_KEY + Supabase)
 *   2. MongoDB full-text search               (always available when KB has entries)
 *   3. Most-recent active KB entries          (last-resort fallback)
 *
 * Access control is applied at every layer — each role only sees entries
 * it is authorised for.
 */

import { embedText, embedBatch, isEmbeddingEnabled } from './embeddingService.js';
import {
  upsertChunk,
  deleteByMongoId,
  semanticSearch,
  isVectorDBEnabled,
} from './vectorService.js';
import ChatbotKnowledge from '../models/usersModels/ChatbotKnowledge.model.js';

// ── Chunking (shared with crawlerService) ────────────────────────────────────

const CHUNK_SIZE    = 1_200;   // characters per chunk
const CHUNK_OVERLAP = 150;     // overlap between consecutive chunks

/**
 * Split a long text into overlapping chunks sized for embedding.
 * Prefers to break at newlines to preserve paragraph context.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function chunkContent(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = (text || '').trim();
  if (clean.length <= size) return clean ? [clean] : [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    if (end < clean.length) {
      const nl = clean.lastIndexOf('\n', end);
      if (nl > start + size * 0.5) end = nl;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 60) chunks.push(chunk);

    start = end - overlap;
    if (start <= 0 || start >= clean.length) break;
  }

  return chunks;
}

// ── Access-level helpers ──────────────────────────────────────────────────────

function _roleToAccess(role) {
  if (role === 'admin') return 'admin';
  if (role === 'team')  return 'team';
  if (role === 'user')  return 'user';
  return 'public';
}

/**
 * Build a MongoDB query filter that respects the caller's access level.
 * Legacy documents without a roleAccess field are treated as public.
 */
function _mongoRoleFilter(access) {
  if (access === 'admin') return {};

  const publicConditions = [
    { roleAccess: 'public' },
    { roleAccess: { $exists: false } },
    { roleAccess: null },
  ];

  if (access === 'team') {
    return { $or: [...publicConditions, { roleAccess: 'team' }] };
  }
  if (access === 'user') {
    return { $or: [...publicConditions, { roleAccess: 'user' }] };
  }

  // 'public' callers — public entries only
  return { $or: publicConditions };
}

// ── Core retrieval ────────────────────────────────────────────────────────────

/**
 * Retrieve the most relevant knowledge entries for a user query.
 *
 * @param {string} query
 * @param {Object} [opts]
 * @param {number} [opts.limit=5]      — max entries to return
 * @param {string} [opts.role='public'] — caller role for access filtering
 * @returns {Promise<Array<{title,content,type,sourceUrl,similarity?,source}>>}
 */
export async function retrieveKnowledge(query, { limit = 5, role = 'public' } = {}) {
  const access   = _roleToAccess(role);
  const hasQuery = typeof query === 'string' && query.trim().length > 2;

  // ── 1. Semantic search (vector DB) ─────────────────────────────────────────
  if (hasQuery && isEmbeddingEnabled() && isVectorDBEnabled()) {
    try {
      const vec = await embedText(query);
      if (vec) {
        const hits = await semanticSearch(vec, {
          limit,
          threshold:  0.56,
          roleAccess: access,
        });

        if (hits.length > 0) {
          return hits.map(h => ({
            title:      h.title,
            content:    h.content,
            type:       h.type,
            sourceUrl:  h.source_url || '',
            similarity: h.similarity,
            source:     'semantic',
          }));
        }
      }
    } catch (err) {
      console.error('[RAG] Semantic search error — falling back to full-text:', err.message);
    }
  }

  // ── 2. MongoDB full-text search ────────────────────────────────────────────
  if (hasQuery) {
    try {
      const roleFilter = _mongoRoleFilter(access);
      const hits = await ChatbotKnowledge.find(
        { isActive: true, ...roleFilter, $text: { $search: query } },
        { score: { $meta: 'textScore' }, title: 1, content: 1, type: 1, sourceUrl: 1 }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      if (hits.length) {
        return hits.map(h => ({
          title:     h.title,
          content:   h.content,
          type:      h.type,
          sourceUrl: h.sourceUrl || '',
          source:    'fulltext',
        }));
      }
    } catch {
      // Text index might not be built yet — proceed to fallback
    }
  }

  // ── 3. Fallback — most-recent active entries ───────────────────────────────
  const roleFilter = _mongoRoleFilter(access);
  const fallback = await ChatbotKnowledge.find({ isActive: true, ...roleFilter })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title content type sourceUrl')
    .lean();

  return fallback.map(h => ({
    title:     h.title,
    content:   h.content,
    type:      h.type,
    sourceUrl: h.sourceUrl || '',
    source:    'fallback',
  }));
}

/**
 * Format retrieved entries into a context block for the Claude system prompt.
 * Includes a similarity percentage badge when semantic search was used.
 *
 * @param {Array} entries — output from retrieveKnowledge()
 * @returns {string}
 */
export function buildKnowledgeContext(entries) {
  if (!entries?.length) return '';

  const sections = entries.map(e => {
    const conf   = e.similarity != null ? ` [${Math.round(e.similarity * 100)}% match]` : '';
    const src    = e.sourceUrl  ? `\n*Source: ${e.sourceUrl}*` : '';
    return `### ${e.title}${conf}${src}\n${e.content}`;
  }).join('\n\n');

  return (
    '\n\n---\n## Knowledge Base\n' +
    'The following information was retrieved from the company knowledge base. ' +
    'Use it as your primary reference when answering the query:\n\n' +
    sections +
    '\n---'
  );
}

// ── Embedding sync helper ─────────────────────────────────────────────────────

/**
 * Generate embeddings for a ChatbotKnowledge document and upsert them into
 * the Supabase vector store.  Existing chunks are replaced on every call.
 *
 * Designed to be called non-blocking from controller CRUD handlers:
 *   embedAndSyncEntry(doc).catch(e => console.error('[Embed]', e.message));
 *
 * Does nothing (silently) if embeddings or the vector DB are not configured.
 *
 * @param {Object} doc — Mongoose document or plain object with _id, title, content, etc.
 */
export async function embedAndSyncEntry(doc) {
  if (!isEmbeddingEnabled() || !isVectorDBEnabled()) return;

  const content = (doc.content || '').trim();
  if (!content) return;

  const mongoId = doc._id?.toString() || String(doc._id);

  // Remove stale chunks before re-writing
  await deleteByMongoId(mongoId).catch(() => {});

  const chunks = chunkContent(content);
  if (!chunks.length) return;

  // Prepend title to first chunk so the embedding anchors the topic
  const texts = chunks.map((c, i) => (i === 0 ? `${doc.title}\n\n${c}` : c));
  const vecs  = await embedBatch(texts);

  for (let i = 0; i < chunks.length; i++) {
    if (!vecs[i]) continue;
    await upsertChunk({
      mongoId,
      chunkIndex: i,
      title:      i === 0 ? doc.title : `${doc.title} (part ${i + 1})`,
      content:    chunks[i],
      embedding:  vecs[i],
      type:       doc.type      || 'text',
      roleAccess: doc.roleAccess || 'public',
      tags:       doc.tags      || [],
      sourceUrl:  doc.sourceUrl || '',
      metadata:   { chunkCount: chunks.length, syncedAt: new Date().toISOString() },
    });
    // Release the 1 536-float array immediately after it has been serialised
    // and sent — prevents them accumulating in the vecs[] array during long loops.
    vecs[i] = null;
  }
}
