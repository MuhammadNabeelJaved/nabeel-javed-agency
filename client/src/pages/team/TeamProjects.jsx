import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Calendar, Users, ChevronRight, Search } from 'lucide-react';
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
  { id: 1, title: 'Horizon SaaS Platform', client: 'TechCorp Inc.', status: 'active', progress: 72, deadline: 'Apr 15, 2026', team: ['A', 'B', 'C'], color: 'bg-violet-500' },
  { id: 2, title: 'Brand Identity Refresh', client: 'Bloom Studio', status: 'active', progress: 45, deadline: 'May 1, 2026', team: ['D', 'E'], color: 'bg-emerald-500' },
  { id: 3, title: 'E-commerce Redesign', client: 'NovaMart', status: 'completed', progress: 100, deadline: 'Mar 5, 2026', team: ['A', 'F', 'G'], color: 'bg-sky-500' },
  { id: 4, title: 'Mobile App MVP', client: 'StartupXYZ', status: 'active', progress: 31, deadline: 'Jun 20, 2026', team: ['B', 'C'], color: 'bg-amber-500' },
  { id: 5, title: 'Marketing Website', client: 'GreenLeaf Co.', status: 'on-hold', progress: 60, deadline: 'TBD', team: ['H', 'I'], color: 'bg-rose-500' },
  { id: 6, title: 'Dashboard Analytics', client: 'DataFlow Ltd.', status: 'active', progress: 88, deadline: 'Mar 28, 2026', team: ['A', 'D', 'E'], color: 'bg-cyan-500' },
  { id: 7, title: 'Corporate Rebrand', client: 'Summit Group', status: 'completed', progress: 100, deadline: 'Feb 14, 2026', team: ['F', 'G'], color: 'bg-pink-500' },
  { id: 8, title: 'API Integration Suite', client: 'CloudBase Inc.', status: 'on-hold', progress: 22, deadline: 'TBD', team: ['B'], color: 'bg-indigo-500' },
];

const statusConfig = {
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'info', label: 'Completed' },
  'on-hold': { variant: 'warning', label: 'On Hold' },
};

const filters = ['All', 'Active', 'Completed', 'On Hold'];

const avatarColors = [
  'bg-violet-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

export default function TeamProjects() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = projects.filter((p) => {
    const matchesFilter =
      activeFilter === 'All' ||
      p.status === activeFilter.toLowerCase().replace(' ', '-');
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/50 mt-0.5">{filtered.length} projects found</p>
        </div>
        <Button variant="glow" className="self-start sm:self-auto gap-2">
          <FolderOpen className="w-4 h-4" /> New Project
        </Button>
      </motion.div>

      {/* Search + Filter */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients..."
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm hover:border-white/20 transition-all cursor-pointer group"
                onClick={() => navigate(`/team/projects/${project.id}`)}>
                <CardContent className="p-5 space-y-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5">{project.client}</p>
                    </div>
                    <Badge variant={statusConfig[project.status].variant} className="flex-shrink-0 text-xs">
                      {statusConfig[project.status].label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Progress</span>
                      <span className="font-medium text-white/70">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', project.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {project.team.map((member, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0a0a0f]',
                              avatarColors[idx % avatarColors.length]
                            )}
                          >
                            {member}
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition-colors ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No projects found matching your criteria.</p>
        </motion.div>
      )}
    </div>
  );
}
