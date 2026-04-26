import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Milestone,
  ChevronDown,
  Check,
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { milestonesApi, MilestoneEntry } from '../../api/milestones.api';
import { projectsApi } from '../../api/projects.api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const phaseColor: Record<string, string> = {
  Discovery: 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  Design: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
  Development: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  Testing: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Launch: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Circle size={16} className="text-muted-foreground" />,
  in_progress: <Clock size={16} className="text-blue-500 dark:text-blue-400" />,
  needs_approval: <AlertCircle size={16} className="text-amber-500 dark:text-amber-400" />,
  approved: <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />,
  rejected: <AlertCircle size={16} className="text-rose-500 dark:text-rose-400" />,
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  needs_approval: 'Needs approval',
  approved: 'Approved',
  rejected: 'Changes requested',
};

const statusTone: Record<string, string> = {
  pending: 'border-border/70 bg-muted/50 text-muted-foreground',
  in_progress: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  needs_approval: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  approved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

const ACTIVE_MILESTONE_STATUSES = ['pending', 'in_progress', 'needs_approval'];

function extractProjects(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data?.projects)) return payload.data.data.projects;
  if (Array.isArray(payload?.data?.projects)) return payload.data.projects;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  return [];
}

interface RejectDialogProps {
  milestoneTitle: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

function RejectDialog({ milestoneTitle, onConfirm, onClose }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md space-y-4 rounded-3xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-foreground">Request changes</h3>
        <p className="text-sm text-muted-foreground">
          Tell the team what changes are needed for{' '}
          <strong className="text-foreground">{milestoneTitle}</strong>.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Please describe what needs to be revised..."
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-3">
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await onConfirm(reason);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !reason.trim()}
            className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-500"
          >
            {loading ? 'Sending...' : 'Request Changes'}
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function UserMilestones() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Record<string, MilestoneEntry[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAllMilestones, setLoadingAllMilestones] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MilestoneEntry | null>(null);

