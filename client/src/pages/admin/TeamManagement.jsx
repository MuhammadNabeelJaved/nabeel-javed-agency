import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ChevronRight, User, Mail, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { toast } from 'sonner';

const initialMembers = [
  { id: 1, name: 'Alex Carter', role: 'Lead Developer', email: 'alex@agency.com', department: 'Engineering', status: 'active', projects: 4, avatar: 'AC' },
  { id: 2, name: 'Maya Patel', role: 'UI/UX Designer', email: 'maya@agency.com', department: 'Design', status: 'active', projects: 3, avatar: 'MP' },
  { id: 3, name: 'Jordan Lee', role: 'Full Stack Dev', email: 'jordan@agency.com', department: 'Engineering', status: 'active', projects: 2, avatar: 'JL' },
  { id: 4, name: 'Sam Rivera', role: 'Project Manager', email: 'sam@agency.com', department: 'Operations', status: 'active', projects: 5, avatar: 'SR' },
  { id: 5, name: 'Taylor Kim', role: 'AI Engineer', email: 'taylor@agency.com', department: 'Engineering', status: 'on-leave', projects: 1, avatar: 'TK' },
];

const hiringStages = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
];

const initialCandidates = [
  { id: 1, name: 'Chris Morgan', role: 'Senior React Dev', stage: 'applied', email: 'chris@email.com', experience: '6 years', applied: '2024-03-15' },
  { id: 2, name: 'Priya Shah', role: 'Product Designer', stage: 'screening', email: 'priya@email.com', experience: '4 years', applied: '2024-03-14' },
  { id: 3, name: 'Derek Wu', role: 'Backend Engineer', stage: 'interview', email: 'derek@email.com', experience: '5 years', applied: '2024-03-12' },
  { id: 4, name: 'Nina Olsen', role: 'DevOps Engineer', stage: 'offer', email: 'nina@email.com', experience: '7 years', applied: '2024-03-10' },
  { id: 5, name: 'Liam Foster', role: 'ML Engineer', stage: 'hired', email: 'liam@email.com', experience: '3 years', applied: '2024-03-05' },
  { id: 6, name: 'Zoe Adams', role: 'Frontend Dev', stage: 'applied', email: 'zoe@email.com', experience: '2 years', applied: '2024-03-16' },
];

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
];

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'on-leave': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const emptyMember = { name: '', email: '', role: '', department: 'Engineering', status: 'active' };

export default function TeamManagement() {
  const [members, setMembers] = useState(initialMembers);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [memberModal, setMemberModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyMember);
  const [deleteModal, setDeleteModal] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyMember); setMemberModal(true); };
  const openEdit = (m) => { setEditTarget(m); setForm({ ...m }); setMemberModal(true); };

  const handleSaveMember = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email required'); return; }
    if (editTarget) {
      setMembers((prev) => prev.map((m) => m.id === editTarget.id ? { ...m, ...form } : m));
      toast.success('Member updated');
    } else {
      setMembers((prev) => [{ ...form, id: Date.now(), projects: 0, avatar: form.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) }, ...prev]);
      toast.success('Member added');
    }
    setMemberModal(false);
  };

  const handleDeleteMember = () => {
    setMembers((prev) => prev.filter((m) => m.id !== deleteModal.id));
    toast.success('Member removed');
    setDeleteModal(null);
  };

  const moveCandidate = (cand, newStage) => {
    setCandidates((prev) => prev.map((c) => c.id === cand.id ? { ...c, stage: newStage } : c));
    if (candidateDetail?.id === cand.id) setCandidateDetail((prev) => ({ ...prev, stage: newStage }));
    toast.success(`Moved to ${newStage}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="text-gray-400 text-sm mt-1">{members.length} members · {candidates.filter((c) => c.stage !== 'hired').length} in pipeline</p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="members" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400">
            Team Members
          </TabsTrigger>
          <TabsTrigger value="hiring" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400">
            Hiring Pipeline
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAdd} variant="glow" className="gap-2">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </div>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Member', 'Role', 'Department', 'Status', 'Projects', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs font-medium px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{member.name}</p>
                            <p className="text-gray-500 text-xs">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className="text-gray-300 text-sm">{member.role}</span></td>
                      <td className="px-5 py-4"><span className="text-gray-400 text-sm">{member.department}</span></td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[member.status]}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-300 text-sm font-semibold">{member.projects}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(member)}
                            className="h-7 w-7 text-gray-500 hover:text-violet-400">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteModal(member)}
                            className="h-7 w-7 text-gray-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Hiring Pipeline Tab */}
        <TabsContent value="hiring">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {hiringStages.map((stage) => {
                const stageCandidates = candidates.filter((c) => c.stage === stage.id);
                return (
                  <div key={stage.id} className="w-56">
                    <div className="bg-white/5 border border-white/10 rounded-t-xl px-3 py-2.5">
                      <p className="text-white text-sm font-semibold">{stage.label}</p>
                      <p className="text-gray-500 text-xs">{stageCandidates.length}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-t-0 border-white/10 rounded-b-xl p-2 space-y-2 min-h-48">
                      {stageCandidates.map((cand) => (
                        <motion.div
                          key={cand.id}
                          layout
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setCandidateDetail(cand)}
                          className="bg-gray-900 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-all"
                        >
                          <p className="text-white text-sm font-medium">{cand.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{cand.role}</p>
                          <p className="text-gray-600 text-xs mt-1">{cand.experience}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Member Modal */}
      <Dialog open={memberModal} onOpenChange={setMemberModal}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Member' : 'Add Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="Full name" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email *</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="email@agency.com" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Role</label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Department</label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {['Engineering', 'Design', 'Operations', 'Marketing', 'Sales'].map((d) => (
                    <SelectItem key={d} value={d} className="text-gray-300">{d}</SelectItem>
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
                  {['active', 'on-leave', 'inactive'].map((s) => (
                    <SelectItem key={s} value={s} className="text-gray-300 capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberModal(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSaveMember} variant="glow">
              {editTarget ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Remove Member</DialogTitle></DialogHeader>
          <p className="text-gray-400 text-sm py-2">Remove <span className="text-white font-medium">{deleteModal?.name}</span> from the team?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleDeleteMember} variant="destructive">Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Modal */}
      <Dialog open={!!candidateDetail} onOpenChange={() => setCandidateDetail(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Candidate Details</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {candidateDetail?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold">{candidateDetail?.name}</p>
                <p className="text-gray-400 text-sm">{candidateDetail?.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Email', value: candidateDetail?.email },
                { label: 'Experience', value: candidateDetail?.experience },
                { label: 'Applied', value: candidateDetail?.applied },
                { label: 'Stage', value: candidateDetail?.stage },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                  <p className="text-white text-sm capitalize">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2">Update Stage:</p>
              <div className="flex flex-wrap gap-2">
                {hiringStages.filter((s) => s.id !== candidateDetail?.stage).map((s) => (
                  <Button key={s.id} variant="outline" size="sm"
                    onClick={() => moveCandidate(candidateDetail, s.id)}
                    className="border-white/10 text-gray-400 hover:text-white text-xs h-8">
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCandidateDetail(null)} className="text-gray-400">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
