/**
 * User Support Page — fully wired to the /api/v1/support-tickets API.
 * Features: ticket list with real-time status, create new ticket dialog,
 * view ticket thread & reply, FAQ accordion.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle, MessageCircle, Mail, Plus, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Clock, FileQuestion, Send, X, RefreshCw,
  AlertCircle, Tag, MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { supportTicketsApi } from '../../api/supportTickets.api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  createdAt:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusIcon = (status: Ticket['status']) => {
  if (status === 'Open')       return <Clock        className="h-3.5 w-3.5 text-yellow-500" />;
  if (status === 'In Progress') return <Loader2     className="h-3.5 w-3.5 text-blue-500" />;
  if (status === 'Resolved')   return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  return <X className="h-3.5 w-3.5 text-muted-foreground" />;
};

const statusVariant = (status: Ticket['status']) => {
  if (status === 'Open')        return 'warning'   as const;
  if (status === 'In Progress') return 'secondary' as const;
  if (status === 'Resolved')    return 'outline'   as const;
  return 'outline' as const;
};

const priorityColor = (p: string) =>
  p === 'Urgent' ? 'text-red-600' :
  p === 'High'   ? 'text-red-500' :
  p === 'Medium' ? 'text-yellow-500' : 'text-green-500';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'How do I check the status of my project?',
    a: 'Go to "My Projects" in the sidebar. Each project card shows the current status (Pending → In Review → Approved → In Progress → Completed). You will also receive email notifications on every status change.',
  },
  {
    q: 'Can I upload additional files after submitting a project request?',
    a: 'Currently, you can delete and re-submit a request if it is still in Pending or Rejected status. For active projects, please open a support ticket or contact us via Live Chat so the team can attach the files for you.',
  },
  {
    q: 'How is my invoice calculated?',
    a: "Your invoice is based on the agreed Total Cost for the project. You can see the total cost, amount paid, and amount due in the Billing & Payments section.",
  },
  {
    q: 'How long does it usually take to get a response?',
    a: 'We aim to respond to all tickets within 24 business hours. For urgent issues, use Live Chat for a faster response.',
  },
  {
    q: 'How do I update my profile or change my password?',
    a: 'Go to "Profile & Settings" in the sidebar. You can update your name, avatar, and password from there.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserSupport() {
  const navigate = useNavigate();

  const [tickets,        setTickets]        = useState<Ticket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [openFaq,        setOpenFaq]        = useState<number | null>(null);

  // New ticket dialog
  const [newTicketOpen,  setNewTicketOpen]  = useState(false);
  const [form,           setForm]           = useState({ subject: '', category: 'General', priority: 'Medium', message: '' });
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  // Thread dialog
  const [activeTicket,   setActiveTicket]   = useState<Ticket | null>(null);
  const [threadOpen,     setThreadOpen]     = useState(false);
  const [reply,          setReply]          = useState('');
  const [replying,       setReplying]       = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportTicketsApi.getMyTickets();
      setTickets(res.data?.data ?? []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Create Ticket ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const res = await supportTicketsApi.create(form);
      setTickets(prev => [res.data.data, ...prev]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNewTicketOpen(false);
        setForm({ subject: '', category: 'General', priority: 'Medium', message: '' });
      }, 2000);
    } catch {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Thread ──────────────────────────────────────────────────────────

  const openThread = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setReply('');
    setThreadOpen(true);
  };

  // ── Reply to Ticket ──────────────────────────────────────────────────────

  const handleReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    setReplying(true);
    try {
      const res = await supportTicketsApi.addReply(activeTicket._id, reply);
      const updated: Ticket = res.data.data;
      setActiveTicket(updated);
      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setReply('');
      toast.success('Reply sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Support Center</h2>
          <p className="text-muted-foreground mt-1">
            Need help? We're here for you — browse FAQs or open a ticket.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setNewTicketOpen(true)}>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Live Chat</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get instant answers from our team</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/user-dashboard/messages')}>Start Chat</Button>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Email Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">Response within 24 business hours</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = 'mailto:support@nabeeljaved.com'}>
              Send Email
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Tickets */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              My Tickets
              {tickets.length > 0 && (
                <span className="ml-1 text-xs font-medium bg-muted px-2 py-0.5 rounded-full">{tickets.length}</span>
              )}
            </CardTitle>
            <CardDescription>Track the status of your support requests.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading tickets…</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileQuestion className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No tickets yet</p>
                <p className="text-xs mt-1">Open a ticket when you need help</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {tickets.map(ticket => (
                  <button
                    key={ticket._id}
                    onClick={() => openThread(ticket)}
                    className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.ticketId} · {ticket.category} · {timeAgo(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {ticket.responses.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {ticket.responses.length}
                        </span>
                      )}
                      <span className={`text-xs font-semibold ${priorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <Badge variant={statusVariant(ticket.status)} className="gap-1.5 text-xs">
                        {statusIcon(ticket.status)}
                        {ticket.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              Frequently Asked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/60 overflow-hidden transition-all">
                <button
                  className="flex items-center justify-between w-full text-left font-medium text-sm p-4 hover:bg-muted/20 transition-colors gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="leading-snug">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3 bg-muted/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── New Ticket Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={newTicketOpen} onOpenChange={open => !open && setNewTicketOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open a Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and our team will get back to you within 24 hours.</DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <p className="font-semibold">Ticket Submitted!</p>
              <p className="text-sm text-muted-foreground">We'll respond within 24 business hours.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Input
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>General</option>
                    <option>Project Status</option>
                    <option>Billing</option>
                    <option>Technical</option>
                    <option>Account</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message <span className="text-destructive">*</span></Label>
                <Textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue in detail…"
                  rows={4}
                />
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewTicketOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.subject.trim() || !form.message.trim()}
                className="gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Ticket
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Thread Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={threadOpen} onOpenChange={open => !open && setThreadOpen(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          {activeTicket && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div>
                    <DialogTitle className="text-lg leading-snug">{activeTicket.subject}</DialogTitle>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{activeTicket.ticketId}</span>
                      <Badge variant={statusVariant(activeTicket.status)} className="gap-1 text-xs">
                        {statusIcon(activeTicket.status)} {activeTicket.status}
                      </Badge>
                      <span className={`text-xs font-semibold ${priorityColor(activeTicket.priority)}`}>
                        {activeTicket.priority}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{activeTicket.category}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 min-h-0">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">You</div>
                  <div className="flex-1 bg-primary/5 rounded-2xl rounded-tl-sm p-3">
                    <p className="text-xs text-muted-foreground mb-1">{timeAgo(activeTicket.createdAt)}</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeTicket.message}</p>
                  </div>
                </div>

                {/* Admin notes */}
                {activeTicket.adminNotes && (
                  <div className="flex gap-2 items-center bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Admin Note</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">{activeTicket.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Responses */}
                {activeTicket.responses.map(r => (
                  <div key={r._id} className={`flex gap-3 ${r.isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      r.isAdmin ? 'bg-violet-500/10 text-violet-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {r.isAdmin ? 'A' : 'You'}
                    </div>
                    <div className={`flex-1 rounded-2xl p-3 ${
                      r.isAdmin
                        ? 'bg-violet-500/10 rounded-tr-sm'
                        : 'bg-muted/50 rounded-tl-sm'
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {r.isAdmin ? (r.respondedBy?.name ?? 'Admin') : 'You'} · {timeAgo(r.createdAt)}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.message}</p>
                    </div>
                  </div>
                ))}

                {activeTicket.status === 'Closed' && (
                  <p className="text-center text-xs text-muted-foreground py-2">This ticket is closed.</p>
                )}
              </div>

              {/* Reply Box */}
              {activeTicket.status !== 'Closed' && (
                <div className="shrink-0 flex gap-2 pt-2 border-t border-border/50">
                  <Textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                    }}
                  />
                  <Button onClick={handleReply} disabled={replying || !reply.trim()} className="self-end gap-1.5">
                    {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
