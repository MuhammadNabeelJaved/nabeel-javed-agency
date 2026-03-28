/**
 * CookieConsentContext
 * GDPR-compliant cookie consent state management.
 *
 * Consent structure (exact keys as required):
 *   { essential, functional, analytics, marketing, consentGiven, timestamp }
 *
 * Storage:
 *   - Primary  → localStorage key "cookie_consent"
 *   - Fallback → document.cookie  "cookie_consent" (365-day, SameSite=Lax)
 *
 * Script lifecycle:
 *   - Scripts are NEVER loaded before consentGiven === true
 *   - Scripts load only once per session (deduped by id)
 *   - Preferences are re-evaluated on every saveConsent / acceptAll call
 *
 * Migration:
 *   - Detects and migrates the old "cookie-preferences" key automatically
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { loadScript, removeScript } from '../lib/scriptLoader';
import apiClient from '../api/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consentGiven: boolean;
  timestamp: string | null;
}

interface CookieConsentContextValue {
  consent: CookieConsent;
  /** Update one or more keys without saving yet */
  updateConsent: (updates: Partial<Omit<CookieConsent, 'essential'>>) => void;
  /** Persist current state, set consentGiven=true, trigger scripts */
  saveConsent: () => void;
  /** Reset non-essential toggles to OFF (does NOT auto-save) */
  resetConsent: () => void;
  /** Set all to true, save immediately, trigger all scripts */
  acceptAll: () => void;
  /** True once user has made any decision (consent exists in storage) */
  hasDecided: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cookie_consent';
const COOKIE_NAME = 'cookie_consent';

const DEFAULT_CONSENT: CookieConsent = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  consentGiven: false,
  timestamp: null,
};

// ── Script IDs (prevent duplicate injection) ─────────────────────────────────

const SCRIPT_IDS = {
  analytics: 'ga-script',
  marketing: 'fb-pixel',
  functional: 'functional-scripts',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function persistToStorage(c: CookieConsent) {
  // localStorage (primary)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));

  // Cookie fallback (365 days, SameSite=Lax, no HttpOnly so JS can read it)
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const payload = JSON.stringify({
    essential: c.essential,
    functional: c.functional,
    analytics: c.analytics,
    marketing: c.marketing,
    consentGiven: c.consentGiven,
  });
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(payload)}`,
    `expires=${expires.toUTCString()}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ');
}

function loadFromStorage(): CookieConsent | null {
  // SSR guard
  if (typeof window === 'undefined') return null;

  try {
    // Primary: localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CookieConsent;

    // Migration: old "cookie-preferences" key (uses "necessary" not "essential")
    const oldRaw = localStorage.getItem('cookie-preferences');
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Record<string, boolean>;
      const migrated: CookieConsent = {
        essential: true,
        functional: old.functional ?? false,
        analytics: old.analytics ?? false,
        marketing: old.marketing ?? false,
        consentGiven: true,
        timestamp: new Date().toISOString(),
      };
      persistToStorage(migrated);
      // Clean up old keys
      localStorage.removeItem('cookie-preferences');
      localStorage.removeItem('cookie-consent');
      return migrated;
    }
  } catch {
    // Ignore parse errors (private browsing, quota exceeded, etc.)
  }

  return null;
}

async function postConsentToBackend(c: CookieConsent, userId?: string | null) {
  try {
    await apiClient.post('/consent', {
      consent: {
        essential: c.essential,
        functional: c.functional,
        analytics: c.analytics,
        marketing: c.marketing,
      },
      timestamp: c.timestamp,
      userId: userId ?? null,
    });
  } catch {
    // Non-blocking — consent works perfectly without backend
  }
}

function getAuthUserId(): string | null {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw)?._id ?? null) : null;
  } catch {
    return null;
  }
}

// ── Script triggering ────────────────────────────────────────────────────────

function triggerConsentScripts(c: CookieConsent) {
  if (typeof window === 'undefined') return;

  // ── Google Analytics ──────────────────────────────────────────────────────
  if (c.analytics) {
    const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_ID) {
      loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
        SCRIPT_IDS.analytics
      )
        .then(() => {
          (window as any).dataLayer = (window as any).dataLayer || [];
          function gtag(..._args: any[]) {
            // eslint-disable-next-line prefer-rest-params
            (window as any).dataLayer.push(arguments);
          }
          gtag('js', new Date());
          gtag('config', GA_ID, { anonymize_ip: true });
        })
        .catch(() => {});
    }
  } else {
    removeScript(SCRIPT_IDS.analytics);
  }

  // ── Facebook Pixel ────────────────────────────────────────────────────────
  if (c.marketing) {
    const FB_ID = import.meta.env.VITE_FB_PIXEL_ID;
    if (FB_ID) {
      loadScript(
        'https://connect.facebook.net/en_US/fbevents.js',
        SCRIPT_IDS.marketing
      )
        .then(() => {
          (window as any).fbq?.('init', FB_ID);
          (window as any).fbq?.('track', 'PageView');
        })
        .catch(() => {});
    }
  } else {
    removeScript(SCRIPT_IDS.marketing);
  }

  // ── Functional scripts (add yours here) ───────────────────────────────────
  // if (c.functional) {
  //   loadScript('https://example.com/widget.js', SCRIPT_IDS.functional).catch(() => {});
  // } else {
  //   removeScript(SCRIPT_IDS.functional);
  // }
}

// ── Context ───────────────────────────────────────────────────────────────────

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(DEFAULT_CONSENT);
  const [hasDecided, setHasDecided] = useState(false);
  // Track whether we've restored from storage (avoid double-post on mount)
  const restoredRef = useRef(false);

  // ── Restore from storage on mount ────────────────────────────────────────
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setConsent(stored);
      if (stored.consentGiven) {
        setHasDecided(true);
        triggerConsentScripts(stored);
      }
    }
    restoredRef.current = true;
  }, []);

  // ── updateConsent ─────────────────────────────────────────────────────────
  const updateConsent = useCallback(
    (updates: Partial<Omit<CookieConsent, 'essential'>>) => {
      setConsent(prev => ({ ...prev, ...updates, essential: true }));
    },
    []
  );

  // ── saveConsent ───────────────────────────────────────────────────────────
  const saveConsent = useCallback(() => {
    setConsent(prev => {
      const updated: CookieConsent = {
        ...prev,
        essential: true,
        consentGiven: true,
        timestamp: new Date().toISOString(),
      };
      persistToStorage(updated);
      triggerConsentScripts(updated);
      postConsentToBackend(updated, getAuthUserId());
      return updated;
    });
    setHasDecided(true);
  }, []);

  // ── resetConsent ──────────────────────────────────────────────────────────
  const resetConsent = useCallback(() => {
    // Only resets toggles in local state — does NOT auto-save
    setConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      consentGiven: false,
      timestamp: null,
    });
  }, []);

  // ── acceptAll ─────────────────────────────────────────────────────────────
  const acceptAll = useCallback(() => {
    const updated: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      consentGiven: true,
      timestamp: new Date().toISOString(),
    };
    setConsent(updated);
    setHasDecided(true);
    persistToStorage(updated);
    triggerConsentScripts(updated);
    postConsentToBackend(updated, getAuthUserId());
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{ consent, updateConsent, saveConsent, resetConsent, acceptAll, hasDecided }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used inside <CookieConsentProvider>');
  }
  return ctx;
}
