import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Mail, Briefcase, DollarSign, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import { toast } from 'sonner';

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-indigo-500 to-violet-600',
];

const initialClients = [
  { id: 1, name: 'James Harrison', company: 'TechCorp Inc', email: 'james@techcorp.com', phone: '+1 415-555-0101', totalProjects: 4, totalSpent: '$38,500', since: '2022-06' },
  { id: 2, name: 'Olivia Chen', company: 'FinBank', email: 'olivia@finbank.io', phone: '+1 212-555-0188', totalProjects: 2, totalSpent: '$24,200', since: '2023-01' },
  { id: 3, name: 'Marcus Williams', company: 'DataSci Inc', email: 'marcus@datasci.inc', phone: '+1 512-555-0147', totalProjects: 3, totalSpent: '$19,800', since: '2023-05' },
  { id: 4, name: 'Emma Thompson', company: 'Creative Studio', email: 'emma@creativestudio.co', phone: '+1 310-555-0192', totalProjects: 1, totalSpent: '$3,500', since: '2024-01' },
  { id: 5, name: 'Daniel Park', company: 'SalesForce Pro', email: 'daniel@salesforcepro.com', phone: '+1 669-555-0134', totalProjects: 5, totalSpent: '$67,000', since: '2021-09' },
  { id: 6, name: 'Sophia Martinez', company: 'People First Co', email: 'sophia@peoplefirst.co', phone: '+1 404-555-0176', totalProjects: 2, totalSpent: '$7,500', since: '2023-11' },
];

const emptyForm = { name: '', company: '', email: '', phone: '', totalProjects: 0, totalSpent: '$0', since: '' };

export default function ClientManagement() {
  const [clients, setClients] = useState(initialClients);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (client) => { setEditTarget(client); setForm({ ...client }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    if (editTarget) {
      setClients((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, ...form } : c));
      toast.success('Client updated');
    } else {
      setClients((prev) => [{ ...form, id: Date.now() }, ...prev]);
      toast.success('Client added');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setClients((prev) => prev.filter((c) => c.id !== deleteModal.id));
    toast.success('Client removed');
    setDeleteModal(null);
    if (detailModal?.id === deleteModal.id) setDetailModal(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-gray-400 text-sm mt-1">{clients.length} total clients</p>
        </div>
        <Button onClick={openAdd} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {clients.map((client, i) => (
          <motion.div
            key={client.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all cursor-pointer group"
              onClick={() => setDetailModal(client)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-base`}>
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{client.name}</p>
                      <p className="text-gray-400 text-xs">{client.company}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(client)}
                      className="h-7 w-7 text-gray-500 hover:text-violet-400">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteModal(client)}
                      className="h-7 w-7 text-gray-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-violet-400" />
                      <span className="text-violet-400 text-xs font-semibold">{client.totalProjects} projects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-semibold">{client.totalSpent}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColors[clients.findIndex((c) => c.id === detailModal?.id) % avatarColors.length]} flex items-center justify-center text-white font-bold text-xl`}>
                {detailModal?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-white text-lg font-bold">{detailModal?.name}</p>
                <p className="text-gray-400">{detailModal?.company}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Email', value: detailModal?.email },
                { label: 'Phone', value: detailModal?.phone },
                { label: 'Client since', value: detailModal?.since },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 text-sm">{item.label}</span>
                  <span className="text-gray-300 text-sm">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
                <p className="text-violet-400 text-xl font-bold">{detailModal?.totalProjects}</p>
                <p className="text-gray-500 text-xs">Projects</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="text-emerald-400 text-xl font-bold">{detailModal?.totalSpent}</p>
                <p className="text-gray-500 text-xs">Total Spent</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailModal(null)} className="text-gray-400">Close</Button>
            <Button variant="glow" onClick={() => { openEdit(detailModal); setDetailModal(null); }}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { field: 'name', label: 'Full Name *', placeholder: 'Client name' },
              { field: 'company', label: 'Company', placeholder: 'Company name' },
              { field: 'email', label: 'Email *', placeholder: 'email@company.com' },
              { field: 'phone', label: 'Phone', placeholder: '+1 555-0100' },
              { field: 'totalSpent', label: 'Total Spent', placeholder: '$0' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="text-gray-400 text-xs mb-1 block">{label}</label>
                <Input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder={placeholder} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSave} variant="glow">
              {editTarget ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Remove Client</DialogTitle></DialogHeader>
          <p className="text-gray-400 text-sm py-2">Remove <span className="text-white font-medium">{deleteModal?.name}</span> from your clients?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleDelete} variant="destructive">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
