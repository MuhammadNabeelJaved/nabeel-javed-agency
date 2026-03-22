/**
 * Admin — Client Project Requests
 * View, filter, and manage all client-submitted project requests.
 * Admin can update status, progress, totalCost, paidAmount.
 */
import React, { useState, useEffect } from 'react';
import {
  Search, Loader2, X, ChevronDown, Eye, CheckCircle2,
  Clock, RefreshCw, AlertCircle, DollarSign, FolderKanban,
  User, Calendar, FileText, Save,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Attachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface ProjectRequest {
  _id: string;
  projectName: string;
  projectType: string;
  budgetRange: string;
  projectDetails: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  progress: number;
  totalCost?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  deadline?: string;
  attachments: Attachment[];
  requestedBy: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  in_review: 'In Review',
  approved:  'Approved',
  rejected:  'Rejected',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  approved:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  pending:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  rejected:  'bg-red-500/10 text-red-500 border-red-500/20',
};

const PAYMENT_COLORS: Record<string, string> = {
  paid:    'bg-green-500/10 text-green-500',
  partial: 'bg-amber-500/10 text-amber-500',
  unpaid:  'bg-muted text-muted-foreground',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ClientProjectRequests() {
  const [requests, setRequests]       = useState<ProjectRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selected, setSelected]       = useState<ProjectRequest | null>(null);
  const [saving, setSaving]           = useState(false);

  // Edit fields
  const [editStatus, setEditStatus]   = useState('');
  const [editProgress, setEditProgress] = useState('');
  const [editTotalCost, setEditTotalCost] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchRequests = async () => {
    setError(null);
    try {
      const res = await apiClient.get('/projects', { params: { limit: 100 } });
      const list: ProjectRequest[] = res.data.data?.projects ?? res.data.data ?? [];
      setRequests(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // ── Open edit dialog ─────────────────────────────────────────────────────

  const openDetail = (req: ProjectRequest) => {
    setSelected(req);
    setEditStatus(req.status);
    setEditProgress(String(req.progress));
    setEditTotalCost(req.totalCost ? String(req.totalCost) : '');
    setEditPaidAmount(req.paidAmount ? String(req.paidAmount) : '');
  };

  // ── Save changes ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        status: editStatus,
        progress: parseInt(editProgress) || 0,
      };
      if (editTotalCost !== '') body.totalCost = parseFloat(editTotalCost);
      if (editPaidAmount !== '') body.paidAmount = parseFloat(editPaidAmount);

      const res = await apiClient.patch(`/projects/${selected._id}`, body);
      const updated: ProjectRequest = res.data.data;
      setRequests(prev => prev.map(r => r._id === updated._id ? updated : r));
      toast.success('Project updated successfully');
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────

  const total     = requests.length;
  const pending   = requests.filter(r => r.status === 'pending').length;
  const active    = requests.filter(r => r.status === 'approved' || r.status === 'in_review').length;
  const completed = requests.filter(r => r.status === 'completed').length;

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = requests.filter(r =>
    (filterStatus === 'All' || r.status === filterStatus) &&
    (r.projectName.toLowerCase().includes(search.toLowerCase()) ||
     r.requestedBy?.name.toLowerCase().includes(search.toLowerCase()) ||
     r.requestedBy?.email.toLowerCase().includes(search.toLowerCase()))
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Project Requests</h1>
          <p className="text-muted-foreground">Review and manage project requests submitted by clients.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: total,     icon: FolderKanban, color: 'text-primary',   bg: 'bg-primary/10' },
          { label: 'Pending', value: pending,  icon: Clock,        color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active',  value: active,   icon: CheckCircle2, color: 'text-blue-500',  bg: 'bg-blue-500/10' },
          { label: 'Done',    value: completed,icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? '—' : stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card p-4 rounded-xl border border-border/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'pending', 'in_review', 'approved', 'rejected', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {s === 'All' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRequests}>Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground gap-2">
          <FileText className="h-10 w-10 opacity-30" />
          <p>{search || filterStatus !== 'All' ? 'No requests match your filter' : 'No project requests yet'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(req => (
                <TableRow key={req._id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(req)}>
                  <TableCell className="font-medium max-w-[180px] truncate">{req.projectName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{req.requestedBy?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{req.requestedBy?.email ?? ''}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{req.projectType}</TableCell>
                  <TableCell className="text-sm">{req.budgetRange}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_COLORS[req.paymentStatus]}`}>
                      {req.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${req.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{req.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); openDetail(req); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail / Edit Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && !saving && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.projectName}</DialogTitle>
            <DialogDescription>
              Submitted by {selected?.requestedBy?.name ?? 'Unknown'} · {selected?.requestedBy?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
            {/* Details */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Details</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected?.projectDetails}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium">{selected?.projectType}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Budget Range</p>
                <p className="font-medium">{selected?.budgetRange}</p>
              </div>
            </div>

            {/* Attachments */}
            {selected?.attachments?.length ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attachments</p>
                <div className="space-y-2">
                  {selected.attachments.map(att => (
                    <a
                      key={att._id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{att.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Admin Edit Section */}
            <div className="border-t border-border/50 pt-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Controls</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={e => setEditProgress(e.target.value)}
                    placeholder="0–100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editTotalCost}
                    onChange={e => setEditTotalCost(e.target.value)}
                    placeholder="e.g. 2500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Paid Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editPaidAmount}
                    onChange={e => setEditPaidAmount(e.target.value)}
                    placeholder="e.g. 1250"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Changes</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
