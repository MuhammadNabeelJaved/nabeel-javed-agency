import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, DollarSign, Activity, Clock } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

const usageData = [
  { time: '00:00', tokens: 12000 },
  { time: '04:00', tokens: 8000 },
  { time: '08:00', tokens: 45000 },
  { time: '12:00', tokens: 78000 },
  { time: '16:00', tokens: 92000 },
  { time: '20:00', tokens: 61000 },
  { time: '23:59', tokens: 38000 },
];

const aiTools = [
  { id: 1, name: 'GPT-4o', icon: '🤖', provider: 'OpenAI', tokensUsed: 1200000, tokensLimit: 2000000, cost: '$24.50', requests: 4820, color: '#10b981' },
  { id: 2, name: 'DALL-E 3', icon: '🎨', provider: 'OpenAI', tokensUsed: 340000, tokensLimit: 500000, cost: '$8.20', requests: 850, color: '#8b5cf6' },
  { id: 3, name: 'Claude 3.5', icon: '⚡', provider: 'Anthropic', tokensUsed: 680000, tokensLimit: 1000000, cost: '$12.80', requests: 2100, color: '#6366f1' },
  { id: 4, name: 'Whisper', icon: '🎙️', provider: 'OpenAI', tokensUsed: 180000, tokensLimit: 400000, cost: '$2.40', requests: 320, color: '#f59e0b' },
];

const recentRequests = [
  { id: 1, tool: 'GPT-4o', prompt: 'Generate a project proposal for e-commerce...', tokens: 1240, cost: '$0.025', time: '2m ago' },
  { id: 2, tool: 'DALL-E 3', prompt: 'Create a hero image for SaaS landing page...', tokens: 0, cost: '$0.040', time: '8m ago' },
  { id: 3, tool: 'Claude 3.5', prompt: 'Review and improve this React component code...', tokens: 3820, cost: '$0.076', time: '15m ago' },
  { id: 4, tool: 'GPT-4o', prompt: 'Write SEO-optimized blog post about web design...', tokens: 2100, cost: '$0.042', time: '22m ago' },
  { id: 5, tool: 'Whisper', prompt: 'Transcribe client meeting recording (45 min)...', tokens: 0, cost: '$0.135', time: '1h ago' },
  { id: 6, tool: 'Claude 3.5', prompt: 'Analyze user behavior data and generate insights...', tokens: 4500, cost: '$0.090', time: '2h ago' },
];

const toolColors = {
  'GPT-4o': 'text-emerald-400',
  'DALL-E 3': 'text-violet-400',
  'Claude 3.5': 'text-indigo-400',
  'Whisper': 'text-amber-400',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-violet-400 font-semibold">{payload[0].value.toLocaleString()} tokens</p>
      </div>
    );
  }
  return null;
};

export default function AITools() {
  const [apiKeys, setApiKeys] = useState({
    openai: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    anthropic: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    stability: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  });
  const [visible, setVisible] = useState({ openai: false, anthropic: false, stability: false });

  const toggleKey = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveKey = (provider) => {
    toast.success(`${provider} API key saved`);
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.substring(key.length - 4);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">AI Tools</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor AI usage and manage API integrations</p>
      </motion.div>

      {/* Header Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Tokens Used', value: '2.4M', sub: 'of 3.9M limit', icon: Zap, color: 'text-violet-400', bg: 'from-violet-500/20 to-purple-500/20' },
          { label: 'Total Cost', value: '$47.90', sub: 'this month', icon: DollarSign, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' },
          { label: 'Requests Today', value: '284', sub: '+32 vs yesterday', icon: Activity, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-white/10 backdrop-blur-sm`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                <p className="text-white text-2xl font-bold">{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-white/5 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* AI Tool Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {aiTools.map((tool) => {
          const pct = Math.round((tool.tokensUsed / tool.tokensLimit) * 100);
          return (
            <Card key={tool.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-xl">{tool.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{tool.name}</p>
                    <p className="text-gray-500 text-xs">{tool.provider}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{(tool.tokensUsed / 1000).toFixed(0)}K tokens</span>
                    <span className="text-gray-600">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: tool.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-gray-500">{tool.requests.toLocaleString()} requests</span>
                    <span style={{ color: tool.color }} className="font-semibold">{tool.cost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Usage Chart + Recent Requests */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" /> Token Usage Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usageData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone" dataKey="tokens" stroke="url(#lineGrad)"
                  strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-base">API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'openai', label: 'OpenAI' },
              { id: 'anthropic', label: 'Anthropic' },
              { id: 'stability', label: 'Stability AI' },
            ].map((k) => (
              <div key={k.id}>
                <label className="text-gray-400 text-xs mb-1.5 block">{k.label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={visible[k.id] ? 'text' : 'password'}
                      value={apiKeys[k.id]}
                      onChange={(e) => setApiKeys({ ...apiKeys, [k.id]: e.target.value })}
                      className="bg-white/5 border-white/10 text-white text-xs h-9 pr-9 font-mono"
                    />
                    <button
                      onClick={() => toggleKey(k.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {visible[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSaveKey(k.label)}
                    className="border-white/10 text-gray-400 hover:text-white h-9 text-xs">
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Requests Table */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white text-base">Recent Requests</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Tool', 'Prompt Preview', 'Tokens', 'Cost', 'Time'].map((h) => (
                    <th key={h} className="text-left text-gray-500 text-xs font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req, i) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${toolColors[req.tool] || 'text-gray-400'}`}>
                        {req.tool}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-sm truncate max-w-xs block">{req.prompt}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">{req.tokens ? req.tokens.toLocaleString() : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 text-sm font-medium">{req.cost}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-500 text-xs">{req.time}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
