/**
 * Cookie Consent Controller
 *
 * POST /api/v1/consent        — public, logs a consent event
 * GET  /api/v1/consent        — admin only, returns stats + paginated records
 * GET  /api/v1/consent/stats  — admin only, aggregate stats only
 * DELETE /api/v1/consent/:id  — admin only, remove one record
 * DELETE /api/v1/consent/clear — admin only, bulk-delete records older than N days
 */
import CookieConsent from '../../models/usersModels/CookieConsent.model.js';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip the last octet from an IPv4 for minimal anonymisation */
function anonymiseIp(ip) {
  if (!ip) return null;
  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[3] = '0';
    return parts.join('.');
  }
  // IPv6 — keep first 3 groups only
  const v6parts = ip.split(':');
  return v6parts.slice(0, 3).join(':') + ':*';
}

// ── POST /api/v1/consent ──────────────────────────────────────────────────────

export const saveConsent = asyncHandler(async (req, res) => {
  const { consent, timestamp, userId } = req.body;

  if (!consent || typeof consent !== 'object') {
    throw new AppError('consent object is required', 400);
  }

  const ip = anonymiseIp(
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress
  );
  const ua = (req.headers['user-agent'] ?? '').slice(0, 300);

  const doc = await CookieConsent.create({
    userId: userId || null,
    consent: {
      essential:  true, // always true
      functional: Boolean(consent.functional),
      analytics:  Boolean(consent.analytics),
      marketing:  Boolean(consent.marketing),
    },
    timestamp: timestamp || new Date().toISOString(),
    ipAddress: ip,
    userAgent: ua,
  });

  successResponse(res, 201, 'Consent recorded', { id: doc._id });
});

// ── GET /api/v1/consent ───────────────────────────────────────────────────────

export const getConsents = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [records, total] = await Promise.all([
    CookieConsent.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    CookieConsent.countDocuments(),
  ]);

  successResponse(res, 200, 'Consent records fetched', {
    records,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// ── GET /api/v1/consent/stats ─────────────────────────────────────────────────

export const getConsentStats = asyncHandler(async (req, res) => {
  const [total, functional, analytics, marketing, recent] = await Promise.all([
    CookieConsent.countDocuments(),
    CookieConsent.countDocuments({ 'consent.functional': true }),
    CookieConsent.countDocuments({ 'consent.analytics': true }),
    CookieConsent.countDocuments({ 'consent.marketing': true }),
    // Last 30 days
    CookieConsent.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  successResponse(res, 200, 'Consent stats fetched', {
    total,
    last30Days: recent,
    breakdown: {
      essential:  { count: total,      pct: 100 },
      functional: { count: functional, pct: pct(functional) },
      analytics:  { count: analytics,  pct: pct(analytics)  },
      marketing:  { count: marketing,  pct: pct(marketing)  },
    },
  });
});

// ── DELETE /api/v1/consent/clear ──────────────────────────────────────────────

export const clearOldConsents = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  if (days < 1 || days > 3650) {
    throw new AppError('days must be between 1 and 3650', 400);
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await CookieConsent.deleteMany({ createdAt: { $lt: cutoff } });

  successResponse(res, 200, `Deleted ${result.deletedCount} records older than ${days} days`, {
    deletedCount: result.deletedCount,
  });
});

// ── DELETE /api/v1/consent/:id ────────────────────────────────────────────────

export const deleteConsent = asyncHandler(async (req, res) => {
  const doc = await CookieConsent.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Record not found', 404);
  successResponse(res, 200, 'Consent record deleted');
});
