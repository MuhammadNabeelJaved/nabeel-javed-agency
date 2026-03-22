/**
 * Admin Announcement Manager
 * Full CRUD for the announcement ticker bar.
 * Controls: text, emoji, link + label, bg color, text color, active toggle, order.
 */
import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Trash2, Edit, Eye, EyeOff, Loader2,
  RefreshCw, GripVertical, ExternalLink, Link as LinkIcon, Check, X,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Notification } from '../../components/Notification';
import { announcementsApi, type AnnouncementItem, type AnnouncementPayload } from '../../api/announcements.api';
import { useContent } from '../../contexts/ContentContext';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';

// ─── Color presets ──────────────────────────────────────────────────────────
const BG_PRESETS = [
  { label: 'Violet',    bg: '#7c3aed', text: '#ffffff' },
  { label: 'Blue',      bg: '#2563eb', text: '#ffffff' },
  { label: 'Sky',       bg: '#0284c7', text: '#ffffff' },
  { label: 'Green',     bg: '#16a34a', text: '#ffffff' },
  { label: 'Amber',     bg: '#d97706', text: '#ffffff' },
  { label: 'Red',       bg: '#dc2626', text: '#ffffff' },
  { label: 'Pink',      bg: '#db2777', text: '#ffffff' },
  { label: 'Dark',      bg: '#0f172a', text: '#ffffff' },
  { label: 'White',     bg: '#ffffff', text: '#1e293b' },
  { label: 'Gold',      bg: '#f59e0b', text: '#1e293b' },
];

const emptyForm = (): AnnouncementPayload => ({
  text: '',
  emoji: '',
  link: '',
  linkLabel: 'Learn More',
  bgColor: '#7c3aed',
  textColor: '#ffffff',
  isActive: true,
  order: 0,
});

// ─── Live preview ────────────────────────────────────────────────────────────
function Preview({ form }: { form: AnnouncementPayload }) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden h-10 flex items-center px-4 gap-3 text-sm font-medium select-none"
      style={{ backgroundColor: form.bgColor, color: form.textColor }}
    >
      {form.emoji && <span className="text-base">{form.emoji}</span>}
      <span className="truncate">{form.text || <span className="opacity-50 italic">Your announcement text…</span>}</span>
      {form.link && (
        <span className="ml-auto shrink-0 text-xs underline opacity-80">{form.linkLabel || 'Learn More'}</span>
      )}
    </div>
  );
}

