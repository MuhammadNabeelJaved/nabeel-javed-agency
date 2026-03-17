import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, Tag, FileText, MessageSquare,
  CheckCircle2, Circle, Download, Eye, Plus, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Textarea } from '../../components/ui/Textarea';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const projectsData = {
  1: {
    title: 'Horizon SaaS Platform',
    client: 'TechCorp Inc.',
    status: 'active',
    progress: 72,
    startDate: 'Jan 10, 2026',
    deadline: 'Apr 15, 2026',
    description: 'A comprehensive SaaS platform overhaul including redesigned dashboard, onboarding flow, and white-label capabilities. Focus on improving user retention and reducing churn through better UX.',
    techStack: ['React', 'Figma', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'AWS'],
    team: [
      { name: 'Alex Chen', role: 'Lead Designer', initial: 'A', color: 'bg-violet-500' },
      { name: 'Beth Park', role: 'Developer', initial: 'B', color: 'bg-emerald-500' },
      { name: 'Carlos Diaz', role: 'PM', initial: 'C', color: 'bg-sky-500' },
    ],
  },
};

const mockTasks = [
  { id: 1, title: 'Design system setup', status: 'done', priority: 'high' },
  { id: 2, title: 'Wireframes — Dashboard', status: 'done', priority: 'high' },
  { id: 3, title: 'Prototype — Onboarding flow', status: 'in-progress', priority: 'high' },
  { id: 4, title: 'Component library build', status: 'in-progress', priority: 'medium' },
  { id: 5, title: 'Responsive layouts', status: 'todo', priority: 'medium' },
  { id: 6, title: 'Accessibility audit', status: 'todo', priority: 'low' },
];

const mockFiles = [
  { name: 'brand_kit_v3.zip', type: 'ZIP', size: '14.2 MB', date: 'Mar 10' },
  { name: 'wireframes_dashboard.fig', type: 'FIG', size: '8.6 MB', date: 'Mar 8' },
  { name: 'design_spec_v2.pdf', type: 'PDF', size: '2.1 MB', date: 'Mar 5' },
  { name: 'prototype_demo.mp4', type: 'MP4', size: '45.3 MB', date: 'Feb 28' },
  { name: 'assets_export.zip', type: 'ZIP', size: '22.0 MB', date: 'Feb 20' },
];

const priorityConfig = {
  high: { variant: 'destructive', label: 'High' },
  medium: { variant: 'warning', label: 'Med' },
  low: { variant: 'success', label: 'Low' },
};

const statusConfig = {
  done: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Done' },
  'in-progress': { icon: Circle, color: 'text-violet-400', label: 'In Progress' },
  todo: { icon: Circle, color: 'text-white/30', label: 'To Do' },
};

const fileTypeColors = {
  ZIP: 'bg-amber-500/20 text-amber-400',
  FIG: 'bg-violet-500/20 text-violet-400',
  PDF: 'bg-rose-500/20 text-rose-400',
  MP4: 'bg-sky-500/20 text-sky-400',
};

export default function TeamProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projectsData[id] || projectsData[1];
  const [tasks, setTasks] = useState(mockTasks);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState(['Initial scope confirmed with client. Focus on mobile-first approach.']);

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t
      )
    );
  };

  const saveNote = () => {
    if (notes.trim()) {
      setSavedNotes((prev) => [notes.trim(), ...prev]);
      setNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Back + Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/50 hover:text-white mb-4 -ml-2 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="text-sm text-white/50 mt-1">{project.client}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="success" className="text-sm px-3 py-1">Active</Badge>
            <div className="text-sm text-white/50 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Due {project.deadline}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-white/50">
            <span>Overall Progress</span>
            <span className="text-white/70 font-medium">{project.progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white/[0.04] border border-white/10 p-1 rounded-xl mb-6">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="files" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">Files</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50">Notes</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-white/60 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/[0.04] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tech Stack
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs border-white/20 text-white/60">
                      {tech}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.04] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {project.team.map((member) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', member.color)}>
                        {member.initial}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{member.name}</p>
                        <p className="text-xs text-white/40">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="space-y-2">
            {tasks.map((task) => {
              const StatusIcon = statusConfig[task.status].icon;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 cursor-pointer transition-all group"
                >
                  <StatusIcon className={cn('w-5 h-5 flex-shrink-0 transition-colors', statusConfig[task.status].color)} />
                  <span className={cn('text-sm flex-1', task.status === 'done' && 'line-through text-white/30')}>
                    {task.title}
                  </span>
                  <Badge variant={priorityConfig[task.priority].variant} className="text-xs">
                    {priorityConfig[task.priority].label}
                  </Badge>
                </div>
              );
            })}
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="space-y-2">
            {mockFiles.map((file) => (
              <div key={file.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all">
                <div className={cn('px-2 py-1 rounded text-xs font-bold', fileTypeColors[file.type] || 'bg-white/10 text-white/50')}>
                  {file.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{file.name}</p>
                  <p className="text-xs text-white/40">{file.size} · {file.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardContent className="p-4 space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 resize-none min-h-[80px]"
                />
                <Button onClick={saveNote} variant="glow" className="gap-2" disabled={!notes.trim()}>
                  <Save className="w-4 h-4" /> Save Note
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {savedNotes.map((note, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <p className="text-sm text-white/70">{note}</p>
                  <p className="text-xs text-white/30 mt-1">Just now</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
