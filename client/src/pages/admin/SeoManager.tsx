import React, { useEffect, useState, useCallback } from 'react';
import {
    Search, Globe, Save, RotateCcw, Plus, ChevronDown, ChevronUp,
    Eye, EyeOff, Loader2, RefreshCw, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { seoApi, SeoMetaEntry } from '../../api/seo.api';

const PAGE_REGISTRY: { key: string; label: string }[] = [
    { key: '/', label: 'Home' },
    { key: '/about', label: 'About' },
    { key: '/services', label: 'Services' },
    { key: '/portfolio', label: 'Portfolio' },
    { key: '/careers', label: 'Careers' },
    { key: '/contact', label: 'Contact' },
    { key: '/our-team', label: 'Our Team' },
    { key: '/privacy', label: 'Privacy Policy' },
    { key: '/terms', label: 'Terms of Service' },
    { key: '/cookies', label: 'Cookie Settings' },
];

const EMPTY: Omit<SeoMetaEntry, 'page'> = {
    title: '', description: '', keywords: '',
    ogTitle: '', ogDescription: '', ogImage: '', canonicalUrl: '', noIndex: false,
};

interface PageRowProps {
    pageKey: string;
    label: string;
    saved: SeoMetaEntry | undefined;
    onSave: (page: string, data: Partial<SeoMetaEntry>) => Promise<void>;
    onReset: (page: string) => Promise<void>;
}

function PageRow({ pageKey, label, saved, onSave, onReset }: PageRowProps) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<SeoMetaEntry>({ ...EMPTY, ...saved, page: pageKey });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({ ...EMPTY, ...saved, page: pageKey });
    }, [saved, pageKey]);

    const set = (k: keyof SeoMetaEntry, v: string | boolean) =>
        setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try { await onSave(pageKey, form); }
        finally { setSaving(false); }
    };

    const titleLen = (form.title || '').length;
    const descLen  = (form.description || '').length;

    return (
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm text-foreground">{label}</span>
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{pageKey}</code>
                    {saved?.title && (
                        <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 text-xs">Customized</Badge>
                    )}
                    {saved?.noIndex && (
                        <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 text-xs">noindex</Badge>
                    )}
                </div>
                {open
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                }
            </button>

            {open && (
                <div className="border-t border-border/40 p-5 space-y-4 bg-muted/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label className="flex items-center gap-2">
                                Page Title
                                <span className={`text-xs font-normal ${titleLen > 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                    ({titleLen}/70)
                                </span>
                            </Label>
                            <Input
                                value={form.title || ''}
                                onChange={e => set('title', e.target.value)}
                                maxLength={70}
                                placeholder="Best Digital Agency | Nabeel Agency"
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <Label className="flex items-center gap-2">
                                Meta Description
                                <span className={`text-xs font-normal ${descLen > 150 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                    ({descLen}/160)
                                </span>
                            </Label>
                            <Textarea
                                value={form.description || ''}
                                onChange={e => set('description', e.target.value)}
                                maxLength={160}
                                rows={2}
                                placeholder="We build stunning websites, mobile apps, and brand identities..."
                            />
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Keywords <span className="text-xs font-normal text-muted-foreground">(comma-separated)</span></Label>
                            <Input
                                value={form.keywords || ''}
                                onChange={e => set('keywords', e.target.value)}
                                placeholder="web design, digital agency, UI/UX, branding"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>OG Title <span className="text-xs font-normal text-muted-foreground">(social share)</span></Label>
                            <Input
                                value={form.ogTitle || ''}
                                onChange={e => set('ogTitle', e.target.value)}
                                maxLength={70}
                                placeholder="Falls back to page title if empty"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>OG Image URL</Label>
                            <Input
                                value={form.ogImage || ''}
                                onChange={e => set('ogImage', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>OG Description</Label>
                            <Input
                                value={form.ogDescription || ''}
                                onChange={e => set('ogDescription', e.target.value)}
                                maxLength={200}
                                placeholder="Falls back to meta description"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Canonical URL <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                            <Input
                                value={form.canonicalUrl || ''}
                                onChange={e => set('canonicalUrl', e.target.value)}
                                placeholder="https://nabeel.agency/page"
                            />
                        </div>
                    </div>

                    {/* noIndex toggle */}
                    <div
                        onClick={() => set('noIndex', !form.noIndex)}
                        className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
                    >
                        <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${form.noIndex ? 'bg-red-500' : 'bg-muted-foreground/30'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.noIndex ? 'left-[18px]' : 'left-0.5'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                            {form.noIndex
                                ? <EyeOff className="h-4 w-4 text-red-500" />
                                : <Eye className="h-4 w-4 text-green-500" />
                            }
                            <span className="text-sm text-foreground">Block search engines (noindex, nofollow)</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                        {saved?.title && (
                            <Button
                                variant="outline"
                                onClick={() => onReset(pageKey)}
                                className="gap-2 text-muted-foreground"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SeoManager() {
    const [allMeta, setAllMeta] = useState<SeoMetaEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customPage, setCustomPage] = useState('');
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [pages, setPages] = useState([...PAGE_REGISTRY]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await seoApi.getAll();
            setAllMeta(data);
        } catch {
            toast.error('Failed to load SEO data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const getSaved = (key: string) => allMeta.find(m => m.page === key);

    const handleSave = async (page: string, data: Partial<SeoMetaEntry>) => {
        try {
            const updated = await seoApi.upsert(page, data);
            setAllMeta(prev => {
                const exists = prev.find(m => m.page === page);
                return exists ? prev.map(m => m.page === page ? updated : m) : [...prev, updated];
            });
            toast.success('SEO meta saved');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to save');
        }
    };

    const handleReset = async (page: string) => {
        try {
            await seoApi.delete(page);
            setAllMeta(prev => prev.filter(m => m.page !== page));
            toast.success('Reset to defaults');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to reset');
        }
    };

    const handleAddCustom = () => {
        const p = customPage.trim();
        if (!p || !p.startsWith('/')) {
            toast.error('Page path must start with /');
            return;
        }
        if (pages.find(x => x.key === p)) {
            toast.error('Page already exists');
            return;
        }
        setPages(prev => [...prev, { key: p, label: p }]);
        setCustomPage('');
        setShowAddCustom(false);
        toast.success('Custom page added');
    };

    const filtered = pages.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase())
    );

    const customized = allMeta.filter(m => m.title).length;
    const noIndexed  = allMeta.filter(m => m.noIndex).length;

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
                    <p className="text-muted-foreground mt-1">Control meta title, description, and Open Graph tags per page.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAddCustom(o => !o)} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Custom Page
                    </Button>
                </div>
            </div>

            {/* Add custom page */}
            {showAddCustom && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label>Custom page path</Label>
                                <Input
                                    value={customPage}
                                    onChange={e => setCustomPage(e.target.value)}
                                    placeholder="/custom-page-path"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                                />
                            </div>
                            <Button onClick={handleAddCustom} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setShowAddCustom(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Pages', value: pages.length, color: 'text-primary' },
                    { label: 'Customized', value: customized, color: 'text-green-600' },
                    { label: 'noIndex', value: noIndexed, color: 'text-red-600' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="pt-4 text-center">
                            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search pages…"
                    className="pl-10"
                />
            </div>

            {/* Page list */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(p => (
                        <PageRow
                            key={p.key}
                            pageKey={p.key}
                            label={p.label}
                            saved={getSaved(p.key)}
                            onSave={handleSave}
                            onReset={handleReset}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10">
                            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No pages match your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
