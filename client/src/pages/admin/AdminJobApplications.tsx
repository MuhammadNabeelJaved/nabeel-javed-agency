/**
 * Admin Job Applications Page
 * Shows all job applications with hire / reject / delete actions.
 * Hiring an applicant automatically updates their user account role to 'team'.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Search, UserCheck, XCircle, Trash2, Eye,
  Briefcase, ChevronDown, ChevronLeft, ChevronRight, Mail, Phone, FileText, ExternalLink,
  Calendar, Users
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { jobApplicationsApi } from '../../api/jobApplications.api';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  desiredRole?: string;
  experienceLevel?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  adminNotes?: string;
  createdAt: string;
  job?: { _id: string; jobTitle: string; department: string };
  reviewedBy?: { name: string; email: string };
  reviewedAt?: string;
}

// ─── Status Config ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  reviewing:  { label: 'Reviewing',  className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  shortlisted:{ label: 'Shortlisted',className: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  rejected:   { label: 'Rejected',   className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  hired:      { label: 'Hired',      className: 'bg-green-500/10 text-green-600 border-green-500/30' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({
  open, title, description, confirmLabel, confirmVariant = 'destructive', onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; description: string; confirmLabel: string;
  confirmVariant?: 'default' | 'destructive'; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminJobApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats]               = useState({ total: 0, pending: 0, reviewing: 0, shortlisted: 0, hired: 0, rejected: 0 });

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Detail dialog
  const [viewApp, setViewApp]           = useState<Application | null>(null);

  // Confirm dialogs
  const [hireTarget, setHireTarget]     = useState<Application | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const [appsRes, statsRes] = await Promise.allSettled([
        jobApplicationsApi.getAll({ status: statusFilter || undefined, search: search || undefined }),
        jobApplicationsApi.getStats(),
      ]);

      if (appsRes.status === 'fulfilled') {
        const d = appsRes.value.data.data;
        setApplications(d?.applications || d || []);
      }
      if (statsRes.status === 'fulfilled') {
        const byStatus: { _id: string; count: number }[] = statsRes.value.data.data?.byStatus || [];
        const total = statsRes.value.data.data?.total || 0;
        const map: Record<string, number> = {};
        byStatus.forEach(s => { map[s._id] = s.count; });
        setStats({
          total,
          pending:     map.pending     || 0,
          reviewing:   map.reviewing   || 0,
          shortlisted: map.shortlisted || 0,
          hired:       map.hired       || 0,
          rejected:    map.rejected    || 0,
        });
      }
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchApplications, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchApplications]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string, label: string) => {
    try {
      setActionLoading(true);
      await jobApplicationsApi.updateStatus(id, { status });
      toast.success(`Application ${label} successfully`);
      setHireTarget(null);
      setRejectTarget(null);
      fetchApplications();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${label} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await jobApplicationsApi.delete(deleteTarget._id);
      toast.success('Application deleted');
      setDeleteTarget(null);
      fetchApplications();
    } catch {
      toast.error('Failed to delete application');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.ceil(applications.length / PAGE_SIZE);
  const paginated  = applications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
        <p className="text-muted-foreground">Review applicants, hire team members, or reject applications.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: stats.total,       color: 'text-foreground' },
          { label: 'Pending',     value: stats.pending,     color: 'text-yellow-600' },
          { label: 'Reviewing',   value: stats.reviewing,   color: 'text-blue-600' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-purple-600' },
          { label: 'Hired',       value: stats.hired,       color: 'text-green-600' },
          { label: 'Rejected',    value: stats.rejected,    color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className={`cursor-pointer transition-colors hover:border-primary/40 ${statusFilter === (label === 'Total' ? '' : label.toLowerCase()) ? 'border-primary' : ''}`}
            onClick={() => setStatusFilter(label === 'Total' ? '' : label.toLowerCase())}
          >
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Briefcase className="h-10 w-10 opacity-30" />
          <p className="font-medium">No applications found</p>
          <p className="text-sm">Applications submitted from the careers page will appear here.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applicant</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Experience</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((app) => {
                  const sc = statusConfig[app.status] ?? { label: app.status, className: '' };
                  return (
                    <tr key={app._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      {/* Applicant */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {app.firstName[0]}{app.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{app.firstName} {app.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3">
                        <p className="font-medium">{app.job?.jobTitle ?? app.desiredRole ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{app.job?.department ?? '—'}</p>
                      </td>

                      {/* Experience */}
                      <td className="px-4 py-3 text-muted-foreground">{app.experienceLevel ?? '—'}</td>

                      {/* Date */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div>{formatDate(app.createdAt)}</div>
                        <div className="text-xs">{timeAgo(app.createdAt)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                          {sc.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="View details"
                            onClick={() => setViewApp(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Hire */}
                          {app.status !== 'hired' && app.status !== 'rejected' && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              title="Hire applicant"
                              onClick={() => setHireTarget(app)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Reject */}
                          {app.status !== 'rejected' && app.status !== 'hired' && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                              title="Reject application"
                              onClick={() => setRejectTarget(app)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Delete */}
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Delete application"
                            onClick={() => setDeleteTarget(app)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, applications.length)}–{Math.min(currentPage * PAGE_SIZE, applications.length)} of {applications.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!viewApp} onOpenChange={(o) => { if (!o) setViewApp(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewApp && (() => {
            const sc = statusConfig[viewApp.status] ?? { label: viewApp.status, className: '' };
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {viewApp.firstName[0]}{viewApp.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{viewApp.firstName} {viewApp.lastName}</DialogTitle>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${viewApp.email}`} className="text-primary hover:underline truncate">{viewApp.email}</a>
                    </div>
                    {viewApp.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{viewApp.phone}</span>
                      </div>
                    )}
                    {viewApp.portfolioUrl && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={viewApp.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                          {viewApp.portfolioUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="rounded-lg bg-muted/40 p-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Position</p>
                      <p className="font-medium">{viewApp.job?.jobTitle ?? viewApp.desiredRole ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Department</p>
                      <p className="font-medium">{viewApp.job?.department ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Experience</p>
                      <p className="font-medium">{viewApp.experienceLevel ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Applied</p>
                      <p className="font-medium">{formatDate(viewApp.createdAt)}</p>
                    </div>
                  </div>

                  {/* Resume */}
                  {viewApp.resumeUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resume/CV</p>
                      <a
                        href={viewApp.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all group w-fit"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">View Resume</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </a>
                    </div>
                  )}

                  {/* Cover Letter */}
                  {viewApp.coverLetter && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cover Letter</p>
                      <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewApp.coverLetter}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {viewApp.adminNotes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Admin Notes</p>
                      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-sm">
                        {viewApp.adminNotes}
                      </div>
                    </div>
                  )}

                  {/* Reviewed by */}
                  {viewApp.reviewedBy && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed by <strong>{viewApp.reviewedBy.name}</strong> on {formatDate(viewApp.reviewedAt!)}
                    </p>
                  )}
                </div>

                {/* Actions inside dialog */}
                <DialogFooter className="gap-2 pt-4 border-t">
                  {viewApp.status !== 'hired' && viewApp.status !== 'rejected' && (
                    <>
                      <Button
                        variant="default" className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => { setViewApp(null); setHireTarget(viewApp); }}
                      >
                        <UserCheck className="mr-2 h-4 w-4" /> Hire
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                        onClick={() => { setViewApp(null); setRejectTarget(viewApp); }}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    onClick={() => { setViewApp(null); setDeleteTarget(viewApp); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Hire Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!hireTarget}
        title="Hire Applicant"
        description={`Hire ${hireTarget?.firstName} ${hireTarget?.lastName} for ${hireTarget?.job?.jobTitle ?? hireTarget?.desiredRole ?? 'this position'}? Their user account role will be automatically upgraded to Team Member.`}
        confirmLabel="Hire"
        confirmVariant="default"
        loading={actionLoading}
        onConfirm={() => updateStatus(hireTarget!._id, 'hired', 'hired')}
        onCancel={() => setHireTarget(null)}
      />

      {/* ── Reject Confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject Application"
        description={`Reject ${rejectTarget?.firstName} ${rejectTarget?.lastName}'s application for ${rejectTarget?.job?.jobTitle ?? rejectTarget?.desiredRole ?? 'this position'}?`}
        confirmLabel="Reject"
        confirmVariant="destructive"
        loading={actionLoading}
        onConfirm={() => updateStatus(rejectTarget!._id, 'rejected', 'rejected')}
        onCancel={() => setRejectTarget(null)}
      />

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Application"
        description={`Delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}'s application? This only removes the application record — their user account will not be affected.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
