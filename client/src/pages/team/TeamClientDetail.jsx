import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, Building2, Calendar, MessageSquare,
  FolderOpen, ChevronRight, Plus, Save, CheckCircle2, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const clientsData = {
  1: {
    name: 'Marcus Chen',
    company: 'TechCorp Inc.',
    email: 'marcus@techcorp.com',
    phone: '+1 555-0101',
    role: 'CTO',
    joined: 'Jan 2026',
    color: 'bg-violet-500',
    initial: 'TC',
    status: 'active',
  },
};

const clientProjects = [
  { id: 1, name: 'Horizon SaaS Platform', status: 'active', progress: 72, deadline: 'Apr 15, 2026' },
  { id: 2, name: 'Mobile App MVP', status: 'active', progress: 31, deadline: 'Jun 20, 2026' },
  { id: 3, name: 'Dashboard Widgets', status: 'completed', progress: 100, deadline: 'Jan 30, 2026' },
];

const contactHistory = [
  { type: 'call', text: 'Discovery call — discussed Q2 roadmap', date: 'Mar 15, 2026', icon: Phone, color: 'text-emerald-400' },
  { type: 'email', text: 'Sent revised proposal with updated pricing', date: 'Mar 10, 2026', icon: Mail, color: 'text-sky-400' },
  { type: 'meeting', text: 'Sprint review — all milestones on track', date: 'Mar 5, 2026', icon: Calendar, color: 'text-violet-400' },
  { type: 'message', text: 'Slack thread: feedback on UI components', date: 'Feb 28, 2026', icon: MessageSquare, color: 'text-amber-400' },
  { type: 'call', text: 'Onboarding call — project kick-off', date: 'Jan 10, 2026', icon: Phone, color: 'text-emerald-400' },
];

const statusColors = {
  active: 'border-emerald-500/40',
  completed: 'border-sky-500/40',
  'on-hold': 'border-amber-500/40',
};

const statusVariants = {
  active: 'success',
  completed: 'info',
  'on-hold': 'warning',
};

export default function TeamClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = clientsData[id] || clientsData[1];
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState(['Great client to work with — very responsive and clear on requirements.']);

  const saveNote = () => {
    if (note.trim()) {
      setNotes((prev) => [note.trim(), ...prev]);
      setNote('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Back */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/50 hover:text-white -ml-2 gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Button>

        {/* Client Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0', client.color)}>
            {client.initial}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <Badge variant="success" className="text-xs">Active</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{client.company}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{client.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{client.phone}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/40">
              <span>Role: <span className="text-white/60">{client.role}</span></span>
              <span>·</span>
              <span>Client since: <span className="text-white/60">{client.joined}</span></span>
            </div>
          </div>
          <Button variant="glow" className="self-start gap-2">
            <MessageSquare className="w-4 h-4" /> Send Message
          </Button>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2 space-y-4">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> Projects ({clientProjects.length})
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-violet-400 hover:text-violet-300 h-7 px-2 text-xs gap-1">
                  <Plus className="w-3 h-3" /> New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {clientProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn('p-3 rounded-xl border bg-white/[0.02] hover:border-white/20 cursor-pointer transition-all group', statusColors[project.status])}
                  onClick={() => navigate(`/team/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariants[project.status]} className="text-xs capitalize">{project.status.replace('-', ' ')}</Badge>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-white/40">
                    <span>{project.progress}% complete</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {project.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a client note..."
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 resize-none min-h-[72px]"
              />
              <Button onClick={saveNote} variant="glow" size="sm" className="gap-2" disabled={!note.trim()}>
                <Save className="w-3.5 h-3.5" /> Save Note
              </Button>
              <div className="space-y-2 pt-1">
                {notes.map((n, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <p className="text-sm text-white/60">{n}</p>
                    <p className="text-xs text-white/30 mt-1">Just now</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact History */}
        <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Contact History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {contactHistory.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <item.icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 leading-snug">{item.text}</p>
                    <p className="text-xs text-white/30 mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
