import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckSquare, FolderOpen, Clock, AtSign, ThumbsUp,
  CheckCheck, Trash2, X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

const typeConfig = {
  task: { icon: CheckSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  project: { icon: FolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  deadline: { icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  mention: { icon: AtSign, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  approval: { icon: ThumbsUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const initialNotifications = [
  // Today
  { id: 1, type: 'task', title: 'New task assigned', body: 'Carlos assigned you "Accessibility audit" on Horizon SaaS', time: '10 min ago', group: 'Today', read: false },
  { id: 2, type: 'mention', title: 'You were mentioned', body: 'Beth mentioned you in #design: "...@alex can you check this?"', time: '35 min ago', group: 'Today', read: false },
  { id: 3, type: 'approval', title: 'Design approved!', body: 'Client approved the "Brand Identity" final deliverables', time: '1 hour ago', group: 'Today', read: false },
  { id: 4, type: 'project', title: 'Project updated', body: 'Horizon SaaS milestone "Beta Ready" marked complete', time: '2 hours ago', group: 'Today', read: true },
  { id: 5, type: 'deadline', title: 'Deadline approaching', body: '"Homepage wireframes" is due in 3 days', time: '3 hours ago', group: 'Today', read: true },
  // Yesterday
  { id: 6, type: 'task', title: 'Task completed', body: '"Color palette finalization" was marked done by Priya', time: 'Yesterday 4:30 PM', group: 'Yesterday', read: true },
  { id: 7, type: 'mention', title: 'You were mentioned', body: 'Carlos mentioned you in the engineering channel', time: 'Yesterday 2:15 PM', group: 'Yesterday', read: true },
  { id: 8, type: 'project', title: 'New project created', body: 'Admin created project "API Integration Suite" and added you', time: 'Yesterday 10:00 AM', group: 'Yesterday', read: true },
  // This Week
  { id: 9, type: 'approval', title: 'Review requested', body: 'Priya requested your review on the mobile wireframes', time: 'Mar 15', group: 'This Week', read: true },
  { id: 10, type: 'deadline', title: 'Milestone reached', body: 'Project "E-commerce Redesign" hit 90% completion', time: 'Mar 14', group: 'This Week', read: true },
  { id: 11, type: 'task', title: 'Task reassigned', body: '"API documentation" has been reassigned to you by Carlos', time: 'Mar 13', group: 'This Week', read: true },
  { id: 12, type: 'project', title: 'Client feedback received', body: 'TechCorp left 8 comments on the latest Figma prototype', time: 'Mar 13', group: 'This Week', read: true },
  { id: 13, type: 'mention', title: 'You were mentioned', body: 'Alex mentioned you in a project note on Brand Identity', time: 'Mar 12', group: 'This Week', read: true },
  { id: 14, type: 'deadline', title: 'Upcoming deadline', body: '"Dashboard Analytics" delivery is in 5 days', time: 'Mar 12', group: 'This Week', read: true },
  { id: 15, type: 'approval', title: 'Feedback shared', body: 'Beth shared feedback on your UI proposal document', time: 'Mar 11', group: 'This Week', read: true },
];

const groups = ['Today', 'Yesterday', 'This Week'];

export default function TeamNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="purple" className="px-2 py-0.5">{unreadCount} new</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="text-white/50 hover:text-white text-xs gap-1.5 h-8">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={clearAll} className="text-white/30 hover:text-rose-400 text-xs gap-1.5 h-8">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </Button>
        </div>
      </motion.div>

      {/* Notification Groups */}
      {notifications.length === 0 ? (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-20">
          <Bell className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 font-medium">All caught up!</p>
          <p className="text-white/25 text-sm mt-1">No notifications to show.</p>
        </motion.div>
      ) : (
        groups.map((group) => {
          const groupItems = notifications.filter((n) => n.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="space-y-2">
              <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="text-xs font-semibold text-white/30 uppercase tracking-wider"
              >
                {group}
              </motion.p>
              <AnimatePresence>
                {groupItems.map((notif, i) => {
                  const config = typeConfig[notif.type];
                  return (
                    <motion.div
                      key={notif.id}
                      custom={i}
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      layout
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-2xl border transition-all group cursor-pointer',
                        notif.read
                          ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                          : 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/30'
                      )}
                      onClick={() => markRead(notif.id)}
                    >
                      {/* Icon */}
                      <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                        <config.icon className={cn('w-4 h-4', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-medium', notif.read ? 'text-white/70' : 'text-white')}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[10px] text-white/25 mt-1.5">{notif.time}</p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
