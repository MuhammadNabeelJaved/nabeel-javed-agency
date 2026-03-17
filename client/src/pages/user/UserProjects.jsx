import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, Users, ChevronRight, MessageSquare,
  ExternalLink, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const projects = [
  {
    id: 1, name: 'Horizon SaaS Platform', status: 'in-progress', progress: 72,
    lastUpdate: '2 hours ago', deadline: 'Apr 15, 2026',
    team: ['AC', 'BP', 'CD'], description: 'Complete SaaS platform redesign including dashboard, onboarding and white-label support.',
    links: ['Figma Prototype', 'Staging Preview'], color: 'bg-violet-500',
  },
  {
    id: 2, name: 'Brand Identity Refresh', status: 'review', progress: 45,
    lastUpdate: 'Yesterday', deadline: 'May 1, 2026',
    team: ['PP', 'AC'], description: 'Full visual identity overhaul including logo, color palette, typography and brand guidelines.',
    links: ['Brand Board'], color: 'bg-emerald-500',
  },
  {
    id: 3, name: 'Mobile App MVP', status: 'planning', progress: 15,
    lastUpdate: '3 days ago', deadline: 'Jun 20, 2026',
    team: ['BP', 'CD'], description: 'Native mobile app MVP for iOS and Android targeting core user flows.',
    links: [], color: 'bg-amber-500',
  },
  {
    id: 4, name: 'Marketing Website', status: 'completed', progress: 100,
    lastUpdate: 'Mar 5, 2026', deadline: 'Mar 5, 2026',
    team: ['AC', 'PP'], description: 'New corporate marketing website with CMS integration and analytics.',
    links: ['Live Site', 'CMS Dashboard'], color: 'bg-sky-500',
  },
];

const statusConfig = {
  'in-progress': { variant: 'info', label: 'In Progress', icon: Clock },
  'review': { variant: 'warning', label: 'Review Needed', icon: AlertCircle },
  'planning': { variant: 'secondary', label: 'Planning', icon: Clock },
  'completed': { variant: 'success', label: 'Completed', icon: CheckCircle2 },
};

const filters = ['All', 'In Progress', 'Review', 'Planning', 'Completed'];

const avatarColors = ['bg-violet-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];

export default function UserProjects() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = projects.filter((p) => {
    const matchFilter = activeFilter === 'All' || p.status === activeFilter.toLowerCase().replace(' ', '-');
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-white/50 mt-0.5">{filtered.length} projects</p>
        </div>
      </motion.div>

      {/* Search + Filter */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white border border-white/10'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Project Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => {
            const StatusIcon = statusConfig[project.status].icon;
            return (
              <motion.div
                key={project.id}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.98 }}
                layout
              >
                <Card className="bg-white/[0.04] border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex-shrink-0', project.color)} />
                          <div>
                            <h3 className="font-semibold text-white">{project.name}</h3>
                            <p className="text-xs text-white/40 mt-0.5">{project.description}</p>
                          </div>
                        </div>

                        {/* Progress */}
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
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-4 text-xs text-white/40">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Due {project.deadline}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Updated {project.lastUpdate}
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <div className="flex -space-x-1.5">
                              {project.team.map((t, idx) => (
                                <div key={idx} className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#0a0a0f]', avatarColors[idx])}>
                                  {t[0]}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Links */}
                        {project.links.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {project.links.map((link) => (
                              <button key={link} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                                <ExternalLink className="w-3 h-3" /> {link}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3">
                        <Badge variant={statusConfig[project.status].variant} className="text-xs whitespace-nowrap">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[project.status].label}
                        </Badge>
                        <div className="flex gap-2 mt-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 border-white/10 text-white/50 hover:text-white"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Request Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/user/projects/${project.id}`)}
                            className="h-8 text-xs text-violet-400 hover:text-violet-300"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
