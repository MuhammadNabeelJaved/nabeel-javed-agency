/**
 * NavFooterManager
 * Admin page to manage Navbar links and Footer sections/links.
 * Changes are saved to the CMS backend and reflected site-wide instantly.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, Loader2, GripVertical,
  Link as LinkIcon, ExternalLink, Eye, EyeOff,
  ChevronDown, ChevronRight, Navigation, LayoutTemplate,
  RotateCcw, Pencil, Check, X, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useContent, type NavLinkItem, type FooterSectionItem, type FooterLinkItem } from '../../contexts/ContentContext';

// ── tiny toggle ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Predefined existing pages ──────────────────────────────────────────────
const EXISTING_PAGES = [
  { label: 'Home',           href: '/' },
  { label: 'Services',       href: '/services' },
  { label: 'About',          href: '/about' },
  { label: 'Portfolio',      href: '/portfolio' },
  { label: 'Careers',        href: '/careers' },
  { label: 'Blog',           href: '/blog' },
  { label: 'Contact',        href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Cookie Policy',  href: '/cookies' },
];

type Tab = 'navbar' | 'footer';

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR TAB
// ─────────────────────────────────────────────────────────────────────────────
function NavbarTab() {
  const { navLinks, updateNavLinks } = useContent();
  const [links, setLinks] = useState<NavLinkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setLinks(
      [...navLinks].sort((a, b) => a.order - b.order).map((l, i) => ({ ...l, order: i }))
    );
  }, [navLinks]);

  const addLink = () => {
    const newLink: NavLinkItem = {
      _id: `new-${Date.now()}`,
      label: '',
      href: '',
      order: links.length,
      isActive: true,
      openInNewTab: false,
    };
    setLinks(prev => [...prev, newLink]);
    setEditingId(newLink._id!);
  };

  const removeLink = (id: string) => setLinks(prev => prev.filter(l => l._id !== id));

  const updateField = (id: string, field: keyof NavLinkItem, value: any) =>
    setLinks(prev => prev.map(l => l._id === id ? { ...l, [field]: value } : l));

  const moveUp = (i: number) => {
    if (i === 0) return;
    setLinks(prev => {
      const arr = [...prev];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return arr.map((l, idx) => ({ ...l, order: idx }));
    });
  };

  const moveDown = (i: number) => {
    setLinks(prev => {
      if (i >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr.map((l, idx) => ({ ...l, order: idx }));
    });
  };

  const handleSave = async () => {
    const invalid = links.find(l => !l.label.trim() || !l.href.trim());
    if (invalid) { toast.error('All links must have a label and href'); return; }
    setSaving(true);
    try {
      await updateNavLinks(links.map((l, i) => ({ ...l, order: i })));
      toast.success('Navbar links saved');
    } catch {
      toast.error('Failed to save navbar links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {links.length} link{links.length !== 1 ? 's' : ''} · drag rows to reorder
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addLink} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Link
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Navigation className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No navbar links yet. Click "Add Link" to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {links.map((link, i) => (
              <motion.div
                key={link._id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className={`rounded-xl border ${link.isActive ? 'border-border bg-card' : 'border-border/40 bg-muted/20'} overflow-hidden`}
              >
                {/* Collapsed row */}
                {editingId !== link._id ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Order arrows */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveUp(i)} disabled={i === 0} className="p-0.5 rounded hover:bg-accent disabled:opacity-20">
                        <ChevronRight className="h-3 w-3 -rotate-90" />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === links.length - 1} className="p-0.5 rounded hover:bg-accent disabled:opacity-20">
                        <ChevronRight className="h-3 w-3 rotate-90" />
                      </button>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!link.isActive ? 'line-through text-muted-foreground' : ''}`}>
                        {link.label || <span className="text-muted-foreground italic">Untitled</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{link.href || '—'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {link.openInNewTab && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Toggle checked={link.isActive} onChange={() => updateField(link._id!, 'isActive', !link.isActive)} />
                      <button onClick={() => setEditingId(link._id!)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeLink(link._id!)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Expanded edit form */
                  <div className="p-4 space-y-3">
                    {/* Quick-pick from existing pages */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> Quick-pick an existing page
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {EXISTING_PAGES.map(page => (
                          <button
                            key={page.href}
                            type="button"
                            onClick={() => {
                              updateField(link._id!, 'href', page.href);
                              if (!link.label) updateField(link._id!, 'label', page.label);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              link.href === page.href
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {page.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-medium">Label</label>
                        <Input
                          value={link.label}
                          onChange={e => updateField(link._id!, 'label', e.target.value)}
                          placeholder="e.g. Services"
                          className="h-9"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-medium">URL / Path</label>
                        <Input
                          value={link.href}
                          onChange={e => updateField(link._id!, 'href', e.target.value)}
                          placeholder="e.g. /services or https://..."
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Toggle checked={link.isActive} onChange={() => updateField(link._id!, 'isActive', !link.isActive)} />
                          Active
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Toggle checked={link.openInNewTab} onChange={() => updateField(link._id!, 'openInNewTab', !link.openInNewTab)} />
                          Open in new tab
                        </label>
                      </div>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                        <Check className="h-3.5 w-3.5" /> Done
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER TAB
// ─────────────────────────────────────────────────────────────────────────────
function FooterTab() {
  const { footerSections, updateFooterSections } = useContent();
  const [sections, setSections] = useState<FooterSectionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ sectionId: string; linkId: string } | null>(null);

  useEffect(() => {
    setSections(
      [...footerSections].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
    );
  }, [footerSections]);

  const addSection = () => {
    const id = `new-sec-${Date.now()}`;
    setSections(prev => [...prev, { _id: id, title: '', order: prev.length, links: [] }]);
    setExpandedSection(id);
  };

  const removeSection = (id: string) => setSections(prev => prev.filter(s => s._id !== id));

  const updateSectionTitle = (id: string, title: string) =>
    setSections(prev => prev.map(s => s._id === id ? { ...s, title } : s));

  const addLink = (sectionId: string) => {
    const linkId = `new-lnk-${Date.now()}`;
    setSections(prev => prev.map(s =>
      s._id === sectionId
        ? { ...s, links: [...s.links, { _id: linkId, label: '', href: '', isActive: true, openInNewTab: false }] }
        : s
    ));
    setEditingLink({ sectionId, linkId });
  };

  const removeLink = (sectionId: string, linkId: string) =>
    setSections(prev => prev.map(s =>
      s._id === sectionId ? { ...s, links: s.links.filter(l => l._id !== linkId) } : s
    ));

  const updateLink = (sectionId: string, linkId: string, field: keyof FooterLinkItem, value: any) =>
    setSections(prev => prev.map(s =>
      s._id === sectionId
        ? { ...s, links: s.links.map(l => l._id === linkId ? { ...l, [field]: value } : l) }
        : s
    ));

  const moveSectionUp = (i: number) => {
    if (i === 0) return;
    setSections(prev => {
      const arr = [...prev];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return arr.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const moveSectionDown = (i: number) => {
    setSections(prev => {
      if (i >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const handleSave = async () => {
    const invalidSection = sections.find(s => !s.title.trim());
    if (invalidSection) { toast.error('All sections must have a title'); return; }
    const invalidLink = sections.flatMap(s => s.links).find(l => !l.label.trim() || !l.href.trim());
    if (invalidLink) { toast.error('All links must have a label and URL'); return; }
    setSaving(true);
    try {
      await updateFooterSections(sections.map((s, i) => ({ ...s, order: i })));
      toast.success('Footer sections saved');
    } catch {
      toast.error('Failed to save footer sections');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addSection} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Section
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No footer sections yet. Click "Add Section" to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, si) => {
            const isExpanded = expandedSection === section._id;
            return (
              <motion.div
                key={section._id}
                layout
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveSectionUp(si)} disabled={si === 0} className="p-0.5 rounded hover:bg-accent disabled:opacity-20">
                      <ChevronRight className="h-3 w-3 -rotate-90" />
                    </button>
                    <button onClick={() => moveSectionDown(si)} disabled={si === sections.length - 1} className="p-0.5 rounded hover:bg-accent disabled:opacity-20">
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </button>
                  </div>
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

                  <Input
                    value={section.title}
                    onChange={e => updateSectionTitle(section._id!, e.target.value)}
                    placeholder="Section title…"
                    className="h-8 font-semibold text-sm flex-1"
                  />

                  <span className="text-xs text-muted-foreground shrink-0">{section.links.length} links</span>

                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section._id!)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors shrink-0"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => removeSection(section._id!)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Links list */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                        {section.links.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2 text-center">No links in this section yet.</p>
                        )}
                        <AnimatePresence initial={false}>
                          {section.links.map((link) => {
                            const isEditingThis = editingLink?.sectionId === section._id && editingLink?.linkId === link._id;
                            return (
                              <motion.div
                                key={link._id}
                                layout
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`rounded-lg border ${link.isActive ? 'border-border/60 bg-background' : 'border-border/30 bg-muted/20'}`}
                              >
                                {!isEditingThis ? (
                                  <div className="flex items-center gap-3 px-3 py-2">
                                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-sm truncate block ${!link.isActive ? 'line-through text-muted-foreground' : ''}`}>
                                        {link.label || <span className="italic text-muted-foreground">Untitled</span>}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate block">{link.href || '—'}</span>
                                    </div>
                                    {link.openInNewTab && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />}
                                    <Toggle checked={link.isActive} onChange={() => updateLink(section._id!, link._id!, 'isActive', !link.isActive)} />
                                    <button onClick={() => setEditingLink({ sectionId: section._id!, linkId: link._id! })} className="p-1 rounded hover:bg-accent text-muted-foreground">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => removeLink(section._id!, link._id!)} className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input value={link.label} onChange={e => updateLink(section._id!, link._id!, 'label', e.target.value)} placeholder="Label" className="h-8 text-sm" autoFocus />
                                      <Input value={link.href} onChange={e => updateLink(section._id!, link._id!, 'href', e.target.value)} placeholder="/path or https://…" className="h-8 text-sm" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                          <Toggle checked={link.isActive} onChange={() => updateLink(section._id!, link._id!, 'isActive', !link.isActive)} />
                                          Active
                                        </label>
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                          <Toggle checked={link.openInNewTab} onChange={() => updateLink(section._id!, link._id!, 'openInNewTab', !link.openInNewTab)} />
                                          New tab
                                        </label>
                                      </div>
                                      <button onClick={() => setEditingLink(null)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                                        <Check className="h-3 w-3" /> Done
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>

                        <button
                          onClick={() => addLink(section._id!)}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add link
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function NavFooterManager() {
  const [tab, setTab] = useState<Tab>('navbar');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nav & Footer Manager</h1>
        <p className="text-muted-foreground mt-1">Manage navbar links and footer sections. Changes reflect on the live website instantly after saving.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 w-fit">
        {([
          { id: 'navbar', label: 'Navbar Links', icon: Navigation },
          { id: 'footer', label: 'Footer Sections', icon: LayoutTemplate },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {tab === 'navbar' ? <NavbarTab /> : <FooterTab />}
      </div>
    </div>
  );
}
