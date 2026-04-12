/**
 * embeddingService.js
 *
 * Generates text embeddings using the OpenAI text-embedding-3-small model.
 * Falls back gracefully — all functions return null/empty if OPENAI_API_KEY
 * is not set, so the rest of the system degrades to keyword-based search.
 *
 * Model:  text-embedding-3-small
 * Dims:   1536
 * Cost:   $0.02 / 1 M tokens (~$0.000002 per average knowledge chunk)
 * Docs:   https://platform.openai.com/docs/guides/embeddings
 *
 * No extra npm packages — uses Node 18+ built-in fetch.
 */

const OPENAI_BASE     = 'https://api.openai.com/v1';
const EMBEDDING_MODEL = 'text-embedding-3-small';

/** Dimensionality of the chosen model (must match the Supabase column). */
export const EMBEDDING_DIMENSIONS = 1536;

/** True when an OpenAI API key is present in the environment. */
export const isEmbeddingEnabled = () => Boolean(process.env.OPENAI_API_KEY);

// ── Internal API call ────────────────────────────────────────────────────────

async function _callAPI(inputs) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const res = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:           EMBEDDING_MODEL,
      input:           inputs,
      encoding_format: 'float',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `OpenAI embeddings API ${res.status}: ${err.error?.message || res.statusText}`
    );
  }

  const json = await res.json();
  // Sort by index to guarantee order matches the input array, then extract
  // only the embedding arrays — lets the full json object be GCed immediately.
  const embeddings = json.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
  // Explicitly drop the parsed JSON so V8 can GC it before the caller proceeds.
  // eslint-disable-next-line no-unused-vars
  json.data = null;
  return embeddings;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate an embedding vector for a single text string.
 * Returns null if the embedding service is not configured.
 *
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
export async function embedText(text) {
  if (!isEmbeddingEnabled()) return null;
  const cleaned = (text || '').slice(0, 8000).trim();
  if (!cleaned) return null;
  const [vec] = await _callAPI([cleaned]);
  return vec;
}

/**
 * Generate embeddings for an array of text strings in batches.
 * Items that fail or are empty will have a null slot in the returned array.
 *
 * @param {string[]} texts
 * @param {number}   [batchSize=20] — max items per API call
 * @returns {Promise<(number[]|null)[]>}
 */
export async function embedBatch(texts, batchSize = 10) {
  if (!isEmbeddingEnabled()) return texts.map(() => null);

  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const batch = slice.map(t => (t || '').slice(0, 8000).trim());

    try {
      const vecs = await _callAPI(batch);
      // Re-align: if a text was empty the API may have fewer results
      let vi = 0;
      for (const t of batch) {
        results.push(t.length > 0 && vi < vecs.length ? vecs[vi++] : null);
      }
    } catch (err) {
      console.error('[Embedding] Batch error:', err.message);
      results.push(...batch.map(() => null));
    }

    // Brief pause between batches to stay within OpenAI rate limits
    if (i + batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 120));
    }
  }

  return results;
}
