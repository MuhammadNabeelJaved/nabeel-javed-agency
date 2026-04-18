/**
 * User Dashboard — My Reviews
 * Full CRUD: list own reviews, write a new review for a completed project,
 * edit within the editableUntil window, delete any own review.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp, Star, Plus, Trash2, Edit2, RefreshCw, X, Save,
  AlertTriangle, CheckCircle, Clock, XCircle, FolderKanban,
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
  editableUntil?: string;
  project?: { _id: string; projectName?: string; projectType?: string };
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  projectName: string;
  projectType?: string;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRow({ rating, interactive = false, onSet }: { rating: number; interactive?: boolean; onSet?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-5 w-5 transition-colors ${interactive ? 'cursor-pointer' : ''} ${
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
  const cfg = {
    pending:  { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock,        label: 'Pending Approval' },
    approved: { cls: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle,  label: 'Approved' },
    rejected: { cls: 'bg-red-500/10 text-red-500 border-red-500/20',       icon: XCircle,      label: 'Rejected' },
  }[status];
  const Icon = cfg.icon;
  return (
    <Badge className={`border text-xs font-medium flex items-center gap-1 w-fit ${cfg.cls}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

function timeLeft(until: string) {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left to edit`;
  return `${minutes}m left to edit`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New review form
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reviews/my-reviews');
      const data = res.data?.data;
      setReviews(Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiClient.get('/projects?limit=100');
      const data = res.data?.data;
      const list: Project[] = Array.isArray(data?.projects) ? data.projects
        : Array.isArray(data) ? data : [];
      // Filter to only completed/approved projects
      setProjects(list.filter(p => ['completed', 'approved'].includes(p.status)));
    } catch {
      // Non-fatal — form will just show empty dropdown
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchProjects();
  }, [fetchReviews, fetchProjects]);

  // ── Already-reviewed project IDs ──
  const reviewedProjectIds = new Set(reviews.map(r => r.project?._id).filter(Boolean));

  // ── Reviewable projects (completed/approved, not yet reviewed) ──
  const reviewableProjects = projects.filter(p => !reviewedProjectIds.has(p._id));

  // ── Submit new review ──
  const handleSubmit = async () => {
    if (!selectedProject) { toast.error('Please select a project'); return; }
    if (!newText.trim() || newText.length < 10) { toast.error('Review text must be at least 10 characters'); return; }
    setFormLoading(true);
    try {
      const res = await apiClient.post('/reviews', {
        rating: newRating,
        reviewText: newText.trim(),
        project: selectedProject,
      });
      const created: Review = res.data?.data;
      setReviews(prev => [created, ...prev]);
      setShowForm(false);
      setSelectedProject('');
      setNewRating(5);
      setNewText('');
      toast.success('Review submitted! It will appear publicly once approved.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Save edit ──
  const handleSaveEdit = async (id: string) => {
    if (!editText.trim() || editText.length < 10) { toast.error('Review must be at least 10 characters'); return; }
    setActionLoading(id + 'edit');
    try {
      const res = await apiClient.put(`/reviews/${id}`, { rating: editRating, reviewText: editText.trim() });
      const updated: Review = res.data?.data;
      setReviews(prev => prev.map(r => r._id === id ? { ...r, ...updated } : r));
      setEditingId(null);
      toast.success('Review updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setActionLoading(id + 'delete');
    try {
      await apiClient.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ──
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ThumbsUp className="h-6 w-6 text-primary" />
            My Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write and manage your project reviews. You can edit a review within 72 hours of submission.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={fetchReviews} disabled={loading} className="gap-2 rounded-full">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {reviewableProjects.length > 0 && (
            <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-2 rounded-full">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'Write Review'}
            </Button>
          )}
        </div>
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Write a Review
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" /> Select Project *
                </label>
                <Select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="rounded-xl text-sm border-border bg-background h-10 px-3 w-full"
                >
                  <option value="">— Choose a completed project —</option>
                  {reviewableProjects.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.projectName}{p.projectType ? ` (${p.projectType})` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Rating *</label>
                <div className="flex items-center gap-3">
                  <StarRow rating={newRating} interactive onSet={setNewRating} />
                  <span className="text-sm text-muted-foreground">{newRating}/5</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Your Review * <span className="text-muted-foreground/60">(10–1000 characters)</span>
                </label>
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Share your experience working with us on this project…"
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground text-right">{newText.length}/1000</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                Your review will be visible to the public once approved by our team. You can edit it within 72 hours of submission.
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={formLoading} className="gap-2 rounded-full">
                  {formLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Submit Review
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No projects available for review */}
      {!loading && reviewableProjects.length === 0 && !showForm && reviews.length === 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-8 text-center space-y-3">
          <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="font-medium text-foreground">No completed projects yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Reviews can be written for approved or completed projects. Once your first project is completed, you'll be able to share your experience here.
          </p>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
      ) : reviews.length === 0 ? (
        !showForm && (
          <div className="text-center py-16 rounded-2xl border border-border/50 bg-card">
            <ThumbsUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">You haven't written any reviews yet.</p>
            {reviewableProjects.length > 0 && (
              <Button size="sm" onClick={() => setShowForm(true)} className="mt-4 rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Write Your First Review
              </Button>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map(review => {
              const isEditing = editingId === review._id;
              const editable = review.editableUntil && new Date(review.editableUntil) > new Date();
              const editWindowMsg = review.editableUntil ? timeLeft(review.editableUntil) : null;

              return (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`rounded-2xl border bg-card p-5 sm:p-6 transition-colors ${
                    review.status === 'pending' ? 'border-amber-500/20' :
                    review.status === 'rejected' ? 'border-red-500/20' : 'border-border/50'
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Top: project + status + rating */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        {review.project && (
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <FolderKanban className="h-4 w-4 text-primary/70" />
                            {review.project.projectName}
                            {review.project.projectType && (
                              <span className="text-xs text-muted-foreground font-normal">({review.project.projectType})</span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <StatusBadge status={review.status} />
                          {!isEditing && <StarRow rating={review.rating} />}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          {editable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingId(review._id); setEditRating(review.rating); setEditText(review.reviewText); }}
                              className="gap-1.5 rounded-full text-xs"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(review._id)}
                            disabled={!!actionLoading}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            {actionLoading === review._id + 'delete'
                              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Review content / edit form */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Rating</label>
                          <StarRow rating={editRating} interactive onSet={setEditRating} />
                        </div>
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(review._id)} disabled={!!actionLoading} className="gap-1.5 rounded-full text-xs">
                            {actionLoading === review._id + 'edit' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="rounded-full text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">"{review.reviewText}"</p>
                    )}

                    {/* Footer meta */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/70 pt-1 border-t border-border/30">
                      <span>Submitted {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      {editWindowMsg && !isEditing && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />{editWindowMsg}
                        </span>
                      )}
                      {!editable && review.editableUntil && !isEditing && (
                        <span className="text-muted-foreground/50">Editing window expired</span>
                      )}
                    </div>

                    {/* Status messages */}
                    {review.status === 'pending' && !isEditing && (
                      <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        Awaiting approval — not yet visible to the public.
                      </div>
                    )}
                    {review.status === 'rejected' && !isEditing && (
                      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">
                        <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        This review was not approved and is not visible publicly.
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
