import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── Per-model pricing (USD per million tokens) ───────────────────────────────
// Source: https://platform.claude.com/docs/en/about-claude/pricing
export const MODEL_PRICING = {
  'claude-opus-4-6':            { input: 5.00,  output: 25.00 },
  'claude-opus-4-5':            { input: 5.00,  output: 25.00 },
  'claude-opus-4-5-20250514':   { input: 5.00,  output: 25.00 },
  'claude-sonnet-4-6':          { input: 3.00,  output: 15.00 },
  'claude-sonnet-4-5':          { input: 3.00,  output: 15.00 },
  'claude-sonnet-4-5-20250514': { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':           { input: 1.00,  output:  5.00 },
  'claude-haiku-4-5-20251001':  { input: 1.00,  output:  5.00 },
  'claude-haiku-3-5':           { input: 0.80,  output:  4.00 },
  'claude-haiku-3-5-20241022':  { input: 0.80,  output:  4.00 },
  'claude-opus-3':              { input: 15.00, output: 75.00 },
  'claude-opus-3-20240229':     { input: 15.00, output: 75.00 },
  'claude-haiku-3':             { input: 0.25,  output:  1.25 },
  'claude-haiku-3-20240307':    { input: 0.25,  output:  1.25 },
};

// Default fallback pricing if model not found (use Sonnet rates)
const DEFAULT_PRICING = { input: 3.00, output: 15.00 };

/**
 * Calculate cost in USD for a given model + token counts.
 * @param {string} model
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number}  cost in USD (rounded to 8 decimal places)
 */
export function calcCost(model, inputTokens, outputTokens) {
  // Normalise model ID: strip date suffixes like -20250514 for lookup fallbacks
  const pricing =
    MODEL_PRICING[model] ||
    MODEL_PRICING[Object.keys(MODEL_PRICING).find(k => model.startsWith(k)) || ''] ||
    DEFAULT_PRICING;

  const cost =
    (inputTokens  / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;

  return Math.round(cost * 1e8) / 1e8; // 8 decimal places
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const usageSchema = new Schema({
  model:        { type: String, required: true },
  endpoint:     { type: String, enum: ['public', 'user', 'team'], default: 'public' },
  inputTokens:  { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  cost:         { type: Number, default: 0 },   // USD
  sessionId:    { type: String, default: null },
  timestamp:    { type: Date,   default: Date.now, index: true },
});

// TTL — auto-delete records older than 1 year to keep collection lean
usageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export default mongoose.model('ChatbotUsage', usageSchema);
