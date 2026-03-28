/**
 * Script Loader Utility
 * Handles safe, deduped loading/removal of third-party scripts.
 * Scripts are only injected after explicit cookie consent is given.
 */

const loadedIds = new Set<string>();

/**
 * Dynamically load a script by src, identified by a unique DOM id.
 * Safe to call multiple times — will no-op if already loaded.
 */
export function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already tracked in memory or already in the DOM
    if (loadedIds.has(id) || document.getElementById(id)) {
      loadedIds.add(id);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = () => {
      loadedIds.add(id);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Remove a previously loaded script from the DOM and memory tracker.
 * Note: removing a script does NOT un-run its side-effects (e.g. GA global).
 * For full cleanup a page reload is typically needed.
 */
export function removeScript(id: string): void {
  const el = document.getElementById(id);
  if (el) el.remove();
  loadedIds.delete(id);
}

/** Check whether a script has already been loaded */
export function isScriptLoaded(id: string): boolean {
  return loadedIds.has(id) || !!document.getElementById(id);
}
