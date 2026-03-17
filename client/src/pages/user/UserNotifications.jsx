import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, FolderOpen, MessageSquare, DollarSign, Flag,
  Settings, CheckCheck, Trash2, X, Filter
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

const typeConfig = {
  project: { icon: FolderOpen, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Project' },
  message: { icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Message' },
  invoice: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Invoice' },
  milestone: { icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Milestone' },
  system: { icon: Settings, color: 'text-white/50', bg: 'bg-white/10', label: 'System' },
};

const initialNotifications = [
  // Today
  { id: 1, type: 'message', title: 'New message from Alex Chen', body: 'The prototype for Horizon SaaS is ready for your review!', time: '30 min ago', group: 'Today', read: false },
  { id: 2, type: 'project', title: 'Project status updated', body: 'Brand Identity Refresh moved to "Review Needed" — your feedback is requested.', time: '1 hour ago', group: 'Today', read: false },
  { id: 3, type: 'milestone', title: 'Milestone reached!', body: '"Design System Complete" milestone was hit on Horizon SaaS Platform.', time: '3 hours ago', group: 'Today', read: false },
  // Yesterday
  { id: 4, type: 'invoice', title: 'Invoice ready', body: 'Invoice #INV-2026-12 for $8,500 is ready to view and download.', time: 'Yesterday 4:00 PM', group: 'Yesterday', read: true },
  { id: 5, type: 'message', title: 'New message from Design Team', body: 'Color palette options are ready. We\'d love your feedback before moving forward.', time: 'Yesterday 2:30 PM', group: 'Yesterday', read: true },
  { id: 6, type: 'project', title: 'Project update', body: 'Mobile App MVP planning phase has officially started. Kick-off call scheduled.', time: 'Yesterday 10:00 AM', group: 'Yesterday', read: true },
  // This Week
  { id: 7, type: 'milestone', title: 'Upcoming milestone', body: '"Final Prototype Delivery" for Horizon SaaS is due on March 25.', time: 'Mar 15', group: 'This Week', read: true },
  { id: 8, type: 'invoice', title: 'Payment confirmed', body: 'Payment of $12,000 for Invoice #INV-2026-11 has been received. Thank you!', time: 'Mar 14', group: 'This Week', read: true },
  { id: 9, type: 'project', title: 'Files uploaded', body: '3 new design files were added to your Brand Identity project.', time: 'Mar 13', group: 'This Week', read: true },
  { id: 10, type: 'system', title: 'Portal update', body: 'The client portal has been updated with new features. Check out the changelog.', time: 'Mar 12', group: 'This Week', read: true },
  { id: 11, type: 'message', title: 'New message from Support', body: 'The Figma access issue has been resolved. You should now have full access.', time: 'Mar 12', group: 'This Week', read: true },
  { id: 12, type: 'milestone', title: 'Milestone complete', body: '"User Research & Discovery" was completed on Mobile App MVP.', time: 'Mar 11', group: 'This Week', read: true },
];

const groups = ['Today', 'Yesterday', 'This Week'];
const typeFilters = ['All', 'Project', 'Message', 'Invoice', 'Milestone', 'System'];

export default function UserNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [typeFilter, setTypeFilter] = useState('All');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) =>
    typeFilter === 'All' || n.type === typeFilter.toLowerCase()
  );

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const dismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

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

      {/* Type Filters */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-white/30 self-center flex-shrink-0" />
        {typeFilters.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              typeFilter === f
                ? 'bg-violet-600 text-white'
                : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/10'
            )}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Notifications */}
      {filtered.length === 0 ? (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-20">
          <Bell className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 font-medium">No notifications</p>
          <p className="text-white/25 text-sm mt-1">You're all caught up!</p>
        </motion.div>
      ) : (
        groups.map((group) => {
          const groupItems = filtered.filter((n) => n.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group} className="space-y-2">
              <motion.p variants={fadeIn} initial="hidden" animate="visible" className="text-xs font-semibold text-white/30 uppercase tracking-wider">
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
                      <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                        <config.icon className={cn('w-4 h-4', config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-medium', notif.read ? 'text-white/70' : 'text-white')}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notif.read && <div className="w-2 h-2 rounded-full bg-violet-400" />}
                            <Badge variant="outline" className="text-[10px] px-1.5 border-white/10 text-white/30">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[10px] text-white/25 mt-1.5">{notif.time}</p>
                      </div>

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
