import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, TrendingUp, Clock, CreditCard, Download, Send } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { toast } from 'sonner';

const revenueData = [
  { month: 'Oct', revenue: 28000 },
  { month: 'Nov', revenue: 35000 },
  { month: 'Dec', revenue: 31000 },
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 38000 },
  { month: 'Mar', revenue: 48500 },
];

const initialInvoices = [
  { id: 'INV-001', client: 'TechCorp Inc', amount: '$12,500', status: 'paid', date: '2024-03-01', due: '2024-03-15' },
  { id: 'INV-002', client: 'FinBank', amount: '$8,200', status: 'paid', date: '2024-02-15', due: '2024-03-01' },
  { id: 'INV-003', client: 'DataSci Inc', amount: '$6,800', status: 'pending', date: '2024-03-10', due: '2024-03-24' },
  { id: 'INV-004', client: 'Creative Studio', amount: '$3,500', status: 'overdue', date: '2024-02-20', due: '2024-03-06' },
  { id: 'INV-005', client: 'SalesForce Pro', amount: '$15,000', status: 'pending', date: '2024-03-12', due: '2024-03-26' },
  { id: 'INV-006', client: 'People First Co', amount: '$2,500', status: 'paid', date: '2024-01-30', due: '2024-02-13' },
];

const paymentMethods = [
  { id: 1, type: 'Visa', last4: '4242', expiry: '12/26', icon: '💳' },
  { id: 2, type: 'Mastercard', last4: '8765', expiry: '08/25', icon: '💳' },
];

const statusColors = {
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  overdue: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-emerald-400 font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const emptyInvoice = { client: '', amount: '', dueDate: '', status: 'pending' };

export default function Billing() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyInvoice);

  const stats = {
    monthly: '$48,500',
    total: '$222,000',
    pending: invoices.filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + parseFloat(i.amount.replace(/[$,]/g, '')), 0),
  };

  const handleCreate = () => {
    if (!form.client.trim() || !form.amount.trim()) {
      toast.error('Client and amount are required');
      return;
    }
    const newInvoice = {
      id: `INV-00${invoices.length + 1}`,
      client: form.client,
      amount: form.amount.startsWith('$') ? form.amount : `$${form.amount}`,
      status: form.status,
      date: new Date().toISOString().split('T')[0],
      due: form.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    toast.success('Invoice created');
    setModalOpen(false);
    setForm(emptyInvoice);
  };

  const handleDownload = (id) => toast.success(`Downloading ${id}...`);
  const handleSend = (id) => toast.success(`Invoice ${id} sent to client`);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-gray-400 text-sm mt-1">Invoices and payment management</p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Revenue', value: stats.monthly, icon: TrendingUp, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/20' },
          { label: 'Total Revenue', value: stats.total, icon: DollarSign, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Pending Amount', value: `$${stats.pending.toLocaleString()}`, icon: Clock, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-white/10 backdrop-blur-sm`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                <p className="text-white text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-white/5 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Revenue Chart + Payment Methods */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{pm.type} •••• {pm.last4}</p>
                  <p className="text-gray-500 text-xs">Expires {pm.expiry}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full border-white/10 text-gray-400 hover:text-white gap-2 mt-2">
              <Plus className="w-3.5 h-3.5" /> Add Payment Method
            </Button>
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Paid Invoices</span>
                <span className="text-emerald-400">{invoices.filter((i) => i.status === 'paid').length}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Pending</span>
                <span className="text-amber-400">{invoices.filter((i) => i.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Overdue</span>
                <span className="text-rose-400">{invoices.filter((i) => i.status === 'overdue').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoices Table */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-base">Invoices</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Invoice #', 'Client', 'Amount', 'Status', 'Date', 'Due', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-violet-400 text-sm font-mono font-medium">{inv.id}</span>
                    </td>
                    <td className="px-4 py-3"><span className="text-white text-sm">{inv.client}</span></td>
                    <td className="px-4 py-3"><span className="text-white text-sm font-semibold">{inv.amount}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusColors[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className="text-gray-400 text-sm">{inv.date}</span></td>
                    <td className="px-4 py-3"><span className="text-gray-400 text-sm">{inv.due}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(inv.id)}
                          className="h-7 w-7 text-gray-500 hover:text-violet-400">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSend(inv.id)}
                          className="h-7 w-7 text-gray-500 hover:text-emerald-400">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Create Invoice Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Client *</label>
              <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="Client name" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Amount *</label>
              <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. $5,000" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Due Date</label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {['pending', 'paid', 'overdue'].map((s) => (
                    <SelectItem key={s} value={s} className="text-gray-300 capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleCreate} variant="glow">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
