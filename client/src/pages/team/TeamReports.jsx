import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, Zap, Download, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const weekData = [
  { day: 'Mon', hours: 7.5, tasks: 4 },
  { day: 'Tue', hours: 8.0, tasks: 6 },
  { day: 'Wed', hours: 6.5, tasks: 3 },
  { day: 'Thu', hours: 8.5, tasks: 7 },
  { day: 'Fri', hours: 6.0, tasks: 5 },
];

const monthData = [
  { week: 'W1', hours: 38, tasks: 22 },
  { week: 'W2', hours: 42, tasks: 28 },
  { week: 'W3', hours: 36, tasks: 19 },
  { week: 'W4', hours: 44, tasks: 31 },
];

const quarterData = [
  { month: 'Jan', hours: 160, tasks: 95 },
  { month: 'Feb', hours: 148, tasks: 87 },
  { month: 'Mar', hours: 170, tasks: 102 },
];

const completionWeek = [
  { day: 'Mon', rate: 80 }, { day: 'Tue', rate: 92 }, { day: 'Wed', rate: 75 },
  { day: 'Thu', rate: 88 }, { day: 'Fri', rate: 95 },
];

const completionMonth = [
  { week: 'W1', rate: 82 }, { week: 'W2', rate: 88 }, { week: 'W3', rate: 76 }, { week: 'W4', rate: 91 },
];

const completionQuarter = [
  { month: 'Jan', rate: 84 }, { month: 'Feb', rate: 79 }, { month: 'Mar', rate: 90 },
];

const workloadData = [
  { name: 'Horizon SaaS', value: 35, color: '#8b5cf6' },
  { name: 'Brand Identity', value: 20, color: '#10b981' },
  { name: 'E-commerce', value: 25, color: '#f59e0b' },
  { name: 'Mobile App', value: 15, color: '#06b6d4' },
  { name: 'Other', value: 5, color: '#6b7280' },
];

const workItems = [
  { project: 'Horizon SaaS', task: 'Prototype — Onboarding', hours: 6.5, date: 'Mar 17', status: 'done' },
  { project: 'Brand Identity', task: 'Color palette review', hours: 2.0, date: 'Mar 17', status: 'done' },
  { project: 'Horizon SaaS', task: 'Component library', hours: 4.0, date: 'Mar 16', status: 'in-progress' },
  { project: 'E-commerce', task: 'Mobile breakpoints', hours: 3.5, date: 'Mar 15', status: 'done' },
  { project: 'Mobile App', task: 'User research report', hours: 5.0, date: 'Mar 14', status: 'done' },
  { project: 'Horizon SaaS', task: 'Design system tokens', hours: 3.0, date: 'Mar 13', status: 'done' },
];

const statCards = [
  { label: 'Total Hours', value: '36.5h', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10', sub: 'This week' },
  { label: 'Tasks Completed', value: '25', icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: 'This week' },
  { label: 'Efficiency Score', value: '94%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: '+2% vs last week' },
];

const ranges = ['This Week', 'This Month', 'This Quarter'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs text-white shadow-xl">
        <p className="font-semibold mb-1 text-white/70">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'Completion Rate' ? '%' : 'h'}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TeamReports() {
  const [range, setRange] = useState('This Week');

  const barData = range === 'This Week' ? weekData : range === 'This Month' ? monthData : quarterData;
  const xKey = range === 'This Week' ? 'day' : range === 'This Month' ? 'week' : 'month';
  const lineData = range === 'This Week' ? completionWeek : range === 'This Month' ? completionMonth : completionQuarter;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-white/50 mt-0.5">Your personal performance metrics</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                range === r
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white border border-white/10'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white/[0.04] border-white/10">
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Project (Bar) */}
        <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-400" /> Hours Logged
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" name="Hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Task Completion Rate (Line) */}
        <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">Task Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rate" name="Completion Rate" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Pie */}
        <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
          <Card className="bg-white/[0.04] border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white/80">Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={workloadData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {workloadData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {workloadData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white/60">{item.name}</span>
                    </div>
                    <span className="text-white/40">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Work Items Table */}
        <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/80">Work Log</CardTitle>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1.5 border-white/10 text-white/50 hover:text-white">
                  <Download className="w-3 h-3" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs text-white/40 pb-2 font-medium">Task</th>
                      <th className="text-left text-xs text-white/40 pb-2 font-medium">Project</th>
                      <th className="text-right text-xs text-white/40 pb-2 font-medium">Hours</th>
                      <th className="text-right text-xs text-white/40 pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {workItems.map((item, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 text-white/70 pr-4">{item.task}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-full whitespace-nowrap">{item.project}</span>
                        </td>
                        <td className="py-2.5 text-right text-violet-400 font-medium">{item.hours}h</td>
                        <td className="py-2.5 text-right text-white/30 text-xs">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
