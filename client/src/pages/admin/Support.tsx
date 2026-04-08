/**
 * Admin Support — Client Ticket Management
 *
 * Full control: view all tickets, filter by status/priority/category,
 * reply, update status, set priority, leave admin notes, delete.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle, Search, RefreshCw, Loader2, Trash2, MessageSquare,
  CheckCircle2, Clock, X, ChevronDown, Send, AlertCircle, Tag,
  BarChart2, Filter, FileQuestion, ChevronUp, User, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { supportTicketsApi } from '../../api/supportTickets.api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Response {
  _id:           string;
  message:       string;
  isAdmin:       boolean;
  respondedBy?:  { name: string; role: string };
  createdAt:     string;
}

interface Ticket {
  _id:           string;
  ticketId:      string;
  subject:       string;
  category:      string;
  status:        'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority:      'Low' | 'Medium' | 'High' | 'Urgent';
  message:       string;
  adminNotes?:   string;
  responses:     Response[];
  submittedBy:   { _id: string; name: string; email: string; photo?: string };
  createdAt:     string;
  resolvedAt?:   string;
}

interface Stats {
  total:      number;
  open:       number;
  inProgress: number;
  resolved:   number;
  closed:     number;
  urgent:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusIcon = (s: Ticket['status']) => {
  if (s === 'Open')        return <Clock        className="h-3.5 w-3.5 text-yellow-500" />;
  if (s === 'In Progress') return <Loader2      className="h-3.5 w-3.5 text-blue-500" />;
  if (s === 'Resolved')    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  return <X className="h-3.5 w-3.5 text-muted-foreground" />;
};

const statusVariant = (s: Ticket['status']) => {
  if (s === 'Open')        return 'warning'    as const;
  if (s === 'In Progress') return 'secondary'  as const;
  if (s === 'Resolved')    return 'outline'    as const;
  return 'secondary' as const;
};

const priorityColor = (p: string) =>
  p === 'Urgent' ? 'text-red-600' :
  p === 'High'   ? 'text-red-500' :
  p === 'Medium' ? 'text-yellow-500' : 'text-green-500';

const priorityBg = (p: string) =>
  p === 'Urgent' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
  p === 'High'   ? 'bg-red-400/10 text-red-500 border-red-400/20' :
  p === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                   'bg-green-500/10 text-green-600 border-green-500/20';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUSES  = ['all', 'Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['all', 'Urgent', 'High', 'Medium', 'Low'];
const CATEGORIES = ['all', 'General', 'Project Status', 'Billing', 'Technical', 'Account', 'Other'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSupport() {
  const [tickets,       setTickets]      = useState<Ticket[]>([]);
  const [stats,         setStats]        = useState<Stats | null>(null);
  const [loading,       setLoading]      = useState(true);

  // Filters
  const [search,        setSearch]       = useState('');
  const [statusFilter,  setStatusFilter] = useState('all');
  const [priorityFilter,setPriorityFilter] = useState('all');
  const [categoryFilter,setCategoryFilter] = useState('all');

  // Thread dialog
  const [activeTicket,  setActiveTicket] = useState<Ticket | null>(null);
  const [threadOpen,    setThreadOpen]   = useState(false);
  const [reply,         setReply]        = useState('');
  const [replying,      setReplying]     = useState(false);
  const [adminNotes,    setAdminNotes]   = useState('');
  const [savingNotes,   setSavingNotes]  = useState(false);
  const [notesOpen,     setNotesOpen]    = useState(false);

  // Delete
  const [deleteId,      setDeleteId]     = useState<string | null>(null);
  const [deleting,      setDeleting]     = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter   !== 'all') params.status   = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const [ticketsRes, statsRes] = await Promise.all([
        supportTicketsApi.getAll(params),
        supportTicketsApi.getStats(),
      ]);
      setTickets(ticketsRes.data?.data?.tickets ?? []);
      setStats(statsRes.data?.data ?? null);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Open Thread ──────────────────────────────────────────────────────────

  const openThread = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setAdminNotes(ticket.adminNotes ?? '');
    setReply('');
    setNotesOpen(false);
    setThreadOpen(true);
  };

  // ── Update Status ────────────────────────────────────────────────────────

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await supportTicketsApi.update(id, { status });
      const updated: Ticket = res.data.data;
      setTickets(prev => prev.map(t => t._id === id ? updated : t));
      if (activeTicket?._id === id) setActiveTicket(updated);
      toast.success(`Status → ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Update Priority ──────────────────────────────────────────────────────

  const updatePriority = async (id: string, priority: string) => {
    try {
      const res = await supportTicketsApi.update(id, { priority });
      const updated: Ticket = res.data.data;
      setTickets(prev => prev.map(t => t._id === id ? updated : t));
      if (activeTicket?._id === id) setActiveTicket(updated);
      toast.success(`Priority → ${priority}`);
    } catch {
      toast.error('Failed to update priority');
    }
  };

  // ── Save Admin Notes ─────────────────────────────────────────────────────

  const saveNotes = async () => {
    if (!activeTicket) return;
    setSavingNotes(true);
    try {
      const res = await supportTicketsApi.update(activeTicket._id, { adminNotes });
      const updated: Ticket = res.data.data;
      setActiveTicket(updated);
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setNotesOpen(false);
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // ── Admin Reply ──────────────────────────────────────────────────────────

  const handleReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    setReplying(true);
    try {
      const res = await supportTicketsApi.respond(activeTicket._id, reply);
      const updated: Ticket = res.data.data;
      setActiveTicket(updated);
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setReply('');
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supportTicketsApi.delete(deleteId);
      setTickets(prev => prev.filter(t => t._id !== deleteId));
      setDeleteId(null);
      if (activeTicket?._id === deleteId) setThreadOpen(false);
      toast.success('Ticket deleted');
      fetchAll(); // refresh stats
    } catch {
      toast.error('Failed to delete ticket');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered List ────────────────────────────────────────────────────────

  const filtered = tickets.filter(t =>
    !search || [t.ticketId, t.subject, t.submittedBy?.name, t.submittedBy?.email]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Tickets</h2>
          <p className="text-muted-foreground">Manage and respond to client support requests.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total',       value: stats.total,      color: 'text-foreground'   },
            { label: 'Open',        value: stats.open,       color: 'text-yellow-500'   },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-500'     },
            { label: 'Resolved',    value: stats.resolved,   color: 'text-green-500'    },
            { label: 'Closed',      value: stats.closed,     color: 'text-muted-foreground' },
            { label: 'Urgent',      value: stats.urgent,     color: 'text-red-500'      },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, subject, or client…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
              </select>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p}</option>)}
              </select>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card className="border-border/50">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Tickets
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading tickets…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileQuestion className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No tickets found</p>
              <p className="text-xs mt-1">
                {search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No client support tickets yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map(ticket => (
                <div key={ticket._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                  {/* Info */}
                  <button className="flex-1 min-w-0 text-left" onClick={() => openThread(ticket)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticketId}</span>
                      <span className={`text-xs border rounded-full px-2 py-0 font-medium ${priorityBg(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0 rounded-full">{ticket.category}</span>
                    </div>
                    <p className="font-medium text-sm truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.submittedBy?.name ?? 'Unknown'} · {ticket.submittedBy?.email} · {timeAgo(ticket.createdAt)}
                      {ticket.responses.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" /> {ticket.responses.length}
                        </span>
                      )}
                    </p>
                  </button>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant(ticket.status)} className="gap-1.5 text-xs shrink-0">
                      {statusIcon(ticket.status)} {ticket.status}
                    </Badge>

                    {/* Quick status change */}
                    <select
                      value={ticket.status}
                      onChange={e => updateStatus(ticket._id, e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteId(ticket._id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Thread Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={threadOpen} onOpenChange={open => !open && setThreadOpen(false)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
          {activeTicket && (
            <>
              {/* Header */}
              <div className="p-5 border-b border-border/50 shrink-0">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-snug">{activeTicket.subject}</h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className="text-xs font-mono text-muted-foreground">{activeTicket.ticketId}</span>
                      <Badge variant={statusVariant(activeTicket.status)} className="gap-1 text-xs">
                        {statusIcon(activeTicket.status)} {activeTicket.status}
                      </Badge>
                      <span className={`text-xs border rounded-full px-2 py-0 font-medium ${priorityBg(activeTicket.priority)}`}>
                        {activeTicket.priority}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{activeTicket.category}</span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mt-3 flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {activeTicket.submittedBy?.name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{activeTicket.submittedBy?.name}</p>
                    <p className="text-xs text-muted-foreground">{activeTicket.submittedBy?.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <select
                      value={activeTicket.status}
                      onChange={e => updateStatus(activeTicket._id, e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Closed</option>
                    </select>
                    <select
                      value={activeTicket.priority}
                      onChange={e => updatePriority(activeTicket._id, e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Thread Body */}
              <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {activeTicket.submittedBy?.name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 bg-muted/40 rounded-2xl rounded-tl-sm p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {activeTicket.submittedBy?.name} · {timeAgo(activeTicket.createdAt)}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeTicket.message}</p>
                  </div>
                </div>

                {/* Responses */}
                {activeTicket.responses.map(r => (
                  <div key={r._id} className={`flex gap-3 ${r.isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      r.isAdmin ? 'bg-violet-500/10 text-violet-600' : 'bg-muted text-foreground'
                    }`}>
                      {r.isAdmin ? 'A' : (activeTicket.submittedBy?.name?.charAt(0) ?? 'U')}
                    </div>
                    <div className={`flex-1 rounded-2xl p-3 ${
                      r.isAdmin ? 'bg-violet-500/10 rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm'
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {r.isAdmin ? (r.respondedBy?.name ?? 'Admin') : activeTicket.submittedBy?.name} · {timeAgo(r.createdAt)}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.message}</p>
                    </div>
                  </div>
                ))}

                {/* Admin Notes accordion */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 overflow-hidden">
                  <button
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium"
                    onClick={() => setNotesOpen(o => !o)}
                  >
                    <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" /> Internal Admin Notes
                      {activeTicket.adminNotes && <span className="text-xs text-amber-500">(saved)</span>}
                    </span>
                    {notesOpen ? <ChevronUp className="h-4 w-4 text-amber-500" /> : <ChevronDown className="h-4 w-4 text-amber-500" />}
                  </button>
                  {notesOpen && (
                    <div className="px-4 pb-4 space-y-2 border-t border-amber-500/20">
                      <Textarea
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        placeholder="Internal notes visible only to admins…"
                        rows={3}
                        className="text-sm mt-2 bg-background"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className="gap-2"
                      >
                        {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Save Notes
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-border/50 shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Write a reply to the client…"
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                    }}
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button onClick={handleReply} disabled={replying || !reply.trim()} className="gap-1.5">
                      {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => { setDeleteId(activeTicket._id); setThreadOpen(false); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <ConfirmDeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Ticket"
        description="This will permanently delete the ticket and all its replies. This action cannot be undone."
      />
    </div>
  );
}
