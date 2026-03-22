/**
 * Admin Page Manager
 * Control which public pages are Active, Under Maintenance, or Coming Soon.
 */
import React, { useState } from 'react';
import {
  Globe, Wrench, Clock, CheckCircle2, Loader2, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useContent } from '../../contexts/ContentContext';
import { pageStatusApi, type PageStatusItem } from '../../api/pageStatus.api';
import { Notification } from '../../components/Notification';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    badge: 'bg-green-500/10 text-green-600 border-green-500/20',
    btn: 'bg-green-500 hover:bg-green-600 text-white',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  'coming-soon': {
    label: 'Coming Soon',
    icon: Clock,
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    btn: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PageManager() {
  const { pageStatuses, setPageStatuses } = useContent();
  const [updating, setUpdating] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showNotification = (type: 'success' | 'error', title: string, message?: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await pageStatusApi.getAll();
      setPageStatuses(res.data.data ?? []);
    } catch {
      showNotification('error', 'Failed to refresh', 'Could not load page statuses.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdate = async (page: PageStatusItem, newStatus: StatusKey) => {
    if (page.status === newStatus) return;
    setUpdating(page.key);
    try {
      const res = await pageStatusApi.update(page.key, newStatus);
      const updated = (res.data as any).data as PageStatusItem;
      setPageStatuses(prev => prev.map(p => p.key === page.key ? { ...p, status: newStatus, updatedAt: updated.updatedAt } : p));
      showNotification('success', `${page.label} → ${STATUS_CONFIG[newStatus].label}`, 'Page status updated successfully.');
    } catch (err: any) {
      showNotification('error', 'Update failed', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  };

  const activeCount = pageStatuses.filter(p => p.status === 'active').length;
  const maintenanceCount = pageStatuses.filter(p => p.status === 'maintenance').length;
  const comingSoonCount = pageStatuses.filter(p => p.status === 'coming-soon').length;

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page Manager</h2>
          <p className="text-muted-foreground mt-1">
            Control which public pages are live, under maintenance, or coming soon.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: activeCount, cfg: STATUS_CONFIG.active },
          { label: 'Maintenance', count: maintenanceCount, cfg: STATUS_CONFIG.maintenance },
          { label: 'Coming Soon', count: comingSoonCount, cfg: STATUS_CONFIG['coming-soon'] },
        ].map(({ label, count, cfg }) => {
          const Icon = cfg.icon;
          return (
            <Card key={label} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cfg.badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Admin bypass:</span> As an admin, you will always see the real page regardless of status — with a warning banner at the top. Regular visitors see the Maintenance or Coming Soon page instead.
        </p>
      </div>

      {/* ── Page Cards ── */}
      {pageStatuses.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-3" /> Loading pages...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pageStatuses.map(page => {
            const isUpdating = updating === page.key;
            const currentStatus = page.status as StatusKey;

            return (
              <Card key={page.key} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{page.label}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{page.path}{page.matchPrefix ? '/*' : ''}</p>
                      </div>
                    </div>
                    <StatusBadge status={currentStatus} />
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Set visibility for visitors:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['active', 'maintenance', 'coming-soon'] as StatusKey[]).map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const Icon = cfg.icon;
                      const isActive = currentStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleUpdate(page, s)}
                          disabled={isUpdating || isActive}
                          className={`
                            flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-medium
                            border transition-all duration-200
                            ${isActive
                              ? `${cfg.badge} ring-2 ring-offset-1 ring-current scale-[1.02] cursor-default`
                              : 'border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {isUpdating && !isActive
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Icon className="h-4 w-4" />
                          }
                          <span className="leading-none text-center">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {page.updatedAt && (
                    <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
                      Last changed: {new Date(page.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
