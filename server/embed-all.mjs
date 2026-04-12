/**
 * embed-all.mjs  —  Standalone knowledge base embedder
 *
 * Run with:
 *   node --dns-result-order=ipv4first embed-all.mjs
 *
 * This script connects directly to MongoDB + OpenAI + Supabase without
 * needing the HTTP server to be running.
 */

import { config } from 'dotenv';
config();

import mongoose from 'mongoose';

// ── Connect to MongoDB ────────────────────────────────────────────────────────
console.log('Connecting to MongoDB…');
await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
console.log('✓ MongoDB connected');

// ── Load model ────────────────────────────────────────────────────────────────
const { default: ChatbotKnowledge } = await import('./src/models/usersModels/ChatbotKnowledge.model.js');
const { embedAndSyncEntry }         = await import('./src/services/ragService.js');
const { getVectorStats }            = await import('./src/services/vectorService.js');

// ── Fetch only IDs first — avoids loading all content into memory at once ──────
const ids = await ChatbotKnowledge.find({ isActive: true, embeddingStatus: { $ne: 'done' } })
  .select('_id')
  .lean();

const total = ids.length;
console.log(`\nFound ${total} entries to embed\n`);

if (total === 0) {
  const stats = await getVectorStats();
  console.log('Already up to date. Vector stats:', JSON.stringify(stats, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

let done = 0, failed = 0;

for (const { _id } of ids) {
  // Load one entry at a time to keep peak heap low
  const entry = await ChatbotKnowledge.findById(_id)
    .select('_id title content type roleAccess tags sourceUrl')
    .lean();

  if (!entry) continue;

  try {
    await embedAndSyncEntry(entry);
    await ChatbotKnowledge.updateOne({ _id }, { embeddingStatus: 'done' });
    done++;
    console.log(`  ✓ [${done}/${total}] ${entry.title}`);
  } catch (e) {
    await ChatbotKnowledge.updateOne({ _id }, { embeddingStatus: 'failed' });
    failed++;
    console.log(`  ✗ FAILED: ${entry.title} — ${e.message}`);
  }
  // 500 ms between entries — gives GC time to reclaim embedding vectors
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\nDone — ${done} embedded, ${failed} failed`);

const stats = await getVectorStats();
console.log('Final vector stats:', JSON.stringify(stats, null, 2));

await mongoose.disconnect();
