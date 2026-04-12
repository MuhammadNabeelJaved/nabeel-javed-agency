/**
 * crawlerService.js
 *
 * Website crawler for automatic knowledge-base population.
 *
 * Crawls public pages, extracts clean text, chunks the content, then stores it
 * in both MongoDB (ChatbotKnowledge) and the Supabase vector store.
 *
 * No extra npm packages — uses Node 18+ built-in fetch + regex HTML parsing.
 */

import ChatbotKnowledge from '../models/usersModels/ChatbotKnowledge.model.js';
import PageStatus       from '../models/usersModels/PageStatus.model.js';
import { embedBatch, isEmbeddingEnabled } from './embeddingService.js';
import { upsertChunk, deleteByMongoId, isVectorDBEnabled } from './vectorService.js';
import { chunkContent } from './ragService.js';

const FETCH_TIMEOUT  = 20_000;   // ms — abort if page takes longer
const MAX_CHARS      = 15_000;   // max chars stored per page in MongoDB

// ── Default pages to crawl when no PageStatus record exists ──────────────────
const DEFAULT_PATHS = [
  '/', '/services', '/portfolio', '/contact', '/our-team', '/careers', '/about',
];

// ── HTML → plain text ─────────────────────────────────────────────────────────

function _htmlToText(html) {
  return html
    // Remove entire head, script, style, svg blocks
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style|noscript|svg|iframe)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Block-level tags → newlines
    .replace(/<\/?(p|div|h[1-6]|li|dt|dd|tr|td|th|blockquote|pre|section|article|main|header|footer|nav|aside|form)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#\d+;/g, '')
    // Normalise whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function _extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}

// ── Page fetch ────────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return its clean text content.
 * @param {string} url
 * @returns {Promise<{title:string, content:string}>}
 */
export async function fetchPageText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'WEBAI-Crawler/1.0 (knowledge-base indexer)' },
    });

    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) {
      throw new Error(`Non-HTML content type: ${ct}`);
    }

    const html    = await res.text();
    const title   = _extractTitle(html) || url;
    const content = _htmlToText(html).slice(0, MAX_CHARS);

    return { title, content };
  } finally {
    clearTimeout(timer);
  }
}

// ── Crawl + store (single page) ───────────────────────────────────────────────

/**
 * Crawl a single URL, store/update it in MongoDB, and embed + sync to Supabase.
 *
 * @param {Object}   opts
 * @param {string}   opts.url            — Full URL to crawl
 * @param {string}   [opts.titleOverride] — Custom title (uses page <title> otherwise)
 * @param {string[]} [opts.extraTags]     — Additional tags to attach
 * @param {string}   [opts.roleAccess]    — 'public'|'user'|'team'|'admin' (default 'public')
 * @param {string}   [opts.createdBy]     — Admin user ObjectId string (nullable)
 * @returns {Promise<{mongoId:string, title:string, chunksStored:number}>}
 */
export async function crawlAndStore({
  url,
  titleOverride,
  extraTags = [],
  roleAccess = 'public',
  createdBy  = null,
}) {
  const { title: pageTitle, content } = await fetchPageText(url);

  const title = (titleOverride || pageTitle || url).slice(0, 200);

  if (!content || content.trim().length < 50) {
    throw new Error('Page returned insufficient content (< 50 chars after extraction)');
  }

  // Stable dedup key derived from the URL
  const syncKey = `crawl:${url.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 80)}`;
  const allTags = Array.from(new Set([syncKey, 'crawled', ...extraTags]));

  // ── Upsert MongoDB document ─────────────────────────────────────────────────
  let doc = await ChatbotKnowledge.findOne({ tags: syncKey });

  if (doc) {
    doc.title      = title;
    doc.content    = content;
    doc.sourceUrl  = url;
    doc.fileUrl    = url;
    doc.tags       = allTags;
    doc.roleAccess = roleAccess;
    await doc.save();
  } else {
    doc = await ChatbotKnowledge.create({
      title,
      content,
      type:       'url',
      sourceUrl:  url,
      fileUrl:    url,
      tags:       allTags,
      roleAccess,
      isActive:   true,
      createdBy:  createdBy || undefined,
    });
  }

  // ── Generate embeddings + upsert to Supabase ────────────────────────────────
  let chunksStored = 0;

  if (isEmbeddingEnabled() && isVectorDBEnabled()) {
    // Remove stale chunks before re-writing
    await deleteByMongoId(doc._id.toString()).catch(() => {});

    const chunks = chunkContent(content);
    const texts  = chunks.map((c, i) => (i === 0 ? `${title}\n\n${c}` : c));
    const vecs   = await embedBatch(texts);

    for (let i = 0; i < chunks.length; i++) {
      if (!vecs[i]) continue;
      await upsertChunk({
        mongoId:    doc._id.toString(),
        chunkIndex: i,
        title:      i === 0 ? title : `${title} (part ${i + 1})`,
        content:    chunks[i],
        embedding:  vecs[i],
        type:       'url',
        roleAccess,
        tags:       allTags,
        sourceUrl:  url,
        metadata:   { chunkCount: chunks.length, crawledAt: new Date().toISOString() },
      });
      chunksStored++;
    }
  }

  return { mongoId: doc._id.toString(), title, chunksStored };
}

// ── Full-site crawl ───────────────────────────────────────────────────────────

/**
 * Crawl every active public page of the website and store the results.
 *
 * Discovers pages from:
 *   1. PageStatus collection (active public pages)
 *   2. A hardcoded fallback list (used when PageStatus is unavailable)
 *   3. The caller-supplied `extra` array
 *
 * @param {Object}    opts
 * @param {string}    opts.baseUrl     — Website base URL, e.g. 'https://example.com'
 * @param {string[]}  [opts.extra]     — Extra relative paths to include (e.g. ['/blog'])
 * @param {string}    [opts.createdBy] — Admin ObjectId string (nullable)
 * @param {Function}  [opts.onProgress] — Callback(url, result|null, error|null) per page
 * @returns {Promise<{success:Object[], failed:Object[], totalChunks:number}>}
 */
export async function crawlWebsite({ baseUrl, extra = [], createdBy, onProgress } = {}) {
  // ── Discover page paths ─────────────────────────────────────────────────────
  let activePaths = [];
  try {
    const dbPages = await PageStatus.find({
      category: 'public',
      status:   'active',
      isHidden: { $ne: true },
    }).select('path').lean();
    activePaths = dbPages.map(p => p.path);
  } catch {
    // PageStatus unavailable — use fallback list only
  }

  const allPaths = Array.from(
    new Set([...DEFAULT_PATHS, ...activePaths, ...extra])
  );

  const base = (baseUrl || '').replace(/\/$/, '');
  const results = { success: [], failed: [], totalChunks: 0 };

  for (const path of allPaths) {
    const url = `${base}${path}`;
    try {
      const r = await crawlAndStore({
        url,
        extraTags:  ['auto-crawl'],
        roleAccess: 'public',
        createdBy,
      });
      results.success.push({ path, url, title: r.title, chunksStored: r.chunksStored });
      results.totalChunks += r.chunksStored;
      onProgress?.(url, r, null);
    } catch (err) {
      results.failed.push({ path, url, error: err.message });
      onProgress?.(url, null, err);
    }

    // Polite delay between pages to avoid hammering the server
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}
