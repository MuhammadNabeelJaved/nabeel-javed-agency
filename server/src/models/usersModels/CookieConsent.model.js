/**
 * CookieConsent Model
 * GDPR audit log — one document per consent save event.
 * Never stores personally identifiable info beyond optional userId ref.
 */
import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    // Optional ref — null for anonymous/unauthenticated visitors
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // The four consent categories
    consent: {
      essential:  { type: Boolean, default: true },
      functional: { type: Boolean, default: false },
      analytics:  { type: Boolean, default: false },
      marketing:  { type: Boolean, default: false },
    },

    // ISO timestamp from the client at the moment of consent
    timestamp: {
      type: String,
      default: null,
    },

    // Best-effort IP — stripped of last octet for anonymisation
    ipAddress: {
      type: String,
      default: null,
    },

    // Browser user-agent (truncated to 300 chars)
    userAgent: {
      type: String,
      maxlength: 300,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    collection: 'cookieconsents',
  }
);

// Index for admin queries — most recent first
consentSchema.index({ createdAt: -1 });
consentSchema.index({ userId: 1 });

const CookieConsent = mongoose.model('CookieConsent', consentSchema);
export default CookieConsent;
