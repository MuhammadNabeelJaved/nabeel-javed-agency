import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, Briefcase, Settings, DollarSign, Check, Trash2, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const typeConfig = {
  message: { icon: Mail, color: 'text-violet-400', bg: 'bg-violet-500/20' },
  project: { icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  system: { icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  billing: { icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-500/20' },
};

const initialNotifications = [
  { id: 1, type: 'message', title: 'New message from Sarah Johnson', description: 'Inquiring about the e-commerce project proposal.', time: '2 minutes ago', read: false },
  { id: 2, type: 'project', title: 'Project milestone reached', description: '"AI Dashboard" has reached 90% completion.', time: '1 hour ago', read: false },
  { id: 3, type: 'billing', title: 'Invoice payment received', description: 'TechCorp Inc paid INV-001 for $12,500.', time: '3 hours ago', read: false },
  { id: 4, type: 'system', title: 'System update available', description: 'Version 2.4.1 is ready to install.', time: '5 hours ago', read: false },
  { id: 5, type: 'message', title: 'Reply from Mike Chen', description: 'Re: Mobile App Support Request – thanks for the quick fix!', time: '1 day ago', read: true },
  { id: 6, type: 'project', title: 'New project assigned', description: 'HR Management Platform has been assigned to your team.', time: '1 day ago', read: true },
  { id: 7, type: 'billing', title: 'Invoice INV-004 overdue', description: 'Creative Studio invoice is 11 days overdue.', time: '2 days ago', read: true },
  { id: 8, type: 'system', title: 'Scheduled backup completed', description: 'Database backup completed successfully at 03:00 AM.', time: '2 days ago', read: true },
  { id: 9, type: 'message', title: 'New contact form submission', description: 'James Wilson submitted a project inquiry.', time: '3 days ago', read: true },
  { id: 10, type: 'project', title: 'Client feedback received', description: 'FinBank left feedback on the Mobile Banking App.', time: '3 days ago', read: true },
];

const filters = ['All', 'Unread', 'Read'];

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('All');

  const filtered = notifications.filter((n) => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllRead} variant="outline" size="sm"
              className="border-white/10 text-gray-400 hover:text-white gap-2">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
          <Button onClick={clearAll} variant="ghost" size="sm"
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-400">No notifications</p>
              </div>
            ) : (
              filtered.map((notif, i) => {
                const cfg = typeConfig[notif.type];
                const IconComp = cfg.icon;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors group ${
                      !notif.read ? 'bg-violet-500/5' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <IconComp className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-medium ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                            {notif.title}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{notif.description}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-1.5">{notif.time}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.read && (
                        <Button variant="ghost" size="icon" onClick={() => markRead(notif.id)}
                          className="h-7 w-7 text-gray-500 hover:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteNotification(notif.id)}
                        className="h-7 w-7 text-gray-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
