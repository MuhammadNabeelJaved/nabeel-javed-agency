import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import { toast } from 'sonner';

const initialServices = [
  {
    id: 1, name: 'Web Development', description: 'Custom web applications built with modern frameworks.',
    icon: '🌐', price: '$5,000', active: true,
    features: ['React / Next.js', 'Node.js Backend', 'Database Design', 'API Integration', 'SEO Optimization'],
  },
  {
    id: 2, name: 'Mobile Development', description: 'Native and cross-platform mobile apps for iOS and Android.',
    icon: '📱', price: '$8,000', active: true,
    features: ['React Native', 'iOS & Android', 'Push Notifications', 'App Store Submission'],
  },
  {
    id: 3, name: 'UI/UX Design', description: 'Beautiful, user-centered designs that convert visitors.',
    icon: '🎨', price: '$3,000', active: true,
    features: ['Wireframing', 'Prototyping', 'Design Systems', 'User Research', 'Figma Design'],
  },
  {
    id: 4, name: 'AI Integration', description: 'Embed powerful AI capabilities into your applications.',
    icon: '🤖', price: '$6,500', active: true,
    features: ['GPT-4 Integration', 'Custom AI Models', 'Data Pipeline', 'ML Automation'],
  },
  {
    id: 5, name: 'DevOps & Cloud', description: 'Scalable infrastructure and deployment pipelines.',
    icon: '☁️', price: '$4,000', active: false,
    features: ['AWS / GCP', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Monitoring & Alerts'],
  },
  {
    id: 6, name: 'SEO & Marketing', description: 'Data-driven strategies to grow your online presence.',
    icon: '📈', price: '$2,500', active: true,
    features: ['Technical SEO', 'Content Strategy', 'Analytics Setup', 'Link Building'],
  },
];

const emptyForm = { name: '', description: '', icon: '⚡', price: '', active: true, features: [] };

export default function ServicesAdmin() {
  const [services, setServices] = useState(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newFeature, setNewFeature] = useState('');

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (svc) => {
    setEditTarget(svc);
    setForm({ ...svc });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Service name is required'); return; }
    if (editTarget) {
      setServices((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...form } : s));
      toast.success('Service updated');
    } else {
      setServices((prev) => [{ ...form, id: Date.now() }, ...prev]);
      toast.success('Service added');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setServices((prev) => prev.filter((s) => s.id !== deleteModal.id));
    toast.success('Service deleted');
    setDeleteModal(null);
  };

  const toggleActive = (id) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    setNewFeature('');
  };

  const removeFeature = (i) => {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-gray-400 text-sm mt-1">{services.filter((s) => s.active).length} active services</p>
        </div>
        <Button onClick={openAdd} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {services.map((svc) => (
          <motion.div key={svc.id} variants={itemVariants}>
            <Card className={`bg-white/5 border-white/10 backdrop-blur-sm h-full flex flex-col transition-opacity ${svc.active ? '' : 'opacity-50'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{svc.icon}</span>
                    <div>
                      <CardTitle className="text-white text-base">{svc.name}</CardTitle>
                      <p className="text-violet-400 text-sm font-semibold mt-0.5">{svc.price}</p>
                    </div>
                  </div>
                  <Switch
                    checked={svc.active}
                    onCheckedChange={() => toggleActive(svc.id)}
                    className="data-[state=checked]:bg-violet-600"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-400 text-sm mb-3 leading-relaxed">{svc.description}</p>
                <ul className="space-y-1.5 flex-1">
                  {svc.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-xs">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                  <Button variant="outline" size="sm" onClick={() => openEdit(svc)}
                    className="flex-1 border-white/10 text-gray-400 hover:text-white gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteModal(svc)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Icon (Emoji)</label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9 text-center text-lg" maxLength={2} />
              </div>
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1 block">Service Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="Service name" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Starting Price</label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. $5,000" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={2}
                placeholder="Describe this service..." />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Features</label>
              <div className="space-y-2 mb-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-gray-300 text-sm flex-1">{f}</span>
                    <button onClick={() => removeFeature(i)} className="text-gray-600 hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                  className="bg-white/5 border-white/10 text-white h-9 text-sm flex-1"
                  placeholder="Add a feature..." />
                <Button onClick={addFeature} variant="outline" size="sm"
                  className="border-white/10 text-gray-400 hover:text-white h-9">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })}
                className="data-[state=checked]:bg-violet-600" />
              <label className="text-gray-400 text-sm">Active (visible on website)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSave} variant="glow">
              {editTarget ? 'Save Changes' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm py-2">
            Are you sure you want to delete <span className="text-white font-medium">"{deleteModal?.name}"</span>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleDelete} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
