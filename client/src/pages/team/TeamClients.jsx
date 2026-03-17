import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FolderOpen, Mail, Phone, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const clients = [
  { id: 1, name: 'Marcus Chen', company: 'TechCorp Inc.', email: 'marcus@techcorp.com', phone: '+1 555-0101', projects: 3, status: 'active', color: 'bg-violet-500', initial: 'TC' },
  { id: 2, name: 'Sophia Williams', company: 'Bloom Studio', email: 'sophia@bloomstudio.io', phone: '+1 555-0102', projects: 2, status: 'active', color: 'bg-emerald-500', initial: 'BS' },
  { id: 3, name: 'James Porter', company: 'NovaMart', email: 'james@novamart.com', phone: '+1 555-0103', projects: 1, status: 'completed', color: 'bg-sky-500', initial: 'NM' },
  { id: 4, name: 'Priya Patel', company: 'StartupXYZ', email: 'priya@startupxyz.co', phone: '+1 555-0104', projects: 1, status: 'active', color: 'bg-amber-500', initial: 'SX' },
  { id: 5, name: 'Lucas Martin', company: 'GreenLeaf Co.', email: 'lucas@greenleaf.org', phone: '+1 555-0105', projects: 1, status: 'on-hold', color: 'bg-teal-500', initial: 'GL' },
  { id: 6, name: 'Aisha Johnson', company: 'DataFlow Ltd.', email: 'aisha@dataflow.ai', phone: '+1 555-0106', projects: 2, status: 'active', color: 'bg-rose-500', initial: 'DF' },
  { id: 7, name: 'Ryan O\'Brien', company: 'Summit Group', email: 'ryan@summitgroup.com', phone: '+1 555-0107', projects: 1, status: 'completed', color: 'bg-pink-500', initial: 'SG' },
  { id: 8, name: 'Yuki Tanaka', company: 'CloudBase Inc.', email: 'yuki@cloudbase.dev', phone: '+1 555-0108', projects: 1, status: 'on-hold', color: 'bg-indigo-500', initial: 'CB' },
];

const statusConfig = {
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'info', label: 'Completed' },
  'on-hold': { variant: 'warning', label: 'On Hold' },
};

const filters = ['All', 'Active', 'Completed', 'On Hold'];

export default function TeamClients() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  const filtered = clients.filter((c) => {
    const matchFilter = activeFilter === 'All' || c.status === activeFilter.toLowerCase().replace(' ', '-');
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-white/50 mt-0.5">{filtered.length} clients</p>
        </div>
        <Button variant="glow" className="self-start gap-2">
          <Users className="w-4 h-4" /> Add Client
        </Button>
      </motion.div>

      {/* Search + Filters */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients or companies..."
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

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card
                className="bg-white/[0.04] border-white/10 hover:border-white/20 cursor-pointer group transition-all"
                onClick={() => navigate(`/team/clients/${client.id}`)}
              >
                <CardContent className="p-5">
                  {/* Logo + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm', client.color)}>
                      {client.initial}
                    </div>
                    <Badge variant={statusConfig[client.status].variant} className="text-xs">
                      {statusConfig[client.status].label}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 mb-4">
                    <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{client.name}</h3>
                    <p className="text-sm text-white/50">{client.company}</p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Phone className="w-3 h-3" />
                      <span>{client.phone}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{client.projects} project{client.projects !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-16">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No clients found.</p>
        </motion.div>
      )}
    </div>
  );
}
