import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Database,
  Server,
  RefreshCw,
  HardDrive,
  Activity,
  Clock,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  AlertTriangle,
  Layers,
  Users,
  FolderOpen,
  MessageSquare,
  Bell,
  Briefcase,
  FileJson,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckSquare,
  Square,
  ListChecks,
  FilePlus2,
  PenLine,
  GitBranch,
  Upload,
  Table2,
  Zap,
  ShieldCheck,
  Eye,
  Key,
  BarChart3,
  FileUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectItem } from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && d + 'd', h && h + 'h', m && m + 'm'].filter(Boolean).join(' ') || '< 1m';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

// ─── Types ───────────────────────────────────────────────────────────────────
interface DbStats {
  db: {
    db: string;
    collections: number;
    objects: number;
    dataSize: number;
    storageSize: number;
    indexSize: number;
    avgObjSize: number;
    indexes: number;
  };
  server: {
    uptime: number;
    connections: { current: number; available: number; totalCreated: number };
    mem: { resident: number; virtual: number };
    opcounters: { insert: number; query: number; update: number; delete: number };
    network: { bytesIn: number; bytesOut: number; numRequests: number };
    host: string;
    version: string;
  };
}

interface CollectionInfo {
  name: string;
  count: number;
  sizeKB: number;
  avgObjSize: number;
  storageKB: number;
  indexSizeKB: number;
  indexCount: number;
}

interface CollectionDetail {
  stats: CollectionInfo;
  indexes: { name: string; key: Record<string, unknown>; unique?: boolean }[];
  sampleDocs: unknown[];
}

interface InsightsData {
  signupsByMonth: { _id: { year: number; month: number }; count: number }[];
  usersByRole: { _id: string; count: number }[];
  projectsByStatus: { _id: string; count: number }[];
  jobAppsByStatus: { _id: string; count: number }[];
  totals: {
    users: number;
    projects: number;
    messages: number;
    conversations: number;
    notifications: number;
    jobApplications: number;
  };
}

