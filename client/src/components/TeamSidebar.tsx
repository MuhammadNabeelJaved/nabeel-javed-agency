/**
 * Team Dashboard Sidebar
 * Supports collapse/expand toggle (persisted in localStorage).
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, BarChart2, Settings, LogOut, Bell,
  ChevronRight, Calendar, MessageSquare, Files, HelpCircle, X,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

interface TeamSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function TeamSidebar({ isOpen = false, onClose, collapsed = false, onToggleCollapse }: TeamSidebarProps) {
  const location = useLocation();
  const { isVisible } = usePageVisibility();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { chatUnreadCount } = useNotifications({ enableToast: false });

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const links = [
    { name: 'Dashboard',     path: '/team',                icon: LayoutDashboard },
    { name: 'Projects',      path: '/team/projects',       icon: FolderKanban },
    { name: 'My Tasks',      path: '/team/tasks',          icon: CheckSquare },
    { name: 'Calendar',      path: '/team/calendar',       icon: Calendar },
    { name: 'Chat',          path: '/team/chat',           icon: MessageSquare },
    { name: 'Resources',     path: '/team/resources',      icon: Files },
    { name: 'Reports',       path: '/team/reports',        icon: BarChart2 },
    { name: 'Notifications', path: '/team/notifications',  icon: Bell },
    { name: 'Settings',      path: '/team/settings',       icon: Settings },
    { name: 'Support',       path: '/team/support',        icon: HelpCircle },
  ].filter(link => isVisible(link.path));

  const showText = !collapsed;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 transition-all duration-300 flex flex-col w-72",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "sm:translate-x-0 sm:w-20",
        collapsed ? "lg:w-20" : "lg:w-72"
      )}>
        {isOpen && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 sm:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}

        {/* Logo + collapse toggle */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-3 lg:px-4 border-b border-border/50 shrink-0">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <motion.img
              src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png"
              alt="Nabeel Logo"
              className="h-9 w-auto dark:invert shrink-0"
              whileHover={{ scale: 1.08, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            />
            <AnimatePresence initial={false}>
              {showText && (
                <motion.span
                  key="logo-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden lg:block font-bold text-xl tracking-tight text-foreground overflow-hidden whitespace-nowrap"
                >
                  TEAM<span className="text-primary">DASH</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-grow py-6 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
          <AnimatePresence initial={false}>
            {showText && (
              <motion.div key="section-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 mb-3 hidden lg:block">
                <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">Team Workspace</h3>
              </motion.div>
            )}
          </AnimatePresence>

          {links.map((link, i) => {
            const Icon = link.icon;
            const isActive = link.path === '/team'
              ? location.pathname === '/team'
              : location.pathname.startsWith(link.path);

            return (
              <motion.div key={link.path} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02, duration: 0.2 }}>
                <Link to={link.path} title={link.name} className="relative group block">
                  {isActive && (
                    <>
                      <motion.div layoutId="activeTeamTab" className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20" initial={false} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                      <motion.div layoutId="activeTeamBar" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.7)]" initial={false} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                    </>
                  )}
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn("relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group-hover:bg-accent/80", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                  >
                    <div className="relative shrink-0">
                      <Icon className={cn("h-5 w-5 transition-all duration-200 group-hover:scale-110", isActive ? "drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" : "")} />
                    </div>
                    <AnimatePresence initial={false}>
                      {showText && (
                        <motion.span
                          key={`label-${link.path}`}
                          initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.18 }}
                          className="hidden lg:flex items-center font-medium text-sm flex-1 overflow-hidden whitespace-nowrap"
                        >
                          {link.name}
                          {link.path === '/team/chat' && chatUnreadCount > 0 && (
                            <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-4 w-4 opacity-40 ml-auto" />}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-border/50 mt-auto">
          <button onClick={handleLogout} title="Sign Out" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group">
            <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 group-hover:scale-110 transition-all duration-200" />
            <AnimatePresence initial={false}>
              {showText && (
                <motion.span key="signout-text" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }} className="hidden lg:block font-medium text-sm overflow-hidden whitespace-nowrap">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>
    </>
  );
}