  useEffect(() => {
    projectsApi
      .getAll()
      .then((res: any) => {
        const list = extractProjects(res);
        setProjects(list.filter((p: any) => p.status === 'approved' || p.status === 'completed'));
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (projects.length === 0) {
      setMilestones({});
      setLoadingAllMilestones(false);
      return;
    }

    let cancelled = false;
    setLoadingAllMilestones(true);

    Promise.all(
      projects.map(async (project) => [project._id, await milestonesApi.getForProject(project._id)] as const)
    )
      .then((entries) => {
        if (cancelled) return;
        setMilestones(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load milestones');
      })
      .finally(() => {
        if (!cancelled) setLoadingAllMilestones(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const loadMilestones = useCallback(
    async (projectId: string) => {
      if (milestones[projectId]) return milestones[projectId];
      setLoadingMilestones(projectId);
      try {
        const data = await milestonesApi.getForProject(projectId);
        setMilestones((prev) => ({ ...prev, [projectId]: data }));
        return data;
      } catch {
        toast.error('Failed to load milestones');
        return [];
      } finally {
        setLoadingMilestones(null);
      }
    },
    [milestones]
  );

  const toggleProject = (id: string) => {
    const next = expandedProject === id ? null : id;
    setExpandedProject(next);
    if (next) loadMilestones(next);
  };

  const handleApprove = async (m: MilestoneEntry) => {
    try {
      const updated = await milestonesApi.approve(m._id);
      setMilestones((prev) => {
        const projId = typeof m.project === 'string' ? m.project : m.project._id;
        return { ...prev, [projId]: (prev[projId] || []).map((x) => (x._id === m._id ? updated : x)) };
      });
      toast.success('Milestone approved');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (m: MilestoneEntry, reason: string) => {
    const updated = await milestonesApi.reject(m._id, reason);
    setMilestones((prev) => {
      const projId = typeof m.project === 'string' ? m.project : m.project._id;
      return { ...prev, [projId]: (prev[projId] || []).map((x) => (x._id === m._id ? updated : x)) };
    });
    toast.success('Feedback sent to the team');
    setRejectTarget(null);
  };

  const refreshProject = async (projectId: string) => {
    setMilestones((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    await loadMilestones(projectId);
  };

  const allMilestones = Object.values(milestones).flat();
  const activeMilestones = allMilestones.filter((m) => ACTIVE_MILESTONE_STATUSES.includes(m.status));
  const readyForApprovalCount = allMilestones.filter((m) => m.status === 'needs_approval').length;

  if (loadingProjects) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border-dashed border-border/70 bg-muted/20 py-16 text-center shadow-sm">
        <Milestone size={48} className="mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg font-medium text-foreground">No active projects</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Milestones appear here once your project is approved.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Milestone tracker</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Project milestones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review delivery phases, check due dates, and approve completed work with a layout that stays clear in both light and dark theme.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          {readyForApprovalCount > 0
            ? `${readyForApprovalCount} milestone${readyForApprovalCount > 1 ? 's are' : ' is'} waiting for your review`
            : 'Everything is up to date right now'}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Projects',
            value: projects.length,
            hint: 'Approved or completed projects',
            tone: 'from-sky-500/10 to-sky-500/5',
            accent: 'text-sky-700 dark:text-sky-300',
          },
          {
            label: 'Active',
            value: loadingAllMilestones ? '...' : activeMilestones.length,
            hint: 'Milestones currently in progress',
            tone: 'from-violet-500/10 to-violet-500/5',
            accent: 'text-violet-700 dark:text-violet-300',
          },
          {
            label: 'Pending review',
            value: loadingAllMilestones ? '...' : readyForApprovalCount,
            hint: 'Waiting for your approval',
            tone: 'from-amber-500/10 to-amber-500/5',
            accent: 'text-amber-700 dark:text-amber-300',
          },
        ].map((item) => (
          <Card key={item.label} className="overflow-hidden border-border/60 bg-card shadow-sm">
            <div className={cn('bg-gradient-to-br p-4', item.tone)}>
              <p className={cn('text-xs font-semibold uppercase tracking-[0.18em]', item.accent)}>{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      {!loadingAllMilestones && allMilestones.length === 0 && (
        <Card className="border-dashed border-border/70 bg-muted/20 p-6 text-center shadow-sm">
          <Milestone size={36} className="mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">No milestones added yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your project phases will appear here as soon as the team adds milestone updates.
          </p>
        </Card>
      )}

      {!loadingAllMilestones && allMilestones.length > 0 && activeMilestones.length === 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
          <p className="text-base font-medium text-emerald-700 dark:text-emerald-300">No active milestones right now</p>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/75">
            Current milestones are either already approved or waiting for the next update from the team.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {projects.map((proj: any) => {
          const isOpen = expandedProject === proj._id;
          const projMilestones = milestones[proj._id] || [];
          const needsAction = projMilestones.filter((m) => m.status === 'needs_approval').length;

          return (
            <Card key={proj._id} className="overflow-hidden border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
              <button
                onClick={() => toggleProject(proj._id)}
                className="w-full bg-gradient-to-r from-background to-muted/20 px-5 py-4 text-left transition-colors hover:from-muted/20 hover:to-muted/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Milestone size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{proj.projectName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {proj.projectType && <span>{proj.projectType}</span>}
                        <span className="hidden sm:inline">•</span>
                        <span className="capitalize">{proj.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {needsAction > 0 && (
                      <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        {needsAction} need{needsAction > 1 ? '' : 's'} approval
                      </span>
                    )}
                    <ChevronDown size={18} className={cn('shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <div className="p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {projMilestones.length} milestone{projMilestones.length !== 1 ? 's' : ''}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => refreshProject(proj._id)} className="h-8 w-8 rounded-lg">
                          <RefreshCw size={14} className="text-muted-foreground" />
                        </Button>
                      </div>

                      {loadingMilestones === proj._id ? (
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/50" />
                          ))}
                        </div>
                      ) : projMilestones.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                          No milestones yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projMilestones.map((m) => (
                            <div
                              key={m._id}
                              className={cn(
                                'space-y-4 rounded-2xl border p-4 transition-colors',
                                m.status === 'needs_approval'
                                  ? 'border-amber-500/30 bg-amber-500/[0.06] shadow-[0_8px_30px_rgba(245,158,11,0.08)]'
                                  : 'border-border/60 bg-muted/[0.22]'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    {statusIcon[m.status]}
                                    <span className="truncate text-sm font-semibold text-foreground">{m.title}</span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium', statusTone[m.status])}>
                                      {statusLabel[m.status] ?? m.status}
                                    </span>
                                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium', phaseColor[m.phase])}>
                                      {m.phase}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {m.description && (
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{m.description}</p>
                              )}

                              {m.deliverables.length > 0 && (
                                <div className="space-y-2 rounded-2xl border border-border/50 bg-background/70 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Deliverables
                                  </p>
                                  {m.deliverables.map((d) => (
                                    <div key={d._id} className="flex items-center gap-2 text-sm">
                                      {d.isComplete ? (
                                        <Check size={12} className="text-emerald-500" />
                                      ) : (
                                        <Circle size={12} className="text-muted-foreground/50" />
                                      )}
                                      <span className={d.isComplete ? 'text-muted-foreground line-through' : 'text-foreground/85'}>
                                        {d.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {m.dueDate && (
                                <div className="text-xs text-muted-foreground">
                                  Due: {new Date(m.dueDate).toLocaleDateString()}
                                </div>
                              )}

                              {m.status === 'needs_approval' && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <Button
                                    onClick={() => handleApprove(m)}
                                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                                  >
                                    <ThumbsUp size={12} />Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRejectTarget(m)}
                                    className="rounded-xl border-rose-500/30 bg-rose-500/5 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                                  >
                                    <ThumbsDown size={12} />Request Changes
                                  </Button>
                                </div>
                              )}

                              {m.status === 'approved' && m.approvedAt && (
                                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  Approved on {new Date(m.approvedAt).toLocaleDateString()}
                                </div>
                              )}

                              {m.status === 'rejected' && m.rejectionReason && (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                                  Your feedback: "{m.rejectionReason}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {rejectTarget && (
        <RejectDialog
          milestoneTitle={rejectTarget.title}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
