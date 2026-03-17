import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Clock, CheckCircle2, DollarSign,
  MessageSquare, Phone, FileText, ChevronRight,
  Bell, Calendar, HelpCircle, ArrowRight, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

const statCards = [
  { label: 'Active Projects', value: '3', icon: FolderOpen, color: 'text-violet-400', bg: 'bg-violet-500/10', sub: '2 in progress' },
  { label: 'Pending Review', value: '5', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: 'Awaiting your feedback' },
  { label: 'Completed', value: '12', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: 'All time' },
  { label: 'Total Invested', value: '$48.5K', icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-500/10', sub: 'Across all projects' },
];

const activeProjects = [
  { id: 1, name: 'Horizon SaaS Platform', status: 'In Progress', progress: 72, lastUpdate: '2 hours ago', color: 'bg-violet-500', statusVariant: 'info' },
  { id: 2, name: 'Brand Identity Refresh', status: 'Review Needed', progress: 45, lastUpdate: 'Yesterday', color: 'bg-emerald-500', statusVariant: 'warning' },
  { id: 3, name: 'Mobile App MVP', status: 'Planning', progress: 15, lastUpdate: '3 days ago', color: 'bg-amber-500', statusVariant: 'secondary' },
];

const recentNotifications = [
  { icon: CheckCircle2, color: 'text-emerald-400', text: 'Milestone "Design Complete" approved', time: '1h ago' },
  { icon: MessageSquare, color: 'text-sky-400', text: 'New message from your Project Lead', time: '3h ago' },
  { icon: Bell, color: 'text-amber-400', text: 'Invoice #INV-2026-12 is ready', time: 'Yesterday' },
];

const milestones = [
  { title: 'Final Prototype Delivery', project: 'Horizon SaaS', date: 'Mar 25, 2026', color: 'bg-violet-500' },
  { title: 'Brand Guidelines Handoff', project: 'Brand Identity', date: 'Apr 5, 2026', color: 'bg-emerald-500' },
  { title: 'MVP Feature Freeze', project: 'Mobile App', date: 'Apr 20, 2026', color: 'bg-amber-500' },
];

export default function UserDashboardHome() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-violet-400">Marcus</span>! 👋
          </h1>
          <p className="text-sm text-white/50 mt-0.5">{today}</p>
        </div>
        <Badge variant="success" className="self-start sm:self-auto px-3 py-1 text-sm gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          All systems operational
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
                    <p className="text-xs text-white/50">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
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
        {/* Active Projects */}
        <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/80">Active Projects</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => navigate('/user/projects')} className="text-white/40 hover:text-white h-7 px-2 text-xs gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {activeProjects.map((project) => (
                <div key={project.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-white text-sm">{project.name}</h3>
                    <Badge variant={project.statusVariant} className="text-xs flex-shrink-0">{project.status}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Progress</span>
                      <span className="text-white/60 font-medium">{project.progress}%</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30">Updated {project.lastUpdate}</span>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/user/projects/${project.id}`)} className="h-7 px-2 text-xs text-violet-400 hover:text-violet-300 gap-1">
                      View Details <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { label: 'Start Chat', icon: MessageSquare, variant: 'glow', onClick: () => navigate('/user/chat') },
                  { label: 'Book a Call', icon: Phone, variant: 'outline', onClick: () => {} },
                  { label: 'View Invoices', icon: FileText, variant: 'outline', onClick: () => {} },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    className="w-full justify-start gap-2 border-white/10"
                    onClick={action.onClick}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white/80">Notifications</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/user/notifications')} className="text-white/40 hover:text-white h-7 px-2 text-xs">
                    See all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {recentNotifications.map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <n.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', n.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 leading-snug">{n.text}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Milestones + Help */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div custom={7} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" /> Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', m.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{m.title}</p>
                    <p className="text-xs text-white/40">{m.project}</p>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {m.date}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Widget */}
        <motion.div custom={8} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border-violet-500/20">
            <CardContent className="p-5 space-y-4">
              <div className="p-2.5 bg-violet-500/20 rounded-xl w-fit">
                <HelpCircle className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Need help?</h3>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Our team is here to assist. Chat with your project lead or use our AI assistant.
                </p>
              </div>
              <div className="space-y-2">
                <Button variant="glow" className="w-full gap-2 text-sm" onClick={() => navigate('/user/chat')}>
                  <MessageSquare className="w-4 h-4" /> Start a Conversation
                </Button>
                <Button variant="ghost" className="w-full gap-2 text-sm text-white/50 hover:text-white" onClick={() => navigate('/user/ai-chat')}>
                  <Zap className="w-4 h-4" /> Try AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
