import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, AlertTriangle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { toast } from 'sonner';

const initialTickets = [
  { id: 'TK-001', title: 'Payment gateway error on checkout', client: 'FinBank', priority: 'high', status: 'open', created: '2024-03-17', description: 'Users are getting 500 errors when trying to complete payment. Affects all card types. Urgent fix needed.' },
  { id: 'TK-002', title: 'Mobile app crash on iOS 17', client: 'TechCorp', priority: 'high', status: 'open', created: '2024-03-17', description: 'The app crashes immediately on launch for iOS 17 users. Android users are unaffected.' },
  { id: 'TK-003', title: 'Dashboard loading slowly', client: 'DataSci Inc', priority: 'medium', status: 'open', created: '2024-03-16', description: 'The analytics dashboard takes 8-12 seconds to load. Expected load time is under 2 seconds.' },
  { id: 'TK-004', title: 'Export to PDF not working', client: 'Creative Studio', priority: 'medium', status: 'in-progress', created: '2024-03-15', description: 'PDF export feature returns a blank file. The button works but the output is empty.' },
  { id: 'TK-005', title: 'Search results not filtering correctly', client: 'SalesForce Pro', priority: 'low', status: 'in-progress', created: '2024-03-14', description: 'When filtering by date range, results outside the range are still showing.' },
  { id: 'TK-006', title: 'Email notifications delayed', client: 'People First Co', priority: 'low', status: 'in-progress', created: '2024-03-13', description: 'Users report receiving email notifications 2-4 hours after the triggering event.' },
  { id: 'TK-007', title: 'Profile picture upload not saving', client: 'TechCorp', priority: 'low', status: 'resolved', created: '2024-03-12', description: 'Fixed by updating the S3 bucket CORS policy and adding proper error handling.' },
  { id: 'TK-008', title: 'Incorrect invoice totals', client: 'FinBank', priority: 'high', status: 'resolved', created: '2024-03-10', description: 'Tax calculation bug fixed. Was applying double tax in certain scenarios.' },
];

const columns = [
  { id: 'open', label: 'Open', color: 'border-rose-500/40' },
  { id: 'in-progress', label: 'In Progress', color: 'border-amber-500/40' },
  { id: 'resolved', label: 'Resolved', color: 'border-emerald-500/40' },
];

const priorityColors = {
  high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const priorityIcon = { high: '🔴', medium: '🟡', low: '🔵' };

const emptyForm = { title: '', client: '', priority: 'medium', description: '' };

export default function Support() {
  const [tickets, setTickets] = useState(initialTickets);
  const [detailModal, setDetailModal] = useState(null);
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const getByStatus = (status) => tickets.filter((t) => t.status === status);

  const moveTicket = (ticket, newStatus) => {
    setTickets((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status: newStatus } : t));
    if (detailModal?.id === ticket.id) setDetailModal((prev) => ({ ...prev, status: newStatus }));
    toast.success(`Ticket moved to ${newStatus}`);
  };

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const newTicket = {
      ...form,
      id: `TK-00${tickets.length + 1}`,
      status: 'open',
      created: new Date().toISOString().split('T')[0],
    };
    setTickets((prev) => [newTicket, ...prev]);
    toast.success('Ticket created');
    setNewTicketModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-gray-400 text-sm mt-1">{tickets.filter((t) => t.status === 'open').length} open tickets</p>
        </div>
        <Button onClick={() => setNewTicketModal(true)} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 flex-wrap">
        {columns.map((col) => (
          <div key={col.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-gray-400 text-sm">{col.label}:</span>
            <span className="text-white font-bold">{getByStatus(col.id).length}</span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.id}>
            <div className={`rounded-t-xl border-t-2 ${col.color} bg-white/5 px-4 py-3 border-x border-white/10`}>
              <h3 className="text-white text-sm font-semibold">{col.label}</h3>
              <p className="text-gray-500 text-xs">{getByStatus(col.id).length} tickets</p>
            </div>
            <div className="bg-white/[0.03] border border-t-0 border-white/10 rounded-b-xl p-3 space-y-3 min-h-64">
              <AnimatePresence>
                {getByStatus(col.id).map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    onClick={() => setDetailModal(ticket)}
                    className="bg-gray-900 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-violet-400 text-xs font-mono">{ticket.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[ticket.priority]}`}>
                        {priorityIcon[ticket.priority]} {ticket.priority}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium leading-snug mb-2">{ticket.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{ticket.client}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-600 text-xs">{ticket.created}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-violet-400 font-mono text-sm">{detailModal?.id}</span>
              </DialogTitle>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${priorityColors[detailModal?.priority]}`}>
                {detailModal?.priority} priority
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-white font-semibold text-base">{detailModal?.title}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-400 text-xs">{detailModal?.client}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500 text-xs">{detailModal?.created}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-gray-300 text-sm leading-relaxed">{detailModal?.description}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2">Move to:</p>
              <div className="flex gap-2 flex-wrap">
                {columns.filter((c) => c.id !== detailModal?.status).map((c) => (
                  <Button key={c.id} variant="outline" size="sm" onClick={() => moveTicket(detailModal, c.id)}
                    className="border-white/10 text-gray-400 hover:text-white text-xs h-8">
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailModal(null)} className="text-gray-400">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Ticket Modal */}
      <Dialog open={newTicketModal} onOpenChange={setNewTicketModal}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="Describe the issue..." />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Client</label>
              <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="Client name" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {['high', 'medium', 'low'].map((p) => (
                    <SelectItem key={p} value={p} className="text-gray-300 capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={3}
                placeholder="Detailed description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewTicketModal(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleCreate} variant="glow">Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
