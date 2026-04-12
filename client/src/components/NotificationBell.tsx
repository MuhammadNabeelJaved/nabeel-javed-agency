/**
 * NotificationBell
 * Reusable bell icon with live unread badge + dropdown list.
 * Driven by useNotifications hook (socket + REST).
 * Used in DashboardLayout, UserDashboardLayout, TeamDashboardLayout.
 */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, X, CheckCheck, FolderOpen, UserCheck, UserX,
    MessageSquare, Paperclip, ClipboardList, RefreshCw, Info,
    TicketCheck, Briefcase, FileBox, UserPlus, Reply,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
    notificationsRoute: string;
    chatRoute?: string;
}

// ─── Per-type config ────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    // Projects
    project_accepted:          { icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    project_rejected:          { icon: UserX,         color: 'text-red-500',     bg: 'bg-red-500/10'     },
    project_assigned:          { icon: FolderOpen,    color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
    project_submitted:         { icon: FolderOpen,    color: 'text-violet-500',  bg: 'bg-violet-500/10'  },
    status_updated:            { icon: RefreshCw,     color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
    // Tasks & chat
    task_assigned:             { icon: ClipboardList, color: 'text-sky-500',     bg: 'bg-sky-500/10'     },
    file_received:             { icon: Paperclip,     color: 'text-purple-500',  bg: 'bg-purple-500/10'  },
    message:                   { icon: MessageSquare, color: 'text-primary',     bg: 'bg-primary/10'     },
    // Support tickets
    ticket_submitted:          { icon: TicketCheck,   color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
    ticket_reply:              { icon: Reply,         color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
    ticket_status_updated:     { icon: RefreshCw,     color: 'text-teal-500',    bg: 'bg-teal-500/10'    },
    // Job applications
    application_received:      { icon: Briefcase,     color: 'text-indigo-500',  bg: 'bg-indigo-500/10'  },
    application_status_updated:{ icon: Briefcase,     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    // Resources & users
    resource_added:            { icon: FileBox,       color: 'text-cyan-500',    bg: 'bg-cyan-500/10'    },
    user_registered:           { icon: UserPlus,      color: 'text-violet-500',  bg: 'bg-violet-500/10'  },
};

const DEFAULT_CONFIG = { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' };

function formatTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000)          return 'Just now';
    if (diff < 3_600_000)       return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)      return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 7 * 86_400_000)  return `${Math.floor(diff / 86_400_000)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Map each notification type to a dashboard-relative path to navigate to on click */
function getNavPath(type: string, payload: Record<string, unknown>, chatRoute?: string): string | null {
    switch (type) {
        case 'message':
        case 'file_received':
            return chatRoute && payload?.conversationId
                ? `${chatRoute}?convoId=${payload.conversationId as string}${payload.messageId ? `&messageId=${payload.messageId as string}` : ''}`
                : null;
        case 'ticket_submitted':
        case 'ticket_reply':
        case 'ticket_status_updated':
            return '/admin/support';
        case 'application_received':
            return '/admin/job-applications';
        case 'application_status_updated':
            return '/user-dashboard/applied-jobs';
        case 'resource_added':
            return '/team/resources';
        case 'user_registered':
            return '/admin/team';
        case 'project_accepted':
        case 'project_rejected':
        case 'project_submitted':
        case 'status_updated':
            return '/user-dashboard/projects';
        case 'project_assigned':
            return '/team/projects';
        case 'task_assigned':
            return '/team/tasks';
        default:
            return null;
    }
}

export function NotificationBell({ notificationsRoute, chatRoute }: NotificationBellProps) {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ enableToast: false });
    const [open, setOpen] = React.useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const recent = notifications.slice(0, 8);

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none"
                aria-label="Notifications"
            >
                <Bell className={`h-5 w-5 transition-colors ${open ? 'text-primary' : ''}`} />

                {/* Unread badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center shadow-lg ring-2 ring-background"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-muted/20">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bell className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground leading-tight">Notifications</p>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        title="Mark all as read"
                                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notification list */}
                        <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-border/30">
                            {recent.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Bell className="h-6 w-6 opacity-30" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">No notifications yet</p>
                                        <p className="text-xs opacity-60 mt-0.5">We'll let you know when something happens</p>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {recent.map((notif, i) => {
                                        const cfg = TYPE_CONFIG[notif.type] ?? DEFAULT_CONFIG;
                                        const Icon = cfg.icon;

                                        return (
                                            <motion.div
                                                key={notif._id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => {
                                                    if (!notif.isRead) markAsRead(notif._id);
                                                    const path = getNavPath(notif.type, notif.payload, chatRoute);
                                                    if (path) { setOpen(false); navigate(path); }
                                                }}
                                                className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150
                                                    ${!notif.isRead
                                                        ? 'bg-primary/[0.04] hover:bg-primary/[0.07]'
                                                        : 'hover:bg-muted/40'
                                                    }`}
                                            >
                                                {/* Unread stripe */}
                                                {!notif.isRead && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-primary" />
                                                )}

                                                {/* Icon */}
                                                <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm leading-snug font-medium truncate ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                </div>

                                                {/* Unread dot */}
                                                {!notif.isRead && (
                                                    <div className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {recent.length > 0 && (
                            <div className="px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                                <p className="text-[11px] text-muted-foreground">
                                    Showing {recent.length} of {notifications.length}
                                </p>
                                <button
                                    onClick={() => { setOpen(false); navigate(notificationsRoute); }}
                                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
                                >
                                    View all
                                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
