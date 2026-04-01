/**
 * BulkActionBar — floating action bar shown when multiple items are selected.
 *
 * Renders via a portal at document.body so it floats above all content.
 * Disappears when count === 0.
 *
 * Usage:
 *   <BulkActionBar
 *     count={bulk.count}
 *     onClear={bulk.clear}
 *     actions={[
 *       { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: handleBulkDelete, loading: deleting },
 *       { label: 'Activate', icon: CheckCircle, onClick: handleBulkActivate },
 *     ]}
 *   />
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface BulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive';
}

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
  itemLabel?: string;
}

export function BulkActionBar({ count, onClear, actions, itemLabel = 'item' }: BulkActionBarProps) {
  const portal = ReactDOM.createPortal(
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="bulk-bar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990]"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 backdrop-blur-xl">
            {/* Count badge */}
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <span className="h-6 min-w-[24px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {count}
              </span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {count === 1 ? `1 ${itemLabel} selected` : `${count} ${itemLabel}s selected`}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {actions.map((action, i) => {
                const Icon = action.icon;
                const isDestructive = action.variant === 'destructive';
                return (
                  <button
                    key={i}
                    onClick={action.onClick}
                    disabled={action.loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${isDestructive
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                        : 'bg-muted text-foreground hover:bg-accent border border-border'
                      }`}
                  >
                    {action.loading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : Icon ? <Icon className="h-3.5 w-3.5" /> : null
                    }
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Clear selection */}
            <button
              onClick={onClear}
              className="ml-1 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return <>{portal}</>;
}
