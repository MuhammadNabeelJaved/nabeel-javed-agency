/**
 * Admin Page Manager
 * Control which public pages are Active, Under Maintenance, or Coming Soon.
 * Supports adding custom URLs and deleting them.
 */
import React, { useState } from 'react';
import {
  Globe, Wrench, Clock, CheckCircle2, Loader2, RefreshCw, AlertTriangle,
  Plus, Trash2, X, ToggleLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectItem } from '../../components/ui/select';
import { useContent } from '../../contexts/ContentContext';
import { pageStatusApi, type PageStatusItem, type CreatePagePayload } from '../../api/pageStatus.api';
import { Notification } from '../../components/Notification';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    badge: 'bg-green-500/10 text-green-600 border-green-500/20',
    btn: 'bg-green-500 hover:bg-green-600 text-white',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  'coming-soon': {
    label: 'Coming Soon',
    icon: Clock,
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    btn: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Add Custom Page Dialog ─────────────────────────────────────────────────
interface AddPageDialogProps {
  onClose: () => void;
  onSave: (data: CreatePagePayload) => Promise<void>;
  saving: boolean;
}

function AddPageDialog({ onClose, onSave, saving }: AddPageDialogProps) {
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('/');
  const [matchPrefix, setMatchPrefix] = useState(true);
  const [status, setStatus] = useState<StatusKey>('coming-soon');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !path.trim()) return;
    await onSave({ label, path, matchPrefix, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl w-full max-w-md border border-border shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold">Add Custom Page</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Define a URL and set its visibility state.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="page-label">Page Name *</Label>
            <Input
              id="page-label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Blog, New Service, Pricing"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-path">URL Path *</Label>
            <Input
              id="page-path"
              value={path}
              onChange={e => {
                let v = e.target.value;
                if (v && !v.startsWith('/')) v = '/' + v;
                setPath(v);
              }}
              placeholder="/blog"
              required
              className="h-11 font-mono"
            />
            <p className="text-xs text-muted-foreground">Must start with /. Example: /blog or /pricing</p>
          </div>

          <div className="space-y-2">
            <Label>Initial Status</Label>
            <Select
              value={status}
              onValueChange={(val: any) => setStatus(val)}
              className="h-11"
            >
              <SelectItem value="coming-soon">Coming Soon</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
            <div>
              <p className="text-sm font-medium">Match sub-routes</p>
              <p className="text-xs text-muted-foreground">/blog/* also applies to /blog/post-1</p>
            </div>
            <button
              type="button"
              onClick={() => setMatchPrefix(!matchPrefix)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${matchPrefix ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${matchPrefix ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving || !label.trim() || !path.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Page
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PageManager() {
  const { pageStatuses, setPageStatuses } = useContent();
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error', title: string, message?: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await pageStatusApi.getAll();
      setPageStatuses(res.data.data ?? []);
    } catch {
      showNotification('error', 'Failed to refresh', 'Could not load page statuses.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdate = async (page: PageStatusItem, newStatus: StatusKey) => {
    if (page.status === newStatus) return;
    setUpdating(page.key);
    try {
      const res = await pageStatusApi.update(page.key, newStatus);
      const updated = (res.data as any).data as PageStatusItem;
      setPageStatuses(prev => prev.map(p => p.key === page.key ? { ...p, status: newStatus, updatedAt: updated.updatedAt } : p));
      showNotification('success', `${page.label} → ${STATUS_CONFIG[newStatus].label}`, 'Page status updated.');
    } catch (err: any) {
      showNotification('error', 'Update failed', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreate = async (data: CreatePagePayload) => {
    setIsSaving(true);
    try {
      const res = await pageStatusApi.create(data);
      const created = (res.data as any).data as PageStatusItem;
      setPageStatuses(prev => [...prev, created]);
      setShowAddDialog(false);
      showNotification('success', `"${created.label}" added`, 'Custom page created successfully.');
    } catch (err: any) {
      showNotification('error', 'Create failed', err?.response?.data?.message || 'Could not create page.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    setDeleting(key);
    try {
      await pageStatusApi.delete(key);
      setPageStatuses(prev => prev.filter(p => p.key !== key));
      showNotification('success', 'Page removed', 'Custom page deleted.');
    } catch (err: any) {
      showNotification('error', 'Delete failed', err?.response?.data?.message || 'Could not delete page.');
    } finally {
      setDeleting(null);
      setConfirmDeleteKey(null);
    }
  };

  const activeCount = pageStatuses.filter(p => p.status === 'active').length;
  const maintenanceCount = pageStatuses.filter(p => p.status === 'maintenance').length;
  const comingSoonCount = pageStatuses.filter(p => p.status === 'coming-soon').length;

  const builtInPages = pageStatuses.filter(p => !p.isCustom);
  const customPages = pageStatuses.filter(p => p.isCustom);

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {showAddDialog && (
        <AddPageDialog
          onClose={() => setShowAddDialog(false)}
          onSave={handleCreate}
          saving={isSaving}
        />
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl w-full max-w-sm border border-border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold">Delete Custom Page?</h3>
            <p className="text-sm text-muted-foreground">
              This will remove "<span className="font-medium text-foreground">{pageStatuses.find(p => p.key === confirmDeleteKey)?.label}</span>" from the Page Manager. Visitors seeing this page won't be redirected — the page just won't be managed here anymore.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteKey(null)}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting === confirmDeleteKey}
                onClick={() => handleDelete(confirmDeleteKey)}
              >
                {deleting === confirmDeleteKey ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page Manager</h2>
          <p className="text-muted-foreground mt-1">
            Control which public pages are live, under maintenance, or coming soon.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Page
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: activeCount, cfg: STATUS_CONFIG.active },
          { label: 'Maintenance', count: maintenanceCount, cfg: STATUS_CONFIG.maintenance },
          { label: 'Coming Soon', count: comingSoonCount, cfg: STATUS_CONFIG['coming-soon'] },
        ].map(({ label, count, cfg }) => {
          const Icon = cfg.icon;
          return (
            <Card key={label} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Admin bypass:</span> As an admin, you will always see the real page regardless of status — with a warning banner at the top. Regular visitors see the Maintenance or Coming Soon page instead.
        </p>
      </div>

      {/* ── Built-in Pages ── */}
      {pageStatuses.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading pages...
        </div>
      ) : (
        <>
          <PageGrid pages={builtInPages} updating={updating} onUpdate={handleUpdate} />

          {/* ── Custom Pages ── */}
          {customPages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Custom Pages</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{customPages.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {customPages.map(page => (
                  <PageCard
                    key={page.key}
                    page={page}
                    isUpdating={updating === page.key}
                    onUpdate={handleUpdate}
                    onDelete={() => setConfirmDeleteKey(page.key)}
                    isCustom
                  />
                ))}
              </div>
            </div>
          )}

          {customPages.length === 0 && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <Plus className="h-8 w-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add your first custom page</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Track any URL — /blog, /pricing, /new-feature</p>
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Extracted sub-components ──────────────────────────────────────────────

function PageGrid({ pages, updating, onUpdate }: {
  pages: PageStatusItem[];
  updating: string | null;
  onUpdate: (page: PageStatusItem, status: StatusKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {pages.map(page => (
        <PageCard key={page.key} page={page} isUpdating={updating === page.key} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function PageCard({ page, isUpdating, onUpdate, onDelete, isCustom }: {
  page: PageStatusItem;
  isUpdating: boolean;
  onUpdate: (page: PageStatusItem, status: StatusKey) => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  const currentStatus = page.status as StatusKey;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{page.label}</CardTitle>
                {isCustom && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Custom</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{page.path}{page.matchPrefix ? '/*' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={currentStatus} />
            {isCustom && onDelete && (
              <button
                onClick={onDelete}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete custom page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-xs text-muted-foreground mb-3">Set visibility for visitors:</p>
        <div className="grid grid-cols-3 gap-2">
          {(['active', 'maintenance', 'coming-soon'] as StatusKey[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            const isActive = currentStatus === s;
            return (
              <button
                key={s}
                onClick={() => onUpdate(page, s)}
                disabled={isUpdating || isActive}
                className={`
                  flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-medium
                  border transition-all duration-200
                  ${isActive
                    ? `${cfg.badge} ring-2 ring-offset-1 ring-current scale-[1.02] cursor-default`
                    : 'border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isUpdating && !isActive
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Icon className="h-4 w-4" />
                }
                <span className="leading-none text-center">{cfg.label}</span>
              </button>
            );
          })}
        </div>
        {page.updatedAt && (
          <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
            Last changed: {new Date(page.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
