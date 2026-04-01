/**
 * ProfileDropdown
 * Animated dropdown that opens when the topbar profile avatar is clicked.
 * Used across Admin, Team, and User dashboard layouts.
 */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export interface ProfileMenuItem {
  label: string;
  icon: LucideIcon;
  to: string;
  /** If true, renders a divider above this item */
  divider?: boolean;
}

interface ProfileDropdownProps {
  open: boolean;
  onClose: () => void;
  items: ProfileMenuItem[];
  /** Sub-label shown under the name (role, position, etc.) */
  subLabel?: string;
}

export function ProfileDropdown({ open, onClose, items, subLabel }: ProfileDropdownProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const initials = (user?.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleNav = (to: string) => {
    navigate(to);
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-full right-0 mt-2 w-60 rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/10 z-50 overflow-hidden"
        >
          {/* Header — avatar + name + email */}
          <div className="px-4 py-3.5 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] shrink-0">
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {user?.photo && user.photo !== 'default.jpg' ? (
                  <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{initials}</span>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              {subLabel && (
                <p className="text-xs text-primary/70 capitalize truncate mt-0.5">{subLabel}</p>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {items.map((item, i) => (
              <React.Fragment key={item.to}>
                {item.divider && <div className="my-1 border-t border-border" />}
                <button
                  onClick={() => handleNav(item.to)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {item.label}
                </button>
              </React.Fragment>
            ))}

            {/* Sign out — always last */}
            <div className="my-1 border-t border-border" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
