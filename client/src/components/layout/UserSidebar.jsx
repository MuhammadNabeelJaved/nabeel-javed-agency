import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, MessageSquare, Bot, User, Bell,
  Zap, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';

const userNavItems = [
  { label: 'Dashboard', href: '/user-dashboard', icon: LayoutDashboard, exact: true },
  { label: 'My Projects', href: '/user-dashboard/projects', icon: FolderOpen },
  { label: 'Messages', href: '/user-dashboard/messages', icon: MessageSquare },
  { label: 'AI Assistant', href: '/user-dashboard/ai-assistant', icon: Bot },
  { label: 'Profile', href: '/user-dashboard/profile', icon: User },
  { label: 'Notifications', href: '/user-dashboard/notifications', icon: Bell },
];

export default function UserSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-card/80 backdrop-blur-xl border-r border-border overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col leading-none whitespace-nowrap">
                <span className="text-sm font-black tracking-tight text-blue-400">NABEEL</span>
                <span className="text-[10px] text-muted-foreground tracking-widest">CLIENT PORTAL</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 no-scrollbar">
        {userNavItems.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  active ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="activeUserSidebarItem"
                    className="absolute inset-0 bg-blue-500/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon className="h-5 w-5 shrink-0 relative z-10" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium relative z-10 overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-popover border border-border rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => navigate('/login')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
