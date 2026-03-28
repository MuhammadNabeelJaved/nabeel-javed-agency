/**
 * Frontend input sanitization utilities.
 *
 * These helpers run in the browser BEFORE data is sent to the API.
 * They defend against XSS and ensure only clean data leaves the client.
 *
 * Note: Server-side validation is still the authoritative gate — these
 * are a first line of defence and UX improvement, not a replacement.
 *
 * OWASP A03 – Injection  |  OWASP A07 – Identification and Authentication Failures
 */

// ── String sanitizers ────────────────────────────────────────────────────────

/**
 * Strip leading/trailing whitespace and collapse internal runs of whitespace.
 */
export function trimInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * HTML-encode the five characters that are dangerous in an HTML context.
 * Use when you need to display untrusted text inside HTML (not React JSX —
 * React escapes automatically, so this is for dangerouslySetInnerHTML or
 * raw DOM insertions only).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Strip all HTML tags from a string (text content only).
 * Safe to use for displaying user-generated content in plain-text contexts.
 */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true only for http / https URLs.
 * Use before rendering user-supplied links to prevent javascript: injections.
 */
export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Object sanitizers ────────────────────────────────────────────────────────

/**
 * Recursively trim all string values in a plain object.
 * Pass your form data through this before sending to the API.
 *
 * @example
 *   const cleaned = sanitizeFormData({ name: "  Alice  ", bio: "  dev  " });
 *   // → { name: "Alice", bio: "dev" }
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      result[key] = trimInput(value);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeFormData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// ── Validators (client-side, mirroring server rules) ─────────────────────────

/** True if the string is a plausible email address. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Password strength check — mirrors server-side passwordRule().
 * Returns a list of unmet requirements (empty array = valid).
 */
export function passwordErrors(value: string): string[] {
  const errors: string[] = [];
  if (value.length < 8)          errors.push("At least 8 characters");
  if (value.length > 128)        errors.push("No more than 128 characters");
  if (!/[A-Z]/.test(value))      errors.push("At least one uppercase letter");
  if (!/[0-9]/.test(value))      errors.push("At least one number");
  return errors;
}

/** True if the string is a valid 24-character MongoDB ObjectId. */
export function isMongoId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
