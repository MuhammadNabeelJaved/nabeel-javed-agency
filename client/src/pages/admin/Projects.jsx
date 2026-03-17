import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, X, Check, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { toast } from 'sonner';

const initialProjects = [
  {
    id: 1, title: 'E-Commerce Platform', client: 'TechCorp Inc', category: 'Web Development',
    status: 'active', dueDate: '2024-04-30', duration: '3 months',
    techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    description: 'Full-featured e-commerce platform with AI product recommendations.',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=80&h=60&fit=crop',
  },
  {
    id: 2, title: 'Mobile Banking App', client: 'FinBank', category: 'Mobile Development',
    status: 'active', dueDate: '2024-05-15', duration: '4 months',
    techStack: ['React Native', 'Node.js', 'PostgreSQL'],
    description: 'Secure mobile banking app with biometric authentication.',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&h=60&fit=crop',
  },
  {
    id: 3, title: 'AI Analytics Dashboard', client: 'DataSci Inc', category: 'AI/ML',
    status: 'review', dueDate: '2024-03-25', duration: '2 months',
    techStack: ['React', 'Python', 'TensorFlow', 'AWS'],
    description: 'Real-time analytics dashboard powered by machine learning.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&h=60&fit=crop',
  },
  {
    id: 4, title: 'SaaS CRM System', client: 'SalesForce Pro', category: 'SaaS',
    status: 'active', dueDate: '2024-06-01', duration: '5 months',
    techStack: ['Next.js', 'GraphQL', 'PostgreSQL', 'Redis'],
    description: 'Customer relationship management system with pipeline tracking.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=80&h=60&fit=crop',
  },
  {
    id: 5, title: 'Portfolio Website', client: 'Creative Studio', category: 'Web Development',
    status: 'completed', dueDate: '2024-03-01', duration: '1 month',
    techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
    description: 'Award-winning portfolio website with stunning animations.',
    thumbnail: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=80&h=60&fit=crop',
  },
  {
    id: 6, title: 'HR Management Platform', client: 'People First Co', category: 'SaaS',
    status: 'pending', dueDate: '2024-07-15', duration: '6 months',
    techStack: ['Vue.js', 'Express', 'MongoDB'],
    description: 'Complete HR management with payroll, attendance, and performance reviews.',
    thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=80&h=60&fit=crop',
  },
];

const statusOptions = ['All', 'active', 'completed', 'pending', 'review'];
const categoryOptions = ['Web Development', 'Mobile Development', 'AI/ML', 'SaaS', 'Design'];
const allTechOptions = ['React', 'Next.js', 'Vue.js', 'Node.js', 'Express', 'Python', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'AWS', 'TensorFlow', 'Stripe', 'React Native', 'Tailwind CSS', 'Framer Motion'];

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  review: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const emptyForm = {
  title: '', client: '', category: 'Web Development', status: 'active',
  dueDate: '', duration: '', description: '', techStack: [], thumbnail: '',
};

export default function Projects() {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setForm({ ...project });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.client.trim()) {
      toast.error('Title and client are required');
      return;
    }
    if (editTarget) {
      setProjects((prev) => prev.map((p) => p.id === editTarget.id ? { ...p, ...form } : p));
      toast.success('Project updated');
    } else {
      setProjects((prev) => [{ ...form, id: Date.now() }, ...prev]);
      toast.success('Project added');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setProjects((prev) => prev.filter((p) => p.id !== deleteModal.id));
    toast.success('Project deleted');
    setDeleteModal(null);
    if (detailPanel?.id === deleteModal.id) setDetailPanel(null);
  };

  const toggleTech = (tech) => {
    setForm((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} total projects</p>
        </div>
        <Button onClick={openAdd} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Project', 'Client', 'Category', 'Status', 'Due Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, i) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-10 h-8 rounded-lg object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/80x60/1f1f2e/666?text=P'; }}
                      />
                      <span className="text-white text-sm font-medium">{project.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-400 text-sm">{project.client}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">{project.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-400 text-sm">{project.dueDate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetailPanel(project)}
                        className="h-7 w-7 text-gray-500 hover:text-sky-400">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(project)}
                        className="h-7 w-7 text-gray-500 hover:text-violet-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteModal(project)}
                        className="h-7 w-7 text-gray-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">No projects found</div>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Project' : 'Add Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Title *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="Project title" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Client *</label>
                <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="Client name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c} className="text-gray-300">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['active', 'pending', 'review', 'completed'].map((s) => (
                      <SelectItem key={s} value={s} className="text-gray-300 capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Duration</label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. 3 months" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {allTechOptions.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                      form.techStack.includes(tech)
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {form.techStack.includes(tech) && <Check className="w-2.5 h-2.5 inline mr-1" />}
                    {tech}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={3}
                placeholder="Project description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSave} variant="glow">
              {editTarget ? 'Save Changes' : 'Add Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm py-2">
            Are you sure you want to delete <span className="text-white font-medium">"{deleteModal?.title}"</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleDelete} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Slide-Over */}
      <AnimatePresence>
        {detailPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setDetailPanel(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-950 border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-lg font-bold">Project Details</h2>
                  <Button variant="ghost" size="icon" onClick={() => setDetailPanel(null)}
                    className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <img
                  src={detailPanel.thumbnail}
                  alt={detailPanel.title}
                  className="w-full h-40 rounded-xl object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/400x160/1f1f2e/666?text=Project'; }}
                />
                <div>
                  <h3 className="text-white text-xl font-bold">{detailPanel.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{detailPanel.client}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusColors[detailPanel.status]}`}>
                    {detailPanel.status}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                    {detailPanel.category}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Due Date</p>
                    <p className="text-white text-sm font-medium">{detailPanel.dueDate}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Duration</p>
                    <p className="text-white text-sm font-medium">{detailPanel.duration}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {detailPanel.techStack.map((tech) => (
                      <span key={tech} className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs border border-violet-500/30">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2">Description</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{detailPanel.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { openEdit(detailPanel); setDetailPanel(null); }} variant="glow" className="flex-1 gap-2">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Project
                  </Button>
                  <Button onClick={() => { setDeleteModal(detailPanel); setDetailPanel(null); }}
                    variant="destructive" className="gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
