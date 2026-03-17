import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare, FolderOpen, TrendingUp, Clock,
  Plus, Timer, Calendar, CheckCircle2, Circle,
  AlertCircle, ChevronRight, Activity, MessageSquare,
  Upload, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

const statCards = [
  { label: 'Active Tasks', value: '12', icon: CheckSquare, color: 'text-violet-400', bg: 'bg-violet-500/10', change: '+3 today' },
  { label: 'Projects', value: '5', icon: FolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '2 due soon' },
  { label: 'Completed This Week', value: '28', icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10', change: '+6 vs last week' },
  { label: 'Hours Logged', value: '34.5h', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '6.5h today' },
];

const initialTasks = [
  { id: 1, title: 'Finalize homepage wireframes', priority: 'high', done: false },
  { id: 2, title: 'Review client feedback on logo', priority: 'medium', done: false },
  { id: 3, title: 'Update design system tokens', priority: 'low', done: true },
  { id: 4, title: 'Sprint planning meeting prep', priority: 'high', done: false },
  { id: 5, title: 'Deploy staging environment', priority: 'medium', done: false },
];

const projects = [
  { name: 'Horizon SaaS Platform', client: 'TechCorp Inc.', progress: 72, color: 'bg-violet-500' },
  { name: 'Brand Identity Refresh', client: 'Bloom Studio', progress: 45, color: 'bg-emerald-500' },
  { name: 'E-commerce Redesign', client: 'NovaMart', progress: 91, color: 'bg-amber-500' },
];

const activity = [
  { icon: CheckCircle2, color: 'text-emerald-400', text: 'Task "API integration" marked complete', time: '10m ago' },
  { icon: MessageSquare, color: 'text-sky-400', text: 'Comment added to "Design Review"', time: '35m ago' },
  { icon: Upload, color: 'text-violet-400', text: 'New file uploaded: brand_kit_v3.zip', time: '1h ago' },
  { icon: Star, color: 'text-amber-400', text: 'Milestone "Beta Launch" reached', time: '2h ago' },
  { icon: Activity, color: 'text-rose-400', text: 'Project deadline updated to Apr 15', time: '3h ago' },
  { icon: CheckCircle2, color: 'text-emerald-400', text: 'Task "Copywriting" reviewed & approved', time: '5h ago' },
];

const priorityConfig = {
  high: { variant: 'destructive', label: 'High' },
  medium: { variant: 'warning', label: 'Med' },
  low: { variant: 'success', label: 'Low' },
};

export default function TeamDashboardHome() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeIn} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good morning, <span className="text-violet-400">Alex</span> 👋
          </h1>
          <p className="text-sm text-white/50 mt-0.5">Monday, March 17, 2026</p>
        </div>
        <Badge variant="purple" className="self-start sm:self-auto px-3 py-1 text-sm">
          Senior Designer
        </Badge>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/40 mt-1">{stat.change}</p>
                  </div>
                  <div className={cn('p-2 rounded-lg', stat.bg)}>
                    <stat.icon className={cn('w-5 h-5', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-1">
          <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/80">My Tasks Today</CardTitle>
                <Button size="sm" variant="ghost" className="text-violet-400 hover:text-violet-300 h-7 px-2 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
                  )}
                  <span className={cn('text-sm flex-1', task.done && 'line-through text-white/30')}>
                    {task.title}
                  </span>
                  <Badge variant={priorityConfig[task.priority].variant} className="text-xs px-1.5 py-0">
                    {priorityConfig[task.priority].label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Projects */}
        <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/80">Active Projects</CardTitle>
                <Button size="sm" variant="ghost" className="text-white/40 hover:text-white h-7 px-2 text-xs">
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {projects.map((project) => (
                <div key={project.name} className="space-y-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{project.name}</p>
                      <p className="text-xs text-white/40">{project.client}</p>
                    </div>
                    <span className="text-sm font-semibold text-white/70">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', project.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <item.icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{item.text}</p>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div custom={7} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { label: 'New Task', icon: Plus, variant: 'glow' },
                { label: 'Log Time', icon: Timer, variant: 'outline' },
                { label: 'View Calendar', icon: Calendar, variant: 'outline' },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="w-full justify-start gap-2"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