interface QueryResult {
  collection: string;
  count: number;
  executionTimeMs: number;
  results: Record<string, unknown>[];
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ''}`} />;
}

// ─── Tab 1: Overview ─────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: DbStats | null }) {
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const { db, server } = stats;
  const connCurrent = server?.connections?.current ?? 0;
  const connAvailable = server?.connections?.available ?? 0;
  const totalConnections = connCurrent + connAvailable;
  const connPct = totalConnections > 0 ? Math.round((connCurrent / totalConnections) * 100) : 0;
  const hasServerStats = !!(server?.connections || server?.opcounters);

  const opcData = [
    { name: 'Insert', value: server?.opcounters?.insert ?? 0, color: '#7c3aed' },
    { name: 'Query', value: server?.opcounters?.query ?? 0, color: '#2563eb' },
    { name: 'Update', value: server?.opcounters?.update ?? 0, color: '#d97706' },
    { name: 'Delete', value: server?.opcounters?.delete ?? 0, color: '#dc2626' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Database Size</p>
                <p className="text-2xl font-bold mt-1">{formatBytes(db.dataSize)}</p>
                <p className="text-xs text-muted-foreground mt-1">Storage: {formatBytes(db.storageSize)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Documents</p>
                <p className="text-2xl font-bold mt-1">{db.objects.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg: {formatBytes(db.avgObjSize)}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Database className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Collections</p>
                <p className="text-2xl font-bold mt-1">{db.collections}</p>
                <p className="text-xs text-muted-foreground mt-1">DB: {db.db}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Layers className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Indexes</p>
                <p className="text-2xl font-bold mt-1">{db.indexes}</p>
                <p className="text-xs text-muted-foreground mt-1">Index size: {formatBytes(db.indexSize)}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Health */}
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Server Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Host</p>
                <p className="font-mono text-xs mt-0.5 truncate">{server?.host ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MongoDB Version</p>
                <p className="font-mono text-xs mt-0.5">{server?.version ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-medium text-xs mt-0.5">{server?.uptime != null ? formatUptime(server.uptime) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="font-medium text-xs mt-0.5">{(server?.network?.numRequests ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Connections progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-medium">{connCurrent} / {totalConnections}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all"
                  style={{ width: `${connPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total created: {(server?.connections?.totalCreated ?? 0).toLocaleString()}</p>
            </div>

            {/* Memory */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Resident RAM</p>
                <p className="font-semibold text-sm mt-0.5">{server?.mem?.resident ?? '—'} MB</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Virtual RAM</p>
                <p className="font-semibold text-sm mt-0.5">{server?.mem?.virtual ?? '—'} MB</p>
              </div>
            </div>

            {/* Network */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Network In</p>
                <p className="font-semibold text-sm mt-0.5">{server?.network?.bytesIn != null ? formatBytes(server.network.bytesIn) : '—'}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Network Out</p>
                <p className="font-semibold text-sm mt-0.5">{server?.network?.bytesOut != null ? formatBytes(server.network.bytesOut) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations */}
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Operations (opcounters)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {opcData.map((op) => (
                <div key={op.name} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{op.name}</p>
                    <p className="font-bold text-lg mt-0.5">{(op.value ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: op.color + '22' }}>
                    <span className="h-3 w-3 rounded-full block" style={{ background: op.color }} />
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={opcData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {opcData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ─── Document Browser Dialog ──────────────────────────────────────────────────
interface DocBrowserProps {
  collection: CollectionInfo;
  onClose: () => void;
}

function DocBrowserDialog({ collection, onClose }: DocBrowserProps) {
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Bulk select ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => setSelectedIds(
    selectedIds.size === docs.length ? new Set() : new Set(docs.map(d => String(d._id ?? '')).filter(Boolean))
  );
  const allSelected = docs.length > 0 && selectedIds.size === docs.length;
  const clearSelection = () => setSelectedIds(new Set());

  // ── JSON editor modal ─────────────────────────────────────────────────────
  // mode: 'add' = single insert, 'edit' = single update, 'bulk-insert' = insertMany, 'bulk-update' = patch selected
  const [docModal, setDocModal] = useState<{ mode: 'add' | 'edit' | 'bulk-insert' | 'bulk-update'; doc?: Record<string, unknown> } | null>(null);
  const [docJson, setDocJson] = useState('');
  const [docSaving, setDocSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  async function fetchDocs(p = page, s = search) {
    setLoading(true);
    try {
      const res = await apiClient.get(`/database/collections/${collection.name}/documents`, {
        params: { page: p, limit: 20, search: s || undefined },
      });
      const data = res.data?.data;
      setDocs(data?.documents ?? []);
      setPagination(data?.pagination ?? { total: 0, pages: 1, limit: 20 });
    } catch (err: any) {
      toast.error('Failed to load documents', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDocs(1, ''); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    fetchDocs(1, searchInput);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(1);
    fetchDocs(1, '');
  }

  function changePage(p: number) {
    setPage(p);
    fetchDocs(p, search);
  }

  function openAdd() {
    setDocJson('{\n  \n}');
    setJsonError('');
    setDocModal({ mode: 'add' });
  }

  function openBulkInsert() {
    setDocJson('[\n  {\n    \n  }\n]');
    setJsonError('');
    setDocModal({ mode: 'bulk-insert' });
  }

  function openBulkUpdate() {
    setDocJson('{\n  \n}');
    setJsonError('');
    setDocModal({ mode: 'bulk-update' });
  }

  function openEdit(doc: Record<string, unknown>) {
    setDocJson(JSON.stringify(doc, null, 2));
    setJsonError('');
    setDocModal({ mode: 'edit', doc });
  }

  async function handleSave() {
    if (!docModal) return;
    setDocSaving(true);
    try {
      if (docModal.mode === 'add') {
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(docJson); } catch { setJsonError('Invalid JSON.'); setDocSaving(false); return; }
        await apiClient.post(`/database/collections/${collection.name}/documents`, parsed);
        toast.success('Document inserted');
      } else if (docModal.mode === 'edit') {
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(docJson); } catch { setJsonError('Invalid JSON.'); setDocSaving(false); return; }
        const id = String((docModal.doc as any)?._id);
        await apiClient.put(`/database/collections/${collection.name}/documents/${id}`, parsed);
        toast.success('Document updated');
      } else if (docModal.mode === 'bulk-insert') {
        let parsed: unknown[];
        try { parsed = JSON.parse(docJson); } catch { setJsonError('Invalid JSON array.'); setDocSaving(false); return; }
        if (!Array.isArray(parsed)) { setJsonError('Must be a JSON array [ ... ].'); setDocSaving(false); return; }
        const res = await apiClient.post(`/database/collections/${collection.name}/documents/bulk-insert`, { documents: parsed });
        toast.success(res.data?.message || `${parsed.length} document(s) inserted`);
      } else if (docModal.mode === 'bulk-update') {
        let patch: Record<string, unknown>;
        try { patch = JSON.parse(docJson); } catch { setJsonError('Invalid JSON object.'); setDocSaving(false); return; }
        const res = await apiClient.patch(`/database/collections/${collection.name}/documents/bulk-update`, {
          ids: Array.from(selectedIds),
          patch,
        });
        toast.success(res.data?.message || 'Documents updated');
        clearSelection();
      }
      setDocModal(null);
      fetchDocs(page, search);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setDocSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/database/collections/${collection.name}/documents/${deleteTarget}`);
      toast.success('Document deleted');
      setDeleteTarget(null);
      fetchDocs(page, search);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      const res = await apiClient.delete(`/database/collections/${collection.name}/documents/bulk`, {
        data: { ids: Array.from(selectedIds) },
      });
      toast.success(res.data?.message || `${selectedIds.size} document(s) deleted`);
      clearSelection();
      setConfirmBulkDelete(false);
      fetchDocs(page, search);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk delete failed');
    } finally { setBulkDeleting(false); }
  }

  // Auto-detect columns from the first visible doc
  const columns: string[] = docs.length > 0
    ? Object.keys(docs[0]).slice(0, 6) // show up to 6 columns
    : [];

  function preview(val: unknown): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + (JSON.stringify(val).length > 60 ? '…' : '');
    const s = String(val);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  // Detect dark/light class on <html> so portaled content inherits the theme
  const themeClass = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark') ? 'dark' : ''
    : '';

  return createPortal(
    <div className={themeClass}>
      {/* ── Full-screen overlay — portaled to document.body to escape layout stacking context ── */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[hsl(var(--background))] shadow-2xl overflow-hidden" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-mono text-foreground">{collection.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {pagination.total.toLocaleString()} document{pagination.total !== 1 ? 's' : ''}
                  {search && <span className="text-primary"> · filtered by "{search}"</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border" onClick={openBulkInsert} title="Insert multiple documents from JSON array">
                <FilePlus2 className="h-3.5 w-3.5" /> Bulk Insert
              </Button>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Add Document
              </Button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 border-b border-border/60 bg-background shrink-0">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by ID or field value…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/40 border-border focus:border-primary"
                />
              </div>
              <Button type="submit" size="sm" className="h-9 text-xs px-4">Search</Button>
              {search && (
                <Button type="button" variant="ghost" size="sm" className="h-9 text-xs px-3 text-muted-foreground" onClick={handleClearSearch}>
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </form>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="px-6 py-2 border-b border-border bg-primary/5 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <ListChecks className="h-4 w-4" />
                {selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-border" onClick={openBulkUpdate}>
                  <PenLine className="h-3.5 w-3.5" /> Bulk Update
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5" onClick={() => setConfirmBulkDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                </Button>
                <button onClick={clearSelection} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors" title="Clear selection">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto bg-background">
            {loading ? (
              <div className="p-6 space-y-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : docs.length === 0 ? (
              <div className="py-24 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">{search ? 'No documents match your search.' : 'This collection is empty.'}</p>
                {!search && <p className="text-xs mt-1 opacity-60">Click "Add Document" to insert the first one.</p>}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/60 backdrop-blur-sm border-b-2 border-border">
                    <th className="px-4 py-3 w-8 shrink-0">
                      <button onClick={toggleAll} title={allSelected ? 'Deselect all' : 'Select all'}>
                        {allSelected
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4 text-muted-foreground" />
                        }
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-10 shrink-0">#</th>
                    {columns.map((col) => (
                      <th key={col} className="text-left px-4 py-3 font-semibold text-muted-foreground font-mono whitespace-nowrap">{col}</th>
                    ))}
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-20 shrink-0">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {docs.map((doc, i) => {
                    const docId = String(doc._id ?? '');
                    const isExpanded = expandedId === docId;
                    const rowNum = (page - 1) * pagination.limit + i + 1;
                    return (
                      <React.Fragment key={docId || i}>
                        <tr
                          className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-primary/5 border-l-2 border-l-primary' : selectedIds.has(docId) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                          onClick={() => setExpandedId(isExpanded ? null : docId)}
                        >
                          <td className="px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => docId && toggleSelect(docId)}>
                              {selectedIds.has(docId)
                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                : <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              }
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono shrink-0">{rowNum}</td>
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-3 font-mono max-w-[200px]">
                              <span className="block truncate text-foreground/80">
                                {col === '_id'
                                  ? <span className="text-muted-foreground text-[10px]">…{String(doc[col]).slice(-10)}</span>
                                  : preview(doc[col])
                                }
                              </span>
                            </td>
                          ))}
                          <td className="px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Edit document"
                                onClick={() => openEdit(doc)}
                                className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {docId && (
                                <button
                                  title="Delete document"
                                  onClick={() => setDeleteTarget(docId)}
                                  className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded JSON row */}
                        {isExpanded && (
                          <tr className="bg-muted/10">
                            <td colSpan={columns.length + 3} className="px-6 py-4">
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Document JSON</p>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => openEdit(doc)}
                                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" /> Edit
                                  </button>
                                  {docId && (
                                    <button
                                      onClick={() => setDeleteTarget(docId)}
                                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              <pre className="bg-muted/80 border border-border rounded-xl p-4 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto max-h-64 whitespace-pre leading-relaxed">
                                {JSON.stringify(doc, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination footer */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 shrink-0 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {pagination.total > 0
                ? `Page ${page} of ${pagination.pages} · ${pagination.total.toLocaleString()} total document${pagination.total !== 1 ? 's' : ''}`
                : 'No documents'
              }
            </p>
            {pagination.pages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 border-border"
                  disabled={page <= 1} onClick={() => changePage(1)} title="First page"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 border-border"
                  disabled={page <= 1} onClick={() => changePage(page - 1)} title="Previous page"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.pages > 5) {
                    const start = Math.max(1, Math.min(page - 2, pagination.pages - 4));
                    p = start + i;
                  }
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 w-7 p-0 text-xs border-border ${p === page ? 'bg-primary text-primary-foreground border-primary' : ''}`}
                      onClick={() => changePage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 border-border"
                  disabled={page >= pagination.pages} onClick={() => changePage(page + 1)} title="Next page"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 border-border"
                  disabled={page >= pagination.pages} onClick={() => changePage(pagination.pages)} title="Last page"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── JSON Editor Modal ───────────────────────────────────────────────── */}
      {docModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div>
                <h3 className="font-semibold text-base text-foreground">
                  {docModal.mode === 'add' && 'Insert Document'}
                  {docModal.mode === 'edit' && 'Edit Document'}
                  {docModal.mode === 'bulk-insert' && 'Bulk Insert Documents'}
                  {docModal.mode === 'bulk-update' && `Bulk Update ${selectedIds.size} Document${selectedIds.size !== 1 ? 's' : ''}`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {docModal.mode === 'add' && `Add a new document to "${collection.name}".`}
                  {docModal.mode === 'edit' && `Edit document in "${collection.name}". The _id field is read-only.`}
                  {docModal.mode === 'bulk-insert' && `Paste a JSON array of documents to insert into "${collection.name}". Max 500.`}
                  {docModal.mode === 'bulk-update' && `Enter fields to $set on all ${selectedIds.size} selected documents. The _id field is ignored.`}
                </p>
              </div>
              <button
                onClick={() => { if (!docSaving) setDocModal(null); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">JSON Document</label>
              <textarea
                value={docJson}
                onChange={(e) => { setDocJson(e.target.value); setJsonError(''); }}
                rows={18}
                spellCheck={false}
                className="w-full bg-muted/60 border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed"
              />
              {jsonError && (
                <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {jsonError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button variant="outline" onClick={() => setDocModal(null)} disabled={docSaving} className="border-border">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={docSaving} className="gap-2 min-w-[120px]">
                {docSaving
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
                  : docModal.mode === 'add'         ? <><Plus className="h-4 w-4" /> Insert</>
                  : docModal.mode === 'edit'         ? <><Pencil className="h-4 w-4" /> Save Changes</>
                  : docModal.mode === 'bulk-insert'  ? <><FilePlus2 className="h-4 w-4" /> Insert All</>
                  :                                   <><PenLine className="h-4 w-4" /> Update All</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Delete Document</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-foreground">
                Permanently delete document from <span className="font-semibold text-foreground">{collection.name}</span>?
              </p>
              <div className="mt-3 bg-muted/50 border border-border rounded-lg px-3 py-2">
                <p className="font-mono text-xs text-muted-foreground break-all">{deleteTarget}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="border-border">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2 min-w-[100px]">
                {deleting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="h-4 w-4" /> Delete</>}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Bulk Delete Confirm ─────────────────────────────────────────────── */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Bulk Delete Documents</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-foreground">
                Permanently delete <span className="font-semibold text-foreground">{selectedIds.size} document{selectedIds.size !== 1 ? 's' : ''}</span> from <span className="font-semibold text-foreground">{collection.name}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button variant="outline" onClick={() => setConfirmBulkDelete(false)} disabled={bulkDeleting} className="border-border">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting} className="gap-2 min-w-[120px]">
                {bulkDeleting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Deleting…</> : <><Trash2 className="h-4 w-4" /> Delete {selectedIds.size}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Tab 2: Collections ───────────────────────────────────────────────────────
function CollectionsTab({ collections, loading, onRefresh }: { collections: CollectionInfo[]; loading: boolean; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [browserTarget, setBrowserTarget] = useState<CollectionInfo | null>(null);
  const [indexTarget, setIndexTarget] = useState<string | null>(null);
  const [schemaTarget, setSchemaTarget] = useState<string | null>(null);

  // Bulk create state
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: string[]; errors: { name: string; error: string }[] } | null>(null);

  // Bulk delete state
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [confirmBulkDrop, setConfirmBulkDrop] = useState(false);
  const [bulkDropping, setBulkDropping] = useState(false);

  const filtered = collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every(c => selectedNames.has(c.name));

  function toggleSelect(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedNames(allSelected ? new Set() : new Set(filtered.map(c => c.name)));
  }

  function clearSelection() { setSelectedNames(new Set()); }

  async function handleBulkDrop() {
    setBulkDropping(true);
    try {
      const res = await apiClient.delete('/database/collections/bulk', { data: { names: Array.from(selectedNames) } });
      const { dropped, errors } = res.data?.data ?? { dropped: [], errors: [] };
      if (dropped.length > 0) toast.success(`${dropped.length} collection(s) deleted`);
      if (errors.length > 0) toast.error(`${errors.length} collection(s) failed to delete`);
      clearSelection();
      setConfirmBulkDrop(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDropping(false);
    }
  }

  function formatSize(kb: number): string {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return kb.toFixed(1) + ' KB';
  }

  function openBulkCreate() {
    setBulkNames('');
    setBulkResult(null);
    setShowBulkCreate(true);
  }

  async function handleBulkCreate() {
    const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setBulkCreating(true);
    setBulkResult(null);
    try {
      const res = await apiClient.post('/database/collections/bulk-create', { names });
      const { created, errors } = res.data?.data ?? { created: [], errors: [] };
      setBulkResult({ created, errors });
      if (created.length > 0) toast.success(`${created.length} collection(s) created`);
      if (errors.length > 0 && created.length === 0) toast.error('All collections failed to create');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk create failed');
    } finally {
      setBulkCreating(false);
    }
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter collections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">{filtered.length} collection{filtered.length !== 1 ? 's' : ''}</p>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={openBulkCreate}>
            <Plus className="h-3.5 w-3.5" /> Create Collections
          </Button>
        </div>
      </div>

      {/* Bulk selection action bar */}
      {selectedNames.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedNames.size} collection{selectedNames.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setConfirmBulkDrop(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-muted/30 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} title={allSelected ? 'Deselect all' : 'Select all'}>
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">Collection</th>
                <th className="text-right px-4 py-3 font-medium">Documents</th>
                <th className="text-right px-4 py-3 font-medium">Size</th>
                <th className="text-right px-4 py-3 font-medium">Avg Doc</th>
                <th className="text-right px-4 py-3 font-medium">Indexes</th>
                <th className="text-right px-4 py-3 font-medium w-28"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((col) => {
                const isSelected = selectedNames.has(col.name);
                return (
                  <tr
                    key={col.name}
                    className={`border-b border-border/50 transition-colors cursor-pointer group ${isSelected ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                    onClick={() => setBrowserTarget(col)}
                    title={`Browse ${col.name}`}
                  >
                    <td className="px-4 py-3 w-10">
                      <button onClick={(e) => toggleSelect(col.name, e)} title="Select">
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Database className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-mono font-medium text-sm">{col.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{col.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatSize(col.sizeKB)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatBytes(col.avgObjSize)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="border-border text-xs">{col.indexCount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Schema Inspector"
                          onClick={() => setSchemaTarget(col.name)}
                          className="h-7 w-7 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 flex items-center justify-center transition-colors"
                        >
                          <Table2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Index Manager"
                          onClick={() => setIndexTarget(col.name)}
                          className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setBrowserTarget(col); }} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">
                    <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No collections found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Document Browser Dialog */}
      {browserTarget && (
        <DocBrowserDialog
          collection={browserTarget}
          onClose={() => setBrowserTarget(null)}
        />
      )}

      {/* Index Manager Modal */}
      {indexTarget && (
        <IndexManagerModal
          collectionName={indexTarget}
          onClose={() => setIndexTarget(null)}
        />
      )}

      {/* Schema Inspector Modal */}
      {schemaTarget && (
        <SchemaInspectorModal
          collectionName={schemaTarget}
          onClose={() => setSchemaTarget(null)}
        />
      )}

      {/* Bulk Drop Collections Confirm */}
      {confirmBulkDrop && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">Delete Collections</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">This will permanently drop all selected collections and their data.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Permanently drop <span className="font-semibold text-foreground">{selectedNames.size} collection{selectedNames.size !== 1 ? 's' : ''}</span>? This cannot be undone.
              </p>
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {Array.from(selectedNames).map(name => (
                  <span key={name} className="font-mono text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-md">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button variant="outline" onClick={() => setConfirmBulkDrop(false)} disabled={bulkDropping} className="border-border">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDrop} disabled={bulkDropping} className="gap-2 min-w-[140px]">
                {bulkDropping
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Deleting…</>
                  : <><Trash2 className="h-4 w-4" /> Delete {selectedNames.size}</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Collections Modal */}
      {showBulkCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  <FilePlus2 className="h-4 w-4 text-primary" /> Create Collections
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter one collection name per line. Max 20.
                </p>
              </div>
              <button
                onClick={() => { if (!bulkCreating) { setShowBulkCreate(false); setBulkResult(null); } }}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Collection Names (one per line)
                </label>
                <textarea
                  value={bulkNames}
                  onChange={(e) => { setBulkNames(e.target.value); setBulkResult(null); }}
                  rows={8}
                  placeholder={"audit_logs\ntemp_cache\nanalytics_events"}
                  spellCheck={false}
                  disabled={bulkCreating}
                  className="w-full bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed placeholder:text-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, digits, underscore (_) and dot (.) are allowed in collection names.
                </p>
              </div>

              {/* Results */}
              {bulkResult && (
                <div className="space-y-2">
                  {bulkResult.created.length > 0 && (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5">
                        Created ({bulkResult.created.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bulkResult.created.map(n => (
                          <span key={n} className="font-mono text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {bulkResult.errors.length > 0 && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                      <p className="text-xs font-semibold text-red-500 mb-1.5">
                        Failed ({bulkResult.errors.length})
                      </p>
                      <div className="space-y-1">
                        {bulkResult.errors.map(e => (
                          <p key={e.name} className="text-xs text-muted-foreground">
                            <span className="font-mono text-red-400">{e.name}</span> — {e.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                onClick={() => { setShowBulkCreate(false); setBulkResult(null); }}
                disabled={bulkCreating}
                className="border-border"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </Button>
              {!bulkResult && (
                <Button
                  onClick={handleBulkCreate}
                  disabled={bulkCreating || !bulkNames.trim()}
                  className="gap-2 min-w-[140px]"
                >
                  {bulkCreating
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Creating…</>
                    : <><FilePlus2 className="h-4 w-4" /> Create Collections</>
                  }
                </Button>
              )}
              {bulkResult && bulkResult.created.length > 0 && (
                <Button
                  onClick={() => { setBulkNames(''); setBulkResult(null); }}
                  variant="outline"
                  className="border-border gap-2"
                >
                  <Plus className="h-4 w-4" /> Create More
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab 3: Insights ──────────────────────────────────────────────────────────
function InsightsTab() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/database/insights');
        setInsights(res.data?.data ?? null);
      } catch (err: any) {
        toast.error('Failed to load insights', { description: err?.response?.data?.message || 'Please try again.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </motion.div>
    );
  }

  if (!insights) return null;

  const { totals, signupsByMonth, usersByRole, projectsByStatus, jobAppsByStatus } = insights;

  const signupChartData = signupsByMonth.map((item) => ({
    name: `${MONTH_NAMES[item._id.month - 1]} ${item._id.year}`,
    count: item.count,
  }));

  const totalCards = [
    { label: 'Users', value: totals.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Projects', value: totals.projects, icon: FolderOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Messages', value: totals.messages, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Conversations', value: totals.conversations, icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Notifications', value: totals.notifications, icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Job Applications', value: totals.jobApplications, icon: Briefcase, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {totalCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-muted/30 border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold">{card.value.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Signups chart */}
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">User Signups by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {signupChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signupChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No signup data available</p>
          )}
        </CardContent>
      </Card>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={usersByRole}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {usersByRole.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-[90px]">
                {usersByRole.map((item, idx) => (
                  <div key={item._id} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="capitalize text-muted-foreground">{item._id || 'Unknown'}</span>
                    <span className="font-semibold ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={projectsByStatus} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'rgba(124,58,237,0.08)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {projectsByStatus.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job Apps by Status */}
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Job Applications by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={jobAppsByStatus} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}
                cursor={{ fill: 'rgba(124,58,237,0.08)' }}
              />
              <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Tab 4: Query Builder ─────────────────────────────────────────────────────
function QueryTab({ collections }: { collections: CollectionInfo[] }) {
  const [collection, setCollection] = useState('');
  const [filter, setFilter] = useState('{}');
  const [projection, setProjection] = useState('{}');
  const [sort, setSort] = useState('{}');
  const [limit, setLimit] = useState(20);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  async function handleExecute() {
    if (!collection) { toast.error('Please select a collection'); return; }
    let parsedFilter: unknown, parsedProjection: unknown, parsedSort: unknown;
    try { parsedFilter = JSON.parse(filter || '{}'); } catch { toast.error('Invalid filter JSON'); return; }
    try { parsedProjection = JSON.parse(projection || '{}'); } catch { toast.error('Invalid projection JSON'); return; }
    try { parsedSort = JSON.parse(sort || '{}'); } catch { toast.error('Invalid sort JSON'); return; }

    setExecuting(true);
    setResult(null);
    setExpandedRows(new Set());
    try {
      const res = await apiClient.post('/database/query', {
        collection,
        filter: parsedFilter,
        projection: parsedProjection,
        sort: parsedSort,
        limit: Math.min(limit, 50),
      });
      setResult(res.data?.data ?? null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Query failed';
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  }

  function toggleRow(idx: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  const columns = result && result.results.length > 0
    ? Object.keys(result.results[0]).slice(0, 8)
    : [];

  function truncate(val: unknown): string {
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return s.length > 50 ? s.slice(0, 50) + '...' : s;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Query Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Collection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Collection</Label>
              <Select
                value={collection}
                onValueChange={setCollection}
                className="bg-muted/30 border-border"
              >
                <SelectItem value="">-- Select collection --</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </Select>
            </div>
            {/* Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs">Limit (max 50)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-muted/30 border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Filter (JSON)</Label>
              <textarea
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                rows={4}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Projection (JSON, optional)</Label>
              <textarea
                value={projection}
                onChange={(e) => setProjection(e.target.value)}
                rows={4}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sort (JSON, optional)</Label>
              <textarea
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                rows={4}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExecute} disabled={executing} className="gap-2 bg-primary hover:bg-primary/90">
              {executing ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Executing...</>
              ) : (
                <><Play className="h-4 w-4" />Execute Query</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result ? (
        <Card className="bg-muted/30 border-border overflow-hidden">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">
              Results: {result.count} document{result.count !== 1 ? 's' : ''}
            </CardTitle>
            <Badge variant="outline" className="border-border text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {result.executionTimeMs}ms
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {result.results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Database className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No documents found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-2 text-left w-10">#</th>
                      {columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                      ))}
                      <th className="px-3 py-2 text-left">Raw JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <React.Fragment key={i}>
                        <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          {columns.map((col) => (
                            <td key={col} className="px-3 py-2 font-mono max-w-[180px] truncate">
                              {truncate(row[col])}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => toggleRow(i)}
                            >
                              {expandedRows.has(i) ? 'Hide' : 'View'}
                            </Button>
                          </td>
                        </tr>
                        {expandedRows.has(i) && (
                          <tr className="border-b border-border">
                            <td colSpan={columns.length + 2} className="px-3 py-2">
                              <pre className="bg-muted border border-border rounded-lg p-3 text-[11px] font-mono text-emerald-700 dark:text-green-400 overflow-x-auto max-h-60">
                                {JSON.stringify(row, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !executing && (
        <Card className="bg-muted/30 border-border">
          <CardContent className="py-12 text-center">
            <Database className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">Execute a query to see results</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Tab 5: Export ────────────────────────────────────────────────────────────
function ExportTab({ collections }: { collections: CollectionInfo[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleExport(name: string) {
    setDownloading(name);
    try {
      const res = await apiClient.get(`/database/export/${name}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${name} successfully`);
    } catch (err: any) {
      toast.error(`Failed to export ${name}`, { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setDownloading(null);
    }
  }

  function formatSize(kb: number): string {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return kb.toFixed(1) + ' KB';
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Exports include up to <strong>1,000 documents</strong> per collection. For full exports, use mongodump directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((col) => (
          <Card key={col.name} className="bg-muted/30 border-border hover:border-border transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileJson className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{col.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {col.count.toLocaleString()} docs · {formatSize(col.sizeKB)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-border gap-1.5 flex-shrink-0"
                disabled={downloading === col.name}
                onClick={() => handleExport(col.name)}
              >
                {downloading === col.name ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export JSON
              </Button>
            </CardContent>
          </Card>
        ))}

        {collections.length === 0 && (
          <div className="col-span-2 py-12 text-center text-muted-foreground text-sm">
            <Database className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No collections available
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Index Manager Modal ──────────────────────────────────────────────────────
interface IndexManagerProps {
  collectionName: string;
  onClose: () => void;
}

function IndexManagerModal({ collectionName, onClose }: IndexManagerProps) {
  const [indexes, setIndexes] = useState<{ name: string; key: Record<string, unknown>; unique?: boolean; sparse?: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createKeys, setCreateKeys] = useState('{ "fieldName": 1 }');
  const [createOptions, setCreateOptions] = useState('{}');
  const [creating, setCreating] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const fetchIndexes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/database/collections/${collectionName}`);
      setIndexes(res.data?.data?.indexes ?? []);
    } catch { toast.error('Failed to load indexes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchIndexes(); }, []);

  const handleDrop = async (indexName: string) => {
    if (indexName === '_id_') { toast.error('Cannot drop _id index'); return; }
    setDropping(indexName);
    try {
      await apiClient.delete(`/database/collections/${collectionName}/indexes/${encodeURIComponent(indexName)}`);
      toast.success(`Index '${indexName}' dropped`);
      fetchIndexes();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Drop failed'); }
    finally { setDropping(null); }
  };

  const handleCreate = async () => {
    let keys: unknown, opts: unknown;
    try { keys = JSON.parse(createKeys); } catch { setJsonError('Invalid keys JSON'); return; }
    try { opts = JSON.parse(createOptions); } catch { setJsonError('Invalid options JSON'); return; }
    setCreating(true);
    try {
      const res = await apiClient.post(`/database/collections/${collectionName}/indexes`, { keys, options: opts });
      toast.success(res.data?.message || 'Index created');
      setShowCreate(false);
      setJsonError('');
      fetchIndexes();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Create failed'); }
    finally { setCreating(false); }
  };

  const themeClass = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark') ? 'dark' : '' : '';

  return createPortal(
    <div className={themeClass}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-mono">{collectionName}</h2>
                <p className="text-xs text-muted-foreground">Index Manager — {indexes.length} index{indexes.length !== 1 ? 'es' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setShowCreate(s => !s); setJsonError(''); }}>
                <Plus className="h-3.5 w-3.5" /> {showCreate ? 'Cancel' : 'New Index'}
              </Button>
              <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showCreate && (
            <div className="px-6 py-4 border-b border-border bg-muted/10 space-y-3 shrink-0">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Create New Index</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Keys (JSON)</label>
                  <textarea
                    value={createKeys}
                    onChange={e => { setCreateKeys(e.target.value); setJsonError(''); }}
                    rows={3}
                    spellCheck={false}
                    className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder='{ "email": 1 }'
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Options (JSON, optional)</label>
                  <textarea
                    value={createOptions}
                    onChange={e => { setCreateOptions(e.target.value); setJsonError(''); }}
                    rows={3}
                    spellCheck={false}
                    className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder='{ "unique": true }'
                  />
                </div>
              </div>
              {jsonError && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{jsonError}</p>}
              <Button size="sm" onClick={handleCreate} disabled={creating} className="gap-2">
                {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create Index
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : indexes.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Key className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No indexes found</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/60 backdrop-blur-sm border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Index Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Key</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Flags</th>
                    <th className="w-16 px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {indexes.map(idx => (
                    <tr key={idx.name} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-foreground">{idx.name}</td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">{JSON.stringify(idx.key)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {idx.unique && <span className="text-[10px] bg-violet-500/10 text-violet-600 border border-violet-500/20 px-1.5 py-0.5 rounded-md font-medium">unique</span>}
                          {idx.sparse && <span className="text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded-md font-medium">sparse</span>}
                          {idx.name === '_id_' && <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded-md font-medium">default</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {idx.name !== '_id_' && (
                          <button
                            onClick={() => handleDrop(idx.name)}
                            disabled={dropping === idx.name}
                            className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors mx-auto"
                            title={`Drop index ${idx.name}`}
                          >
                            {dropping === idx.name ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Schema Inspector Modal ───────────────────────────────────────────────────
interface SchemaInspectorProps {
  collectionName: string;
  onClose: () => void;
}

function SchemaInspectorModal({ collectionName, onClose }: SchemaInspectorProps) {
  const [fields, setFields] = useState<{ name: string; types: Record<string, number>; presence: number; nullCount: number; dominantType: string }[]>([]);
  const [sampleSize, setSampleSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/database/collections/${collectionName}/schema`);
        setFields(res.data?.data?.fields ?? []);
        setSampleSize(res.data?.data?.sampleSize ?? 0);
      } catch { toast.error('Failed to infer schema'); }
      finally { setLoading(false); }
    })();
  }, []);

  const typeColor = (t: string) => {
    if (t === 'string')   return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (t === 'number')   return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (t === 'boolean')  return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    if (t === 'ObjectId') return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    if (t === 'date')     return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    if (t === 'array')    return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    if (t === 'object')   return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  const themeClass = typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark') ? 'dark' : '' : '';

  return createPortal(
    <div className={themeClass}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Table2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-mono">{collectionName}</h2>
                <p className="text-xs text-muted-foreground">Schema Inspector — sampled {sampleSize} documents</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : fields.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Table2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No schema data (empty collection)</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/60 backdrop-blur-sm border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Field</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Presence</th>
                    <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Nulls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {fields.map(f => (
                    <tr key={f.name} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-foreground">{f.name}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(f.types).map(([t, cnt]) => (
                            <span key={t} className={`text-[10px] border px-1.5 py-0.5 rounded-md font-medium ${typeColor(t)}`}>
                              {t} ({cnt})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${f.presence}%` }} />
                          </div>
                          <span className="text-muted-foreground">{f.presence}%</span>
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-right font-mono ${f.nullCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {f.nullCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Tab 6: Aggregate Pipeline ────────────────────────────────────────────────
function AggregateTab({ collections }: { collections: CollectionInfo[] }) {
  const [collection, setCollection] = useState('');
  const [pipeline, setPipeline] = useState('[\n  { "$match": {} },\n  { "$limit": 20 }\n]');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ collection: string; count: number; executionTimeMs: number; results: Record<string, unknown>[] } | null>(null);
  const [jsonError, setJsonError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const TEMPLATES = [
    { label: 'Count by field', code: '[\n  { "$group": { "_id": "$fieldName", "count": { "$sum": 1 } } },\n  { "$sort": { "count": -1 } }\n]' },
    { label: 'Date histogram', code: '[\n  { "$group": {\n    "_id": { "year": { "$year": "$createdAt" }, "month": { "$month": "$createdAt" } },\n    "count": { "$sum": 1 }\n  }},\n  { "$sort": { "_id.year": 1, "_id.month": 1 } }\n]' },
    { label: 'Top 10 by field', code: '[\n  { "$sort": { "fieldName": -1 } },\n  { "$limit": 10 }\n]' },
    { label: 'Avg / Sum', code: '[\n  { "$group": {\n    "_id": null,\n    "total": { "$sum": "$amount" },\n    "average": { "$avg": "$amount" }\n  }}\n]' },
    { label: 'Lookup join', code: '[\n  { "$lookup": {\n    "from": "otherCollection",\n    "localField": "userId",\n    "foreignField": "_id",\n    "as": "joined"\n  }},\n  { "$limit": 20 }\n]' },
  ];

  async function handleExecute() {
    if (!collection) { toast.error('Please select a collection'); return; }
    let parsed: unknown[];
    try { parsed = JSON.parse(pipeline); } catch { setJsonError('Invalid JSON array'); return; }
    if (!Array.isArray(parsed)) { setJsonError('Pipeline must be a JSON array [ ... ]'); return; }
    setJsonError('');
    setExecuting(true);
    setResult(null);
    setExpandedRows(new Set());
    try {
      const res = await apiClient.post('/database/aggregate', { collection, pipeline: parsed });
      setResult(res.data?.data ?? null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Aggregation failed');
    } finally { setExecuting(false); }
  }

  const columns = result && result.results.length > 0 ? Object.keys(result.results[0]).slice(0, 8) : [];
  function trunc(v: unknown) {
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.length > 50 ? s.slice(0, 50) + '…' : s;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Aggregation Pipeline
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Templates:</span>
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => { setPipeline(t.code); setJsonError(''); }}
                  className="text-xs px-2 py-1 rounded-lg bg-muted border border-border hover:bg-accent hover:border-primary/30 transition-colors font-medium"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Collection</Label>
              <Select value={collection} onValueChange={setCollection} className="bg-muted/30 border-border">
                <SelectItem value="">-- Select collection --</SelectItem>
                {collections.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <div className="flex-1 bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-xs text-muted-foreground space-y-0.5">
                <p><span className="text-primary font-mono">$match</span> — filter documents</p>
                <p><span className="text-primary font-mono">$group</span> — group & aggregate</p>
                <p><span className="text-primary font-mono">$sort $limit $project $lookup</span> — transform</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Pipeline (JSON array of stage objects)</Label>
            <textarea
              value={pipeline}
              onChange={e => { setPipeline(e.target.value); setJsonError(''); }}
              rows={10}
              spellCheck={false}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed"
            />
            {jsonError && <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{jsonError}</p>}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExecute} disabled={executing} className="gap-2">
              {executing ? <><RefreshCw className="h-4 w-4 animate-spin" />Running…</> : <><Play className="h-4 w-4" />Run Pipeline</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card className="bg-muted/30 border-border overflow-hidden">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">
              Results — {result.count} document{result.count !== 1 ? 's' : ''}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-border text-xs">
                <Clock className="h-3 w-3 mr-1" />{result.executionTimeMs}ms
              </Badge>
              <Badge variant="outline" className="border-border text-xs font-mono">{result.collection}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {result.results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Database className="h-8 w-8 mx-auto mb-3 opacity-30" />No results
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="px-3 py-2 text-left w-8">#</th>
                      {columns.map(c => <th key={c} className="px-3 py-2 text-left font-medium font-mono">{c}</th>)}
                      <th className="px-3 py-2 text-left w-14">JSON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <React.Fragment key={i}>
                        <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          {columns.map(c => (
                            <td key={c} className="px-3 py-2 font-mono max-w-[160px] truncate">{trunc(row[c])}</td>
                          ))}
                          <td className="px-3 py-2">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                              onClick={() => setExpandedRows(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })}>
                              {expandedRows.has(i) ? 'Hide' : 'View'}
                            </Button>
                          </td>
                        </tr>
                        {expandedRows.has(i) && (
                          <tr className="border-b border-border">
                            <td colSpan={columns.length + 2} className="px-3 py-2">
                              <pre className="bg-muted border border-border rounded-lg p-3 text-[11px] font-mono text-emerald-700 dark:text-green-400 overflow-x-auto max-h-60">
                                {JSON.stringify(row, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !executing && (
        <Card className="bg-muted/30 border-border">
          <CardContent className="py-12 text-center">
            <GitBranch className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">Run a pipeline to see aggregated results</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Tab 7: Import ────────────────────────────────────────────────────────────
function ImportTab({ collections, onRefresh }: { collections: CollectionInfo[]; onRefresh: () => void }) {
  const [collection, setCollection] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [upsert, setUpsert] = useState(false);
  const [importing, setImporting] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [result, setResult] = useState<{ insertedCount: number; skippedCount: number; errors: string[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setJsonText(text);
      setJsonError('');
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!collection) { toast.error('Please select a collection'); return; }
    if (!jsonText.trim()) { toast.error('Please provide JSON data'); return; }
    let parsed: unknown;
    try { parsed = JSON.parse(jsonText); } catch { setJsonError('Invalid JSON — paste a JSON array [ {...}, {...} ]'); return; }
    if (!Array.isArray(parsed)) { setJsonError('JSON must be an array of objects'); return; }
    if (parsed.length === 0) { setJsonError('Array is empty'); return; }
    setJsonError('');
    setImporting(true);
    setResult(null);
    try {
      const res = await apiClient.post(`/database/import/${collection}`, { documents: parsed, upsert });
      setResult(res.data?.data ?? null);
      toast.success(res.data?.message || 'Import complete');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Import up to <strong>1,000 documents</strong> at a time. By default, new IDs are assigned and existing ones are ignored. Enable <strong>Upsert</strong> to update existing docs by their _id.
        </p>
      </div>

      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileUp className="h-4 w-4 text-primary" />
            Import JSON Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Target Collection</Label>
              <Select value={collection} onValueChange={setCollection} className="bg-muted/30 border-border">
                <SelectItem value="">-- Select collection --</SelectItem>
                {collections.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Label className="text-xs block mb-1.5">Upload JSON File</Label>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Choose File
                </Button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
                <div
                  onClick={() => setUpsert(u => !u)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${upsert ? 'bg-primary' : 'bg-muted border border-border'}`}
                >
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${upsert ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-muted-foreground">Upsert mode</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">JSON Data (array of objects)</Label>
            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setJsonError(''); setResult(null); }}
              rows={14}
              spellCheck={false}
              placeholder={'[\n  { "name": "Alice", "email": "alice@example.com" },\n  { "name": "Bob",   "email": "bob@example.com"   }\n]'}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed placeholder:text-muted-foreground/40"
            />
            {jsonError && <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />{jsonError}</p>}
          </div>

          {jsonText.trim() && !jsonError && (() => {
            try {
              const parsed = JSON.parse(jsonText);
              if (Array.isArray(parsed)) {
                return <p className="text-xs text-muted-foreground">{parsed.length} document{parsed.length !== 1 ? 's' : ''} ready to import</p>;
              }
            } catch { return null; }
            return null;
          })()}

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={importing || !collection || !jsonText.trim()} className="gap-2">
              {importing ? <><RefreshCw className="h-4 w-4 animate-spin" />Importing…</> : <><FileUp className="h-4 w-4" />Import</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={`border-border ${result.insertedCount > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              {result.insertedCount > 0
                ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              }
              <div>
                <p className="font-semibold text-sm">
                  {result.insertedCount > 0 ? 'Import complete' : 'Import failed'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.insertedCount} inserted · {result.skippedCount} skipped
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-red-500 mb-1">Errors (first 10)</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{e}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DatabaseManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DbStats | null>(null);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/database/stats');
      setStats(res.data?.data ?? null);
    } catch (err: any) {
      toast.error('Failed to load database stats', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await apiClient.get('/database/collections');
      setCollections(res.data?.data ?? []);
    } catch (err: any) {
      toast.error('Failed to load collections', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCollections();
  }, [fetchStats, fetchCollections]);

  async function handleRefresh() {
    setRefreshing(true);
    setStatsLoading(true);
    setCollectionsLoading(true);
    await Promise.allSettled([fetchStats(), fetchCollections()]);
    setRefreshing(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Database Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor health, execute queries, and manage your MongoDB database
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-border"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/40 border border-border h-auto p-1 gap-0.5 flex-wrap">
          {[
            { value: 'overview',    Icon: Database,  label: 'Overview'    },
            { value: 'collections', Icon: Layers,    label: 'Collections' },
            { value: 'insights',    Icon: Activity,  label: 'Insights'    },
            { value: 'query',       Icon: Play,      label: 'Query'       },
            { value: 'aggregate',   Icon: GitBranch, label: 'Aggregate'   },
            { value: 'import',      Icon: FileUp,    label: 'Import'      },
            { value: 'export',      Icon: Download,  label: 'Export'      },
          ].map(({ value, Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={statsLoading ? null : stats} />
        </TabsContent>

        <TabsContent value="collections">
          <CollectionsTab collections={collections} loading={collectionsLoading} onRefresh={fetchCollections} />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsTab />
        </TabsContent>

        <TabsContent value="query">
          <QueryTab collections={collections} />
        </TabsContent>

        <TabsContent value="aggregate">
          <AggregateTab collections={collections} />
        </TabsContent>

        <TabsContent value="import">
          <ImportTab collections={collections} onRefresh={fetchCollections} />
        </TabsContent>

        <TabsContent value="export">
          <ExportTab collections={collections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
