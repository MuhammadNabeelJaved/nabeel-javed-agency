/**
 * useSidebarPreferences
 *
 * Full sidebar customization per role, persisted in localStorage:
 *   - itemOrder        : drag-sorted list of all link paths
 *   - pinned           : starred paths (always at top)
 *   - itemCategories   : path → catKey overrides (cross-category moves)
 *   - categoryOrder    : drag-sorted list of category keys
 *   - categoryCollapsed: catKey → collapsed boolean
 *   - customNames      : path or "cat:<key>" → renamed label
 */
import { useState, useCallback } from 'react';

export interface SidebarLinkDef {
  name: string;
  path: string;
  icon: React.ElementType;
  category?: string;
}

export interface CategoryDef {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarCustomPrefs {
  itemOrder: string[];
  pinned: string[];
  itemCategories: Record<string, string>;
  categoryOrder: string[];
  categoryCollapsed: Record<string, boolean>;
  customNames: Record<string, string>;
}

function loadPrefs(
  storageKey: string,
  defaultLinks: SidebarLinkDef[],
  defaultCats: CategoryDef[],
): SidebarCustomPrefs {
  const defaultPaths   = defaultLinks.map(l => l.path);
  const defaultCatKeys = defaultCats.map(c => c.key);
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SidebarCustomPrefs>;
      const validPaths = new Set(defaultPaths);
      const validCats  = new Set(defaultCatKeys);

      const savedOrder = (p.itemOrder || []).filter(x => validPaths.has(x));
      const freshPaths = defaultPaths.filter(x => !savedOrder.includes(x));

      const savedCatOrder = (p.categoryOrder || []).filter(x => validCats.has(x));
      const freshCats     = defaultCatKeys.filter(x => !savedCatOrder.includes(x));

      return {
        itemOrder: [...savedOrder, ...freshPaths],
        pinned: (p.pinned || []).filter(x => validPaths.has(x)),
        itemCategories: Object.fromEntries(
          Object.entries(p.itemCategories || {}).filter(([k]) => validPaths.has(k)),
        ),
        categoryOrder: [...savedCatOrder, ...freshCats],
        categoryCollapsed: p.categoryCollapsed || {},
        customNames: p.customNames || {},
      };
    }
  } catch {}
  return {
    itemOrder:         [...defaultPaths],
    pinned:            [],
    itemCategories:    {},
    categoryOrder:     [...defaultCatKeys],
    categoryCollapsed: {},
    customNames:       {},
  };
}

function persist(key: string, prefs: SidebarCustomPrefs) {
  try { localStorage.setItem(key, JSON.stringify(prefs)); } catch {}
}

