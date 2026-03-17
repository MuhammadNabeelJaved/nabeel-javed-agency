import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Briefcase, Zap, TicketCheck, TrendingUp, TrendingDown,
  Save, Mail, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

const revenueData = [
  { month: 'Oct', revenue: 32000 },
  { month: 'Nov', revenue: 41000 },
  { month: 'Dec', revenue: 38000 },
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 42000 },
  { month: 'Mar', revenue: 48500 },
];

const mockProjects = [
  { id: 1, name: 'E-Commerce Platform', client: 'TechCorp', status: 'active', progress: 75 },
  { id: 2, name: 'Mobile Banking App', client: 'FinBank', status: 'active', progress: 45 },
  { id: 3, name: 'AI Dashboard', client: 'DataSci Inc', status: 'review', progress: 90 },
  { id: 4, name: 'SaaS CRM System', client: 'SalesForce Pro', status: 'active', progress: 30 },
  { id: 5, name: 'Portfolio Website', client: 'Creative Studio', status: 'completed', progress: 100 },
];

const mockMessages = [
  { id: 1, name: 'Sarah Johnson', subject: 'Project Inquiry', preview: 'Hi, I wanted to discuss a new web project...', time: '2m ago' },
  { id: 2, name: 'Mike Chen', subject: 'Support Request', preview: 'We are experiencing some issues with the...', time: '1h ago' },
  { id: 3, name: 'Emma Davis', subject: 'Partnership Proposal', preview: 'I represent a digital agency looking to...', time: '3h ago' },
];

const statCards = [
  {
    title: 'Total Revenue', value: '$48,500', trend: '+12.5%', up: true,
    icon: DollarSign, color: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-400',
  },
  {
    title: 'Active Projects', value: '12', trend: '+2', up: true,
    icon: Briefcase, color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400',
  },
  {
    title: 'AI Tokens Used', value: '2.4M', trend: '-5%', up: false,
    icon: Zap, color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400',
  },
  {
    title: 'Open Tickets', value: '7', trend: '+3', up: false,
    icon: TicketCheck, color: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-400',
  },
];

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-violet-400 font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardHome() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [heroForm, setHeroForm] = useState({
    title: 'We Build Digital',
    subtitle: 'Transform your vision into stunning digital reality. We craft high-performance web applications.',
    primaryCta: 'Start Your Project',
    secondaryCta: 'View Our Work',
  });

  const handleHeroSave = () => {
    toast.success('Hero content saved successfully!');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">Good morning, Admin 👋</h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div
            key={card.title}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`bg-gradient-to-br ${card.color} border-white/10 backdrop-blur-sm`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-1">{card.title}</p>
                    <p className="text-white text-2xl font-bold">{card.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {card.up
                        ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                        : <TrendingDown className="w-3 h-3 text-rose-400" />
                      }
                      <span className={`text-xs font-medium ${card.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {card.trend}
                      </span>
                      <span className="text-gray-500 text-xs">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-white/5 ${card.iconColor}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue Chart + Hero Form */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">Quick Edit Hero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Heading</label>
              <Input
                value={heroForm.title}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-sm h-8"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Subtitle</label>
              <Textarea
                value={heroForm.subtitle}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Primary CTA</label>
                <Input
                  value={heroForm.primaryCta}
                  onChange={(e) => setHeroForm({ ...heroForm, primaryCta: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-xs h-8"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Secondary CTA</label>
                <Input
                  value={heroForm.secondaryCta}
                  onChange={(e) => setHeroForm({ ...heroForm, secondaryCta: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-xs h-8"
                />
              </div>
            </div>
            <Button onClick={handleHeroSave} variant="glow" size="sm" className="w-full gap-2">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects + Messages */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base">Active Projects</CardTitle>
            <Button variant="ghost" size="sm" className="text-violet-400 text-xs h-7">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium truncate">{project.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ml-2 shrink-0 ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-1.5">{project.client}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs w-8 text-right">{project.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-base">Recent Messages</CardTitle>
            <Button variant="ghost" size="sm" className="text-violet-400 text-xs h-7">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMessages.map((msg) => (
              <motion.div
                key={msg.id}
                whileHover={{ x: 4 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {msg.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{msg.name}</span>
                    <span className="text-gray-500 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">{msg.subject}</p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{msg.preview}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
              </motion.div>
            ))}
            <div className="pt-1">
              <Button variant="outline" size="sm" className="w-full border-white/10 text-gray-400 hover:text-white gap-2">
                <Mail className="w-3.5 h-3.5" /> Open Inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
