import { useEffect } from 'react';
import { seoApi, SeoMetaEntry } from '../api/seo.api';

const DEFAULT_TITLE = 'Nabeel Agency — Creative Digital Solutions';
const DEFAULT_DESC  = 'Full-service digital agency delivering web, mobile, and branding solutions.';

export function useSeoMeta(pageKey: string) {
    useEffect(() => {
        let cancelled = false;

        seoApi.getByPage(pageKey).then((meta: SeoMetaEntry) => {
            if (cancelled || !meta) return;
            applyMeta(meta);
        }).catch(() => {/* silent – use page defaults */});

        return () => { cancelled = true; };
    }, [pageKey]);
}

function setOrCreate(selector: string, attrs: Record<string, string>) {
    let el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function applyMeta(meta: SeoMetaEntry) {
    if (meta.title)       document.title = meta.title;
    else                  document.title = DEFAULT_TITLE;

    const desc = meta.description || DEFAULT_DESC;
    setOrCreate('meta[name="description"]',           { name: 'description', content: desc });
    setOrCreate('meta[name="keywords"]',              { name: 'keywords',    content: meta.keywords || '' });
    setOrCreate('meta[property="og:title"]',          { property: 'og:title',       content: meta.ogTitle || meta.title || DEFAULT_TITLE });
    setOrCreate('meta[property="og:description"]',    { property: 'og:description', content: meta.ogDescription || desc });
    setOrCreate('meta[property="og:image"]',          { property: 'og:image',       content: meta.ogImage || '' });
    setOrCreate('meta[name="robots"]',                { name: 'robots', content: meta.noIndex ? 'noindex,nofollow' : 'index,follow' });

    // Canonical
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (meta.canonicalUrl) {
        if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
        canon.href = meta.canonicalUrl;
    }
}
