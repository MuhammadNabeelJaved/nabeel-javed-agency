import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, Clock, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { useJobs } from '../../hooks/useJobs';
import { toast } from 'sonner';

const deptColors = {
  Engineering: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Design: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Marketing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Sales: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Operations: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const emptyForm = {
  title: '', department: 'Engineering', location: '', type: 'Full-time',
  workMode: 'Remote', experienceLevel: 'Mid-Level (3-5 years)',
  salaryMin: '', salaryMax: '', description: '',
  responsibilities: '', requirements: '', benefits: '', status: 'active',
};

export default function JobManagement() {
  const { jobs, addJob, updateJob, deleteJob } = useJobs();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setEditTarget(job);
    const responsibilitiesStr = Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : (job.responsibilities || '');
    const requirementsStr = Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || '');
    const benefitsStr = Array.isArray(job.benefits) ? job.benefits.join('\n') : (job.benefits || '');
    let salaryMin = '', salaryMax = '';
    if (job.salaryRange) {
      const parts = job.salaryRange.split(' - ');
      salaryMin = parts[0] || '';
      salaryMax = parts[1] || '';
    }
    setForm({
      title: job.title || '',
      department: job.department || 'Engineering',
      location: job.location || '',
      type: job.type || 'Full-time',
      workMode: job.workMode || 'Remote',
      experienceLevel: job.experienceLevel || 'Mid-Level (3-5 years)',
      salaryMin,
      salaryMax,
      description: job.description || '',
      responsibilities: responsibilitiesStr,
      requirements: requirementsStr,
      benefits: benefitsStr,
      status: job.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    const payload = {
      title: form.title,
      department: form.department,
      location: form.location,
      type: form.type,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      salaryRange: form.salaryMin && form.salaryMax ? `${form.salaryMin} - ${form.salaryMax}` : '',
      description: form.description,
      responsibilities: form.responsibilities.split('\n').filter((l) => l.trim()),
      requirements: form.requirements.split('\n').filter((l) => l.trim()),
      benefits: form.benefits.split('\n').filter((l) => l.trim()),
      status: form.status,
    };
    if (editTarget) {
      updateJob(editTarget.id, payload);
      toast.success('Job updated');
    } else {
      addJob(payload);
      toast.success('Job posted');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    deleteJob(deleteModal.id);
    toast.success('Job deleted');
    setDeleteModal(null);
  };

  const toggleStatus = (job) => {
    updateJob(job.id, { status: job.status === 'active' ? 'closed' : 'active' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Listings</h1>
          <p className="text-gray-400 text-sm mt-1">
            {jobs.filter((j) => j.status === 'active').length} active · {jobs.length} total
          </p>
        </div>
        <Button onClick={openAdd} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Post New Job
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`bg-white/5 border-white/10 backdrop-blur-sm transition-opacity ${job.status !== 'active' ? 'opacity-60' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-white font-semibold text-base">{job.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${deptColors[job.department] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {job.department}
                        </span>
                        {job.status === 'active'
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Closed</span>
                        }
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        {job.location && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </div>
                        )}
                        {job.type && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Clock className="w-3 h-3" /> {job.type}
                          </div>
                        )}
                        {job.workMode && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Briefcase className="w-3 h-3" /> {job.workMode}
                          </div>
                        )}
                        {job.salaryRange && (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                            <DollarSign className="w-3 h-3" /> {job.salaryRange}
                          </div>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-gray-500 text-xs mt-2 line-clamp-1">{job.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={job.status === 'active'}
                        onCheckedChange={() => toggleStatus(job)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(job)}
                        className="h-8 w-8 text-gray-500 hover:text-violet-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteModal(job)}
                        className="h-8 w-8 text-gray-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {jobs.length === 0 && (
          <div className="text-center py-16 text-gray-500">No jobs posted yet</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Job' : 'Post New Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Job Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Department</label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['Engineering', 'Design', 'Marketing', 'Sales', 'Operations'].map((d) => (
                      <SelectItem key={d} value={d} className="text-gray-300">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Location</label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. San Francisco, CA" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((t) => (
                      <SelectItem key={t} value={t} className="text-gray-300">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Work Mode</label>
                <Select value={form.workMode} onValueChange={(v) => setForm({ ...form, workMode: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['Remote', 'Hybrid', 'On-site'].map((m) => (
                      <SelectItem key={m} value={m} className="text-gray-300">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Experience</label>
                <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {['Junior (0-2 years)', 'Mid-Level (3-5 years)', 'Senior (5+ years)', 'Lead (7+ years)'].map((e) => (
                      <SelectItem key={e} value={e} className="text-gray-300">{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Salary Min</label>
                <Input value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. $80,000" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Salary Max</label>
                <Input value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. $120,000" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={3}
                placeholder="Job description..." />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Responsibilities (one per line)</label>
              <Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm font-mono" rows={4}
                placeholder="Lead frontend architecture&#10;Build responsive UI components&#10;Mentor junior engineers" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Requirements (one per line)</label>
              <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm font-mono" rows={4}
                placeholder="5+ years React experience&#10;TypeScript proficiency&#10;Strong communication skills" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Benefits (one per line)</label>
              <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                className="bg-white/5 border-white/10 text-white resize-none text-sm font-mono" rows={3}
                placeholder="Competitive salary&#10;Remote-first culture&#10;Health insurance" />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={(v) => setForm({ ...form, status: v ? 'active' : 'closed' })}
                className="data-[state=checked]:bg-emerald-600"
              />
              <label className="text-gray-400 text-sm">Active (accepting applications)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSave} variant="glow">
              {editTarget ? 'Save Changes' : 'Post Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Delete Job</DialogTitle></DialogHeader>
          <p className="text-gray-400 text-sm py-2">
            Delete <span className="text-white font-medium">"{deleteModal?.title}"</span>? This cannot be undone.
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