// ─── Form Dialog ─────────────────────────────────────────────────────────────
function AnnouncementForm({
  open, onClose, onSave, saving, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AnnouncementPayload) => Promise<void>;
  saving: boolean;
  initial?: AnnouncementItem | null;
}) {
  const [form, setForm] = useState<AnnouncementPayload>(emptyForm());

  useEffect(() => {
    if (initial) {
      setForm({
        text: initial.text,
        emoji: initial.emoji || '',
        link: initial.link || '',
        linkLabel: initial.linkLabel || 'Learn More',
        bgColor: initial.bgColor,
        textColor: initial.textColor,
        isActive: initial.isActive,
        order: initial.order,
      });
    } else {
      setForm(emptyForm());
    }
  }, [initial, open]);

  const set = (k: keyof AnnouncementPayload, v: any) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (preset: typeof BG_PRESETS[0]) => {
    setForm(f => ({ ...f, bgColor: preset.bg, textColor: preset.text }));
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Update announcement content and appearance.' : 'Create a new announcement for the top bar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Live Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Live Preview</Label>
            <Preview form={form} />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <Label>Announcement Text <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.text}
              onChange={e => set('text', e.target.value)}
              placeholder="🎉 New service launch — Web App Development is now available!"
              rows={2}
              maxLength={300}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{form.text.length}/300</p>
          </div>

          {/* Emoji + Order row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Emoji (optional)</Label>
              <Input
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                placeholder="🎉 🚀 🔥 ✨"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={e => set('order', Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">Lower number = shown first</p>
            </div>
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Link URL (optional)</Label>
              <Input
                value={form.link}
                onChange={e => set('link', e.target.value)}
                placeholder="/services or https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link Label</Label>
              <Input
                value={form.linkLabel}
                onChange={e => set('linkLabel', e.target.value)}
                placeholder="Learn More"
                disabled={!form.link}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <Label>Colors</Label>
            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={preset.label}
                  className={`h-8 w-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    form.bgColor === preset.bg ? 'border-foreground scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset.bg }}
                />
              ))}
            </div>
            {/* Custom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Custom Background</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.bgColor}
                    onChange={e => set('bgColor', e.target.value)}
                    className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.bgColor}
                    onChange={e => set('bgColor', e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Custom Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={e => set('textColor', e.target.value)}
                    className="h-9 w-12 rounded-lg border border-border cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.textColor}
                    onChange={e => set('textColor', e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
            <div>
              <p className="text-sm font-medium">Show on website</p>
              <p className="text-xs text-muted-foreground">Inactive announcements are hidden from visitors</p>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.text.trim()}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Announcement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AnnouncementManager() {
  const { setAnnouncements } = useContent();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);

  const showNotif = (type: 'success' | 'error', title: string, message?: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const syncToContext = (updated: AnnouncementItem[]) => {
    setAnnouncements(updated.filter(a => a.isActive));
  };

  const load = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await announcementsApi.getAll();
      const data: AnnouncementItem[] = (res.data as any).data ?? [];
      setItems(data);
      syncToContext(data);
    } catch (err: any) {
      showNotif('error', 'Failed to load', err?.response?.data?.message || 'Could not fetch announcements.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form: AnnouncementPayload) => {
    setIsSaving(true);
    try {
      if (editing) {
        const res = await announcementsApi.update(editing._id, form);
        const updated = (res.data as any).data as AnnouncementItem;
        const newItems = items.map(i => i._id === editing._id ? updated : i);
        setItems(newItems);
        syncToContext(newItems);
        showNotif('success', 'Announcement updated');
      } else {
        const res = await announcementsApi.create(form);
        const created = (res.data as any).data as AnnouncementItem;
        const newItems = [...items, created].sort((a, b) => a.order - b.order);
        setItems(newItems);
        syncToContext(newItems);
        showNotif('success', 'Announcement created', 'It will appear on the website immediately.');
      }
      setIsFormOpen(false);
      setEditing(null);
    } catch (err: any) {
      showNotif('error', 'Save failed', err?.response?.data?.message || 'Could not save announcement.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: AnnouncementItem) => {
    setTogglingId(item._id);
    try {
      const res = await announcementsApi.update(item._id, { isActive: !item.isActive });
      const updated = (res.data as any).data as AnnouncementItem;
      const newItems = items.map(i => i._id === item._id ? updated : i);
      setItems(newItems);
      syncToContext(newItems);
      showNotif('success', updated.isActive ? 'Announcement shown' : 'Announcement hidden');
    } catch (err: any) {
      showNotif('error', 'Toggle failed', err?.response?.data?.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await announcementsApi.delete(deleteId);
      const newItems = items.filter(i => i._id !== deleteId);
      setItems(newItems);
      syncToContext(newItems);
      showNotif('success', 'Announcement deleted');
    } catch (err: any) {
      showNotif('error', 'Delete failed', err?.response?.data?.message);
    } finally {
      setDeleteId(null);
    }
  };

  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-6">
      {notification && (
        <Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <AnnouncementForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        saving={isSaving}
        initial={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        description="This announcement will be permanently deleted from the ticker bar."
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcement Bar</h2>
          <p className="text-muted-foreground mt-1">
            Manage the infinite scrolling ticker bar at the top of the website.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => load(true)} disabled={isRefreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => { setEditing(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Announcement
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: items.length,  color: 'text-foreground',  bg: 'bg-primary/10',    icon: Megaphone  },
          { label: 'Active',   value: activeCount,   color: 'text-green-600',   bg: 'bg-green-500/10',  icon: Eye        },
          { label: 'Hidden',   value: items.length - activeCount, color: 'text-muted-foreground', bg: 'bg-muted/40', icon: EyeOff },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Live ticker preview ── */}
      {activeCount > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="px-4 py-2 bg-muted/20 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview — as visitors see it</p>
          </div>
          <div className="overflow-hidden relative h-10 flex items-center"
            style={{ backgroundColor: items.find(i => i.isActive)?.bgColor || '#7c3aed' }}>
            <div
              className="animate-ticker flex items-center whitespace-nowrap"
              style={{ '--ticker-duration': '20s' } as React.CSSProperties}
            >
              {[...items.filter(i => i.isActive), ...items.filter(i => i.isActive)].map((item, idx) => (
                <React.Fragment key={`${item._id}-${idx}`}>
                  <span className="mx-6 opacity-40 text-xs" style={{ color: item.textColor }}>◆</span>
                  <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: item.textColor }}>
                    {item.emoji && <span className="text-base">{item.emoji}</span>}
                    <span>{item.text}</span>
                    {item.link && <span className="text-xs underline opacity-80">{item.linkLabel}</span>}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading announcements...
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full border-2 border-dashed border-border/50 rounded-2xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          <p className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">No announcements yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Click to add your first announcement</p>
        </button>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item._id} className={`border-border/50 overflow-hidden transition-opacity ${!item.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Color strip */}
                  <div className="w-1.5 shrink-0 rounded-l-xl" style={{ backgroundColor: item.bgColor }} />

                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
                    {/* Preview strip */}
                    <div
                      className="w-full sm:w-48 h-8 rounded-lg flex items-center px-3 gap-2 text-xs font-medium shrink-0 overflow-hidden"
                      style={{ backgroundColor: item.bgColor, color: item.textColor }}
                    >
                      {item.emoji && <span>{item.emoji}</span>}
                      <span className="truncate">{item.text}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.text}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {item.link && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <LinkIcon className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{item.link}</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">Order: {item.order}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${item.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {item.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {item.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        title={item.isActive ? 'Hide announcement' : 'Show announcement'}
                        onClick={() => handleToggleActive(item)}
                        disabled={togglingId === item._id}
                      >
                        {togglingId === item._id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : item.isActive ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => { setEditing(item); setIsFormOpen(true); }}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                        onClick={() => setDeleteId(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
