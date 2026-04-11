/**
 * chatbotAutoSync.js
 *
 * Non-blocking auto-sync utility for the Nova AI chatbot knowledge base.
 * Called by CRUD controllers after data changes so the public chatbot
 * always has fresh knowledge without requiring a manual "Sync from DB" click.
 *
 * Usage in any controller:
 *   import { autoSyncSection } from '../../utils/chatbotAutoSync.js';
 *   // after your DB write:
 *   autoSyncSection('services').catch(() => {});
 *
 * Supported sections: 'services' | 'projects' | 'jobs'
 */

import ChatbotKnowledge from '../models/usersModels/ChatbotKnowledge.model.js';
import Services         from '../models/usersModels/Services.model.js';
import AdminProject     from '../models/usersModels/AdminProject.model.js';
import Jobs             from '../models/usersModels/Jobs.model.js';
import CMS              from '../models/usersModels/CMS.model.js';
import User             from '../models/usersModels/User.model.js';
import Reviews          from '../models/usersModels/Reviews.model.js';
import { embedAndSyncEntry } from '../services/ragService.js';

// ─── Upsert helper ──────────────────────────────────────────────────────────
async function upsert({ syncKey, title, content, type = 'auto', tags = [], roleAccess = 'public' }) {
  const allTags = ['auto-sync', syncKey, ...tags];
  let doc;

  const existing = await ChatbotKnowledge.findOne({ tags: syncKey });
  if (existing) {
    existing.title      = title;
    existing.content    = content.slice(0, 20000);
    existing.tags       = allTags;
    existing.roleAccess = roleAccess;
    await existing.save();
    doc = existing;
  } else {
    doc = await ChatbotKnowledge.create({
      title,
      content:    content.slice(0, 20000),
      type,
      tags:       allTags,
      roleAccess,
      isActive:   true,
    });
  }

  // Non-blocking: embed and sync to Supabase vector store
  embedAndSyncEntry(doc)
    .then(() => ChatbotKnowledge.findByIdAndUpdate(doc._id, { embeddingStatus: 'done' }))
    .catch(e => console.error(`[AutoSync] Embed failed for "${title}":`, e.message));
}

// ─── Delete entry for a removed item ──────────────────────────────────────────
async function removeEntry(syncKey) {
  await ChatbotKnowledge.deleteMany({ tags: syncKey });
}

// ─── Section sync functions ────────────────────────────────────────────────────

async function syncServices() {
  const services = await Services.find({ isActive: true }).lean();

  // Remove KB entries for services no longer in DB
  const liveSyncKeys = services.map(s => `sync:service:${s.slug || s._id}`);
  const existing = await ChatbotKnowledge.find({ tags: 'sync:service:' }).lean();
  for (const e of existing) {
    const itsKey = e.tags.find(t => t.startsWith('sync:service:'));
    if (itsKey && !liveSyncKeys.includes(itsKey)) {
      await ChatbotKnowledge.deleteOne({ _id: e._id });
    }
  }

  for (const svc of services) {
    const pricingText = (svc.pricingPlans || [])
      .map(p => {
        const amt = p.price?.amount;
        const priceStr = amt ? `$${amt}${p.price.currency ? ' ' + p.price.currency : ''}` : 'Contact for pricing';
        return `  • ${p.name || 'Plan'}: ${priceStr} — ${p.description || ''}`;
      }).join('\n');

    const faqText = (svc.faqs || [])
      .map(f => `  Q: ${f.question}\n  A: ${f.answer}`)
      .join('\n');

    const featuresText = (svc.features || [])
      .map(f => `  • ${f.title || String(f)}`)
      .join('\n');

    const content =
      `Service: ${svc.title}\n` +
      (svc.subtitle        ? `Tagline: ${svc.subtitle}\n`         : '') +
      (svc.description     ? `Description: ${svc.description}\n`  : '') +
      (svc.category        ? `Category: ${svc.category}\n`        : '') +
      (svc.deliveryTime    ? `Delivery: ${svc.deliveryTime}\n`    : '') +
      (featuresText        ? `\nFeatures:\n${featuresText}\n`      : '') +
      (pricingText         ? `\nPricing:\n${pricingText}\n`        : '') +
      (faqText             ? `\nFAQs:\n${faqText}\n`              : '');

    await upsert({
      syncKey: `sync:service:${svc.slug || svc._id}`,
      title:   `Service — ${svc.title}`,
      content,
      tags:    ['service', svc.category || ''].filter(Boolean),
    });
  }
}

async function syncProjects() {
  const projects = await AdminProject
    .find({ isPublic: true, isArchived: false })
    .lean();

  for (const proj of projects) {
    const content =
      `Portfolio Project: ${proj.projectTitle}\n` +
      (proj.clientName         ? `Client: ${proj.clientName}\n`         : '') +
      (proj.category           ? `Category: ${proj.category}\n`         : '') +
      (proj.yourRole           ? `Our Role: ${proj.yourRole}\n`         : '') +
      (proj.projectDescription ? `About: ${proj.projectDescription}\n`  : '') +
      (proj.techStack?.length  ? `Tech: ${proj.techStack.join(', ')}\n` : '') +
      (proj.tags?.length       ? `Tags: ${proj.tags.join(', ')}\n`      : '') +
      (proj.clientFeedback?.comment
        ? `\nClient Feedback: "${proj.clientFeedback.comment}" (${proj.clientFeedback.rating}/5 stars)\n`
        : '');

    await upsert({
      syncKey: `sync:project:${proj._id}`,
      title:   `Portfolio — ${proj.projectTitle}`,
      content,
      tags:    ['portfolio', 'project', proj.category || ''].filter(Boolean),
    });
  }

  // Remove entries for projects that are now private or archived
  const liveKeys = projects.map(p => `sync:project:${p._id}`);
  const allProjectEntries = await ChatbotKnowledge.find({ tags: /^sync:project:/ }).lean();
  for (const e of allProjectEntries) {
    const key = e.tags.find(t => t.startsWith('sync:project:'));
    if (key && !liveKeys.includes(key)) {
      await ChatbotKnowledge.deleteOne({ _id: e._id });
    }
  }
}

async function syncJobs() {
  const jobs = await Jobs.find({ status: 'Active' }).lean();

  if (jobs.length) {
    const jobsText = jobs.map(j => {
      const salary = j.salaryRange?.min
        ? `$${Math.round(j.salaryRange.min / 1000)}k–$${Math.round(j.salaryRange.max / 1000)}k`
        : 'Competitive';
      return `• ${j.jobTitle} (${j.department || 'General'}) — ${j.employmentType || ''}, ${j.workMode || ''}, ${salary}`;
    }).join('\n');

    await upsert({
      syncKey: 'sync:jobs:active',
      title:   'Current Job Openings',
      content: `We Are Hiring! Current Open Positions:\n\n${jobsText}\n\nVisit our Careers page to apply.`,
      tags:    ['jobs', 'hiring', 'careers'],
    });
  } else {
    // No active jobs — remove the entry if it existed
    await removeEntry('sync:jobs:active');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Auto-syncs a section of data to the chatbot knowledge base.
 * Should be called non-blocking (always use `.catch(() => {})`).
 *
 * @param {'services'|'projects'|'jobs'|'all'} section
 */
export async function autoSyncSection(section) {
  if (section === 'services' || section === 'all') await syncServices();
  if (section === 'projects' || section === 'all') await syncProjects();
  if (section === 'jobs'     || section === 'all') await syncJobs();
}
