import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FolderOpen, Briefcase, Tag,
  Bot, CreditCard, HeadphonesIcon, Bell, Settings, Users,
  UserCheck, Contact, Clipboard, Database, FileEdit, Zap,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'AI Tools', href: '/admin/ai-tools', icon: Bot },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard },
  { label: 'Support', href: '/admin/support', icon: HeadphonesIcon },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Team', href: '/admin/team', icon: Users },
  { label: 'Clients', href: '/admin/clients', icon: UserCheck },
  { label: 'Contacts', href: '/admin/contacts', icon: Contact },
  { label: 'Jobs', href: '/admin/jobs', icon: Clipboard },
  { label: 'Database', href: '/admin/database', icon: Database },
  { label: 'Content', href: '/admin/content-editor', icon: FileEdit },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-card/80 backdrop-blur-xl border-r border-border overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
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
                <span className="text-sm font-black tracking-tight gradient-text">NABEEL</span>
                <span className="text-[10px] text-muted-foreground tracking-widest">ADMIN</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'ml-auto p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            collapsed && 'mx-auto ml-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 no-scrollbar">
        {adminNavItems.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="activeSidebarItem"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon className={cn('h-5 w-5 shrink-0 relative z-10', active && 'text-primary')} />
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
                {/* Tooltip when collapsed */}
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

      {/* Bottom - Sign out */}
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
