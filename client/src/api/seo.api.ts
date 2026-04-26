import apiClient from './apiClient';

export interface SeoMetaEntry {
    _id?: string;
    page: string;
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    updatedAt?: string;
}

export const seoApi = {
    getAll: () =>
        apiClient.get<{ data: SeoMetaEntry[] }>('/seo').then(r => r.data.data),

    getByPage: (page: string) =>
        apiClient.get<{ data: SeoMetaEntry }>(`/seo/${encodeURIComponent(page)}`).then(r => r.data.data),

    upsert: (page: string, data: Partial<SeoMetaEntry>) =>
        apiClient.put<{ data: SeoMetaEntry }>(`/seo/${encodeURIComponent(page)}`, data).then(r => r.data.data),

    delete: (page: string) =>
        apiClient.delete(`/seo/${encodeURIComponent(page)}`),
};
