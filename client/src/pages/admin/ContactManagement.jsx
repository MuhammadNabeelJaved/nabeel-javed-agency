import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock, Mail, Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { toast } from 'sonner';

const statusColors = {
  new: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'in-progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const statusFilters = ['All', 'new', 'in-progress', 'resolved'];

const initialSubmissions = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@techcorp.com', phone: '+1 415-555-0101', subject: 'E-Commerce Project', message: 'Hi, I wanted to discuss a new web project for our company. We are looking for a full-featured e-commerce platform with AI recommendations. Our budget is around $50k.', status: 'new', date: '2024-03-17' },
  { id: 2, name: 'Mike Chen', email: 'mike@finbank.io', phone: '+1 212-555-0188', subject: 'Mobile App Quote', message: 'We need a quote for a mobile banking application. Features: biometric auth, real-time transactions, push notifications. Timeline: 4 months.', status: 'in-progress', date: '2024-03-16' },
  { id: 3, name: 'Emma Davis', email: 'emma@creativestudio.co', phone: '+1 310-555-0192', subject: 'Partnership Inquiry', message: 'I represent a digital agency looking to partner with your team on larger projects. We have capacity for frontend work.', status: 'new', date: '2024-03-16' },
  { id: 4, name: 'Robert Kim', email: 'r.kim@datasci.inc', phone: '+1 669-555-0134', subject: 'AI Integration', message: 'We want to add AI-powered features to our existing SaaS product. Specifically: smart recommendations, predictive analytics, natural language search.', status: 'resolved', date: '2024-03-15' },
  { id: 5, name: 'Lisa Park', email: 'lisa@ventures.com', phone: '+1 404-555-0176', subject: 'Investment Discussion', message: 'We are exploring investment in tech agencies. Would like to discuss growth plans and your vision for the next 2-3 years.', status: 'in-progress', date: '2024-03-14' },
  { id: 6, name: 'James Wilson', email: 'jwilson@startup.xyz', phone: '+1 512-555-0147', subject: 'MVP Development', message: 'We are a seed-stage startup needing an MVP for an AI-powered HR tool. Need full-stack build in 8 weeks. Budget: $35k.', status: 'new', date: '2024-03-14' },
  { id: 7, name: 'Priya Patel', email: 'priya@ecomco.com', phone: '+1 773-555-0163', subject: 'Redesign Project', message: 'Our current website is outdated and needs a complete redesign with a focus on conversion optimization. Monthly traffic: 50k users.', status: 'resolved', date: '2024-03-13' },
  { id: 8, name: 'Carlos Rivera', email: 'carlos@logictech.net', phone: '+1 972-555-0189', subject: 'ERP System', message: 'Looking for a custom ERP system for our manufacturing company. Modules: inventory, HR, procurement, finance. 50-100 users.', status: 'new', date: '2024-03-12' },
];

export default function ContactManagement() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const filtered = submissions.filter((s) =>
    filter === 'All' ? true : s.status === filter
  );

  const updateStatus = () => {
    if (!newStatus) return;
    setSubmissions((prev) => prev.map((s) => s.id === selected.id ? { ...s, status: newStatus } : s));
    setSelected((prev) => ({ ...prev, status: newStatus }));
    toast.success('Status updated');
    setNewStatus('');
  };

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === 'new').length,
    inProgress: submissions.filter((s) => s.status === 'in-progress').length,
    resolved: submissions.filter((s) => s.status === 'resolved').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
          <p className="text-gray-400 text-sm mt-1">Form submissions from the website</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'New', value: stats.new, color: 'text-violet-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Submitter', 'Subject', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-white text-sm font-medium">{sub.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{sub.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-300 text-sm">{sub.subject}</p>
                    <p className="text-gray-600 text-xs truncate max-w-xs mt-0.5">{sub.message}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusColors[sub.status]}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500 text-xs">{sub.date}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(sub); setNewStatus(sub.status); }}
                      className="h-7 w-7 text-gray-500 hover:text-violet-400">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">No submissions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              Submission Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-gray-500 text-xs mb-1">Name</p>
                <p className="text-white text-sm font-medium">{selected?.name}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-gray-500 text-xs mb-1">Date</p>
                <p className="text-white text-sm">{selected?.date}</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-gray-500 text-xs mb-1">Contact</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-300 text-sm">{selected?.email}</span>
                </div>
                {selected?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-300 text-sm">{selected?.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2 font-medium">{selected?.subject}</p>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-300 text-sm leading-relaxed">{selected?.message}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2">Update Status</p>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['new', 'in-progress', 'resolved'].map((s) => (
                      <SelectItem key={s} value={s} className="text-gray-300 capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={updateStatus} variant="glow" size="sm" className="h-9">Update</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)} className="text-gray-400">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
