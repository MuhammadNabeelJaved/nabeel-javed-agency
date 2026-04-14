/**
 * Admin — Reviews & Testimonials Management
 * Full CRUD: approve/reject/delete/edit reviews, create standalone reviews,
 * toggle showOnHome per review, manage all reviews (general + project-specific).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, CheckCircle, XCircle, Trash2, RefreshCw,
  MessageSquare, Clock, Filter, Search,
  ThumbsUp, AlertTriangle, Home, Plus, Edit2,
  X, Save, User, Briefcase, Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  _id: string;
  rating: number;
  reviewText: string;
  status: 'pending' | 'approved' | 'rejected';
  showOnHome: boolean;
  isAdminCreated?: boolean;
  editableUntil?: string;
  project?: { _id: string; projectName?: string };
  client?: { _id: string; name: string; email: string; photo?: string };
  authorName?: string;
  authorRole?: string;
  authorCompany?: string;
  authorAvatar?: string;
  createdAt: string;
}

interface NewReviewForm {
  authorName: string;
  authorRole: string;
  authorCompany: string;
  rating: number;
  reviewText: string;
  showOnHome: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRow({ rating, interactive = false, onSet }: { rating: number; interactive?: boolean; onSet?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-4 w-4 ${interactive ? 'cursor-pointer' : ''} ${
            n <= (interactive ? (hover || rating) : rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }`}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onSet?.(n)}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Review['status'] }) {
  const map: Record<string, string> = {
    pending:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <Badge className={`border text-xs font-medium capitalize ${map[status]}`}>{status}</Badge>;
}

function AuthorAvatar({ review }: { review: Review }) {
  const src = review.isAdminCreated ? review.authorAvatar : review.client?.photo;
  const name = review.isAdminCreated ? review.authorName : review.client?.name;
  if (src) return (
    <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
  );
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

const EMPTY_FORM: NewReviewForm = { authorName: '', authorRole: '', authorCompany: '', rating: 5, reviewText: '', showOnHome: false };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [homeFilter, setHomeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<NewReviewForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ rating: number; reviewText: string; authorName?: string; authorRole?: string; authorCompany?: string }>({ rating: 5, reviewText: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.allSettled([
        apiClient.get('/reviews?limit=200'),
        apiClient.get('/reviews/statistics'),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const data = reviewsRes.value.data?.data;
        const list = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        setReviews(list);
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data?.data;
        if (s) setStatsData(s);
      }
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id + status);
    try {
      await apiClient.put(`/reviews/${id}/status`, { status });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      toast.success(status === 'approved' ? 'Review approved' : 'Review rejected');
    } catch {
      toast.error('Failed to update review status');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleHome = async (id: string) => {
    setActionLoading(id + 'home');
    try {
      const res = await apiClient.patch(`/reviews/${id}/toggle-home`);
      const newVal: boolean = res.data?.data?.showOnHome;
      setReviews(prev => prev.map(r => r._id === id ? { ...r, showOnHome: newVal } : r));
      toast.success(newVal ? 'Added to home page' : 'Removed from home page');
    } catch {
      toast.error('Failed to toggle home visibility');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    setActionLoading(id + 'delete');
    try {
      await apiClient.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!form.authorName.trim()) { toast.error('Author name is required'); return; }
    if (!form.reviewText.trim() || form.reviewText.length < 10) { toast.error('Review text must be at least 10 characters'); return; }
    setFormLoading(true);
    try {
      const res = await apiClient.post('/reviews/admin', form);
      const created: Review = res.data?.data;
      setReviews(prev => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      toast.success('Review created and published');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create review');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review._id);
    setEditForm({
      rating: review.rating,
      reviewText: review.reviewText,
      authorName: review.authorName,
      authorRole: review.authorRole,
      authorCompany: review.authorCompany,
    });
  };

  const saveEdit = async (review: Review) => {
    setActionLoading(review._id + 'edit');
    try {
      const endpoint = review.isAdminCreated ? `/reviews/${review._id}/admin` : `/reviews/${review._id}`;
      const method = review.isAdminCreated ? 'put' : 'put';
      const res = await apiClient[method](endpoint, editForm);
      const updated: Review = res.data?.data;
      setReviews(prev => prev.map(r => r._id === review._id ? { ...r, ...updated } : r));
      setEditingId(null);
      toast.success('Review updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived ──

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    onHome: reviews.filter(r => r.showOnHome).length,
    avgRating: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—',
  };

  const filtered = reviews.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false;
    if (homeFilter === 'home' && !r.showOnHome) return false;
    if (homeFilter === 'not-home' && r.showOnHome) return false;
    if (search) {
      const q = search.toLowerCase();
      const authorName = (r.isAdminCreated ? r.authorName : r.client?.name) || '';
      if (
        !r.reviewText?.toLowerCase().includes(q) &&
        !authorName.toLowerCase().includes(q) &&
        !r.project?.projectName?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ── Render ──
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Reviews & Testimonials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Moderate client reviews, create standalone testimonials, and control what appears on the home page.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading} className="gap-2 rounded-full">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(v => !v)} className="gap-2 rounded-full">
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreateForm ? 'Cancel' : 'Add Review'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',    value: stats.total,    color: 'text-foreground',   icon: MessageSquare },
          { label: 'Pending',  value: stats.pending,  color: 'text-amber-500',    icon: Clock },
          { label: 'Approved', value: stats.approved, color: 'text-green-500',    icon: CheckCircle },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-500',      icon: XCircle },
          { label: 'On Home',  value: stats.onHome,   color: 'text-blue-500',     icon: Home },
          { label: 'Avg ★',    value: stats.avgRating,color: 'text-amber-400',    icon: Star },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending warning */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{stats.pending}</strong> review{stats.pending > 1 ? 's are' : ' is'} waiting for approval and not visible to the public yet.
          </span>
        </div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Create Standalone Review
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Author Name *</label>
                  <Input
                    value={form.authorName}
                    onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                    placeholder="e.g. Sarah Johnson"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Role / Title</label>
                  <Input
                    value={form.authorRole}
                    onChange={e => setForm(f => ({ ...f, authorRole: e.target.value }))}
                    placeholder="e.g. CTO, TechFlow Inc."
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Company</label>
                  <Input
                    value={form.authorCompany}
                    onChange={e => setForm(f => ({ ...f, authorCompany: e.target.value }))}
                    placeholder="Company name (optional)"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Rating *</label>
                  <div className="flex items-center gap-3 h-10">
                    <StarRow rating={form.rating} interactive onSet={n => setForm(f => ({ ...f, rating: n }))} />
                    <span className="text-sm text-muted-foreground">{form.rating}/5</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Review Text * (min 10 characters)</label>
                <textarea
                  value={form.reviewText}
                  onChange={e => setForm(f => ({ ...f, reviewText: e.target.value }))}
                  placeholder="Write the testimonial text here…"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground text-right">{form.reviewText.length}/1000</p>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showOnHome}
                    onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-blue-500" />
                    Show on home page immediately
                  </span>
                </label>
                <Button onClick={handleCreate} disabled={formLoading} className="gap-2 rounded-full">
                  {formLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Publish Review
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews…" className="pl-9 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-full text-sm border-border/50 bg-background h-10 px-3">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
          className="rounded-full text-sm border-border/50 bg-background h-10 px-3">
          <option value="all">All Ratings</option>
          {[5, 4, 3, 2, 1].map(n => (
            <option key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</option>
          ))}
        </Select>
        <Select value={homeFilter} onChange={e => setHomeFilter(e.target.value)}
          className="rounded-full text-sm border-border/50 bg-background h-10 px-3">
          <option value="all">All Visibility</option>
          <option value="home">On Home Page</option>
          <option value="not-home">Not on Home</option>
        </Select>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border/50 bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reviews found</p>
          {(statusFilter !== 'all' || search || ratingFilter !== 'all' || homeFilter !== 'all') && (
            <button onClick={() => { setStatusFilter('all'); setSearch(''); setRatingFilter('all'); setHomeFilter('all'); }}
              className="text-xs text-primary mt-2 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(review => {
              const isEditing = editingId === review._id;
              const displayName = review.isAdminCreated ? review.authorName : review.client?.name;
              const displayRole = review.authorRole || '';
              const displayCompany = review.authorCompany || '';

              return (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`rounded-2xl border bg-card p-5 sm:p-6 transition-colors ${
                    review.status === 'pending' ? 'border-amber-500/20' :
                    review.showOnHome ? 'border-blue-500/20' : 'border-border/50'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <AuthorAvatar review={review} />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        /* ─── Edit mode ─── */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {review.isAdminCreated && (
                              <>
                                <Input
                                  value={editForm.authorName ?? ''}
                                  onChange={e => setEditForm(f => ({ ...f, authorName: e.target.value }))}
                                  placeholder="Author name"
                                  className="rounded-xl text-sm"
                                />
                                <Input
                                  value={editForm.authorRole ?? ''}
                                  onChange={e => setEditForm(f => ({ ...f, authorRole: e.target.value }))}
                                  placeholder="Role / title"
                                  className="rounded-xl text-sm"
                                />
                              </>
                            )}
                            <div className="flex items-center gap-2 col-span-full">
                              <span className="text-xs text-muted-foreground">Rating:</span>
                              <StarRow rating={editForm.rating} interactive onSet={n => setEditForm(f => ({ ...f, rating: n }))} />
                            </div>
                          </div>
                          <textarea
                            value={editForm.reviewText}
                            onChange={e => setEditForm(f => ({ ...f, reviewText: e.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(review)} disabled={!!actionLoading} className="gap-1.5 rounded-full text-xs">
                              {actionLoading === review._id + 'edit' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="rounded-full text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ─── View mode ─── */
                        <>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground">{displayName || 'Anonymous'}</span>
                            {(displayRole || displayCompany) && (
                              <span className="text-xs text-muted-foreground">
                                {displayRole}{displayRole && displayCompany ? ', ' : ''}{displayCompany}
                              </span>
                            )}
                            <StatusBadge status={review.status} />
                            <StarRow rating={review.rating} />
                            {review.isAdminCreated && (
                              <Badge className="border border-purple-500/20 bg-purple-500/10 text-purple-500 text-xs">Admin</Badge>
                            )}
                            {review.showOnHome && (
                              <Badge className="border border-blue-500/20 bg-blue-500/10 text-blue-500 text-xs flex items-center gap-1">
                                <Home className="h-2.5 w-2.5" /> On Home
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.reviewText}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/70">
                            {review.client?.email && <span>{review.client.email}</span>}
                            {review.project && <span>Project: {review.project.projectName || review.project._id}</span>}
                            <span>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {review.editableUntil && new Date(review.editableUntil) > new Date() && (
                              <span className="text-amber-500">Editable until {new Date(review.editableUntil).toLocaleString()}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions (not shown in edit mode) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                        {/* Show on home toggle */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleHome(review._id)}
                          disabled={!!actionLoading || review.status !== 'approved'}
                          title={review.status !== 'approved' ? 'Approve the review first' : review.showOnHome ? 'Remove from home' : 'Add to home page'}
                          className={`gap-1.5 rounded-full text-xs ${
                            review.showOnHome
                              ? 'border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500'
                              : 'border-border/50 text-muted-foreground hover:text-blue-500 hover:border-blue-500/30'
                          }`}
                        >
                          {actionLoading === review._id + 'home'
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <Home className="h-3 w-3" />
                          }
                          {review.showOnHome ? 'On Home' : 'Add Home'}
                        </Button>

                        {review.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(review._id, 'approved')}
                            disabled={!!actionLoading}
                            className="gap-1.5 rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-500 text-xs"
                          >
                            {actionLoading === review._id + 'approved'
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : <ThumbsUp className="h-3 w-3" />
                            }
                            Approve
                          </Button>
                        )}
                        {review.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(review._id, 'rejected')}
                            disabled={!!actionLoading}
                            className="gap-1.5 rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 text-xs"
                          >
                            {actionLoading === review._id + 'rejected'
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : <XCircle className="h-3 w-3" />
                            }
                            Reject
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(review)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit review"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(review._id)}
                          disabled={!!actionLoading}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="Delete review"
                        >
                          {actionLoading === review._id + 'delete'
                            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Pending notice */}
                  {review.status === 'pending' && !isEditing && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      Awaiting approval — not visible to the public.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Showing {filtered.length} of {reviews.length} reviews
        </p>
      )}
    </div>
  );
}