export function useSidebarPreferences(
  roleKey: string,
  defaultLinks: SidebarLinkDef[],
  defaultCategories: CategoryDef[],
) {
  const storageKey = `${roleKey}-sidebar-custom`;

  const [prefs, setPrefs] = useState<SidebarCustomPrefs>(() =>
    loadPrefs(storageKey, defaultLinks, defaultCategories),
  );

  const update = useCallback((fn: (p: SidebarCustomPrefs) => SidebarCustomPrefs) => {
    setPrefs(prev => { const next = fn(prev); persist(storageKey, next); return next; });
  }, [storageKey]);

  /* ── helpers ─────────────────────────────────────────────────────────── */

  const getLinkCat = useCallback(
    (link: SidebarLinkDef) => prefs.itemCategories[link.path] ?? link.category ?? 'main',
    [prefs.itemCategories],
  );

  /* ── read API ────────────────────────────────────────────────────────── */

  const getOrderedCategories = useCallback(() => prefs.categoryOrder, [prefs.categoryOrder]);

  const getLinksForCategory = useCallback(
    (catKey: string, visibleLinks: SidebarLinkDef[]) => {
      const members = visibleLinks.filter(
        l => getLinkCat(l) === catKey && !prefs.pinned.includes(l.path),
      );
      const idx = new Map(prefs.itemOrder.map((p, i) => [p, i]));
      return members.sort((a, b) => (idx.get(a.path) ?? 999) - (idx.get(b.path) ?? 999));
    },
    [prefs.itemOrder, prefs.pinned, getLinkCat],
  );

  const getPinnedLinks = useCallback(
    (visibleLinks: SidebarLinkDef[]) => {
      const idx = new Map(prefs.itemOrder.map((p, i) => [p, i]));
      return visibleLinks
        .filter(l => prefs.pinned.includes(l.path))
        .sort((a, b) => (idx.get(a.path) ?? 999) - (idx.get(b.path) ?? 999));
    },
    [prefs.pinned, prefs.itemOrder],
  );

  const isPinned         = useCallback((path: string) => prefs.pinned.includes(path), [prefs.pinned]);
  const isCatCollapsed   = useCallback((k: string) => !!prefs.categoryCollapsed[k], [prefs.categoryCollapsed]);
  const getLinkLabel     = useCallback((path: string, def: string) => prefs.customNames[path] || def, [prefs.customNames]);
  const getCatLabel      = useCallback((key: string, def: string) => prefs.customNames[`cat:${key}`] || def, [prefs.customNames]);

  /* ── write API ───────────────────────────────────────────────────────── */

  const togglePin = useCallback((path: string) => {
    update(prev => ({
      ...prev,
      pinned: prev.pinned.includes(path)
        ? prev.pinned.filter(p => p !== path)
        : [...prev.pinned, path],
    }));
  }, [update]);

  const toggleCatCollapsed = useCallback((key: string) => {
    update(prev => ({
      ...prev,
      categoryCollapsed: { ...prev.categoryCollapsed, [key]: !prev.categoryCollapsed[key] },
    }));
  }, [update]);

  const renameLink = useCallback((path: string, newName: string) => {
    update(prev => {
      const n = { ...prev.customNames };
      const t = newName.trim();
      if (!t) { delete n[path]; } else { n[path] = t; }
      return { ...prev, customNames: n };
    });
  }, [update]);

  const renameCategory = useCallback((key: string, newName: string) => {
    update(prev => {
      const n = { ...prev.customNames };
      const k = `cat:${key}`;
      const t = newName.trim();
      if (!t) { delete n[k]; } else { n[k] = t; }
      return { ...prev, customNames: n };
    });
  }, [update]);

  /**
   * Move an item:
   *  - targetPath: insert before this item (null = append to end of category)
   *  - toCatKey:   assign item to this category
   */
  const moveItem = useCallback((fromPath: string, targetPath: string | null, toCatKey?: string) => {
    update(prev => {
      const order = [...prev.itemOrder];
      const fi    = order.indexOf(fromPath);
      if (fi === -1) return prev;

      const cats = { ...prev.itemCategories };
      if (toCatKey) cats[fromPath] = toCatKey;

      if (targetPath && targetPath !== fromPath) {
        order.splice(fi, 1);
        const ti = order.indexOf(targetPath);
        if (ti === -1) order.push(fromPath);
        else            order.splice(ti, 0, fromPath);
      }

      return { ...prev, itemOrder: order, itemCategories: cats };
    });
  }, [update]);

  /** Reorder categories by dragging one before another. 'main' is immovable. */
  const moveCategory = useCallback((fromKey: string, toKey: string) => {
    if (fromKey === toKey || fromKey === 'main') return;
    update(prev => {
      const order = [...prev.categoryOrder];
      const fi    = order.indexOf(fromKey);
      const ti    = order.indexOf(toKey);
      if (fi === -1 || ti === -1) return prev;
      order.splice(fi, 1);
      order.splice(ti, 0, fromKey);
      return { ...prev, categoryOrder: order };
    });
  }, [update]);

  return {
    /* read */
    getOrderedCategories,
    getLinksForCategory,
    getPinnedLinks,
    isPinned,
    isCatCollapsed,
    getLinkLabel,
    getCatLabel,
    /* write */
    togglePin,
    toggleCatCollapsed,
    renameLink,
    renameCategory,
    moveItem,
    moveCategory,
  };
}
