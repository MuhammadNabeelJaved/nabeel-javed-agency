import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, MailOpen, Trash2, Reply, Clock, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

const initialMessages = [
  {
    id: 1, name: 'Sarah Johnson', email: 'sarah.j@techcorp.com',
    subject: 'New E-Commerce Project Inquiry', status: 'unread',
    message: 'Hi, I wanted to discuss a new web project for our company. We are looking for a full-featured e-commerce platform with AI recommendations. Our budget is around $50k and we would like to launch in 3 months. Could we schedule a call to discuss further?',
    timestamp: '2024-03-17 09:15',
  },
  {
    id: 2, name: 'Mike Chen', email: 'mike@finbank.io',
    subject: 'Mobile App Support Request', status: 'unread',
    message: 'We are experiencing some issues with the payment gateway integration on the mobile banking app you built for us. Users are reporting intermittent failures during checkout. Could you please look into this urgently?',
    timestamp: '2024-03-17 08:42',
  },
  {
    id: 3, name: 'Emma Davis', email: 'emma@creativestudio.co',
    subject: 'Partnership Proposal', status: 'unread',
    message: 'I represent a digital agency looking to partner with your team on larger projects. We have capacity for frontend work but need backend and AI expertise. Would love to explore a white-label partnership arrangement.',
    timestamp: '2024-03-16 15:30',
  },
  {
    id: 4, name: 'Robert Kim', email: 'r.kim@datasci.inc',
    subject: 'AI Dashboard Feedback', status: 'read',
    message: 'The AI dashboard is looking fantastic! Our team is really impressed with the real-time analytics and the visualization components. A few minor tweaks we would like: can we add export to PDF and a dark/light toggle? Overall excellent work!',
    timestamp: '2024-03-16 11:00',
  },
  {
    id: 5, name: 'Lisa Park', email: 'lisa.park@ventures.com',
    subject: 'Investment & Scaling Discussion', status: 'read',
    message: 'We have been following your agency\'s portfolio and are impressed by the quality and variety of projects. We are exploring investment opportunities in tech agencies and would like to discuss potential growth plans and your vision for the next 2-3 years.',
    timestamp: '2024-03-15 16:20',
  },
  {
    id: 6, name: 'James Wilson', email: 'jwilson@startup.xyz',
    subject: 'MVP Development Quote', status: 'read',
    message: 'We are a seed-stage startup looking to build our MVP. The product is a SaaS tool for HR teams to manage performance reviews using AI. We need a quote for a full-stack build with authentication, dashboard, and AI features. Timeline: 8 weeks.',
    timestamp: '2024-03-15 10:05',
  },
];

export default function Messages() {
  const [messages, setMessages] = useState(initialMessages);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');

  const filtered = messages.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    replied: 2,
  };

  const handleSelect = (msg) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id ? { ...m, status: 'read' } : m)
      );
    }
  };

  const handleDelete = (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Message deleted');
  };

  const handleReply = () => {
    if (!reply.trim()) return;
    toast.success(`Reply sent to ${selected?.name}`);
    setReply('');
  };

  const handleMarkRead = (id) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'read' } : m));
    toast.success('Marked as read');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 text-sm mt-1">Manage contact form submissions and inquiries</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Unread', value: stats.unread, color: 'text-violet-400' },
            { label: 'Replied', value: stats.replied, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Message List */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm flex flex-col overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filtered.map((msg) => (
              <motion.div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                whileHover={{ x: 2 }}
                className={`px-4 py-3 cursor-pointer border-b border-white/5 transition-colors ${
                  selected?.id === msg.id ? 'bg-violet-500/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {msg.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${msg.status === 'unread' ? 'text-white' : 'text-gray-400'}`}>
                        {msg.name}
                      </span>
                      <span className="text-gray-600 text-xs shrink-0">{msg.timestamp.split(' ')[1]}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${msg.status === 'unread' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-gray-600 text-xs truncate mt-0.5">{msg.message}</p>
                  </div>
                  {msg.status === 'unread' && (
                    <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-2" />
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col h-full"
              >
                <CardHeader className="border-b border-white/10 shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-base">{selected.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-gray-300 text-sm font-medium">{selected.name}</span>
                        <span className="text-gray-500 text-sm">·</span>
                        <span className="text-gray-500 text-sm">{selected.email}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-600 text-xs">{selected.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleMarkRead(selected.id)}
                        className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleDelete(selected.id)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto py-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-300 text-sm leading-relaxed">{selected.message}</p>
                  </div>
                </CardContent>

                <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Reply className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-sm">Reply to {selected.name}</span>
                  </div>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Write your reply to ${selected.name}...`}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none text-sm"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleReply} variant="glow" size="sm" className="gap-2">
                      <Reply className="w-3.5 h-3.5" /> Send Reply
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <MailOpen className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Select a message</p>
                <p className="text-gray-600 text-sm mt-1">Click a message from the list to read it</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
