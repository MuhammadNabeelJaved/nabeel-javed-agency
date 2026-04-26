import React, { useEffect, useState, useCallback } from 'react';
import {
    Milestone, Plus, X, Save, Trash2, ChevronDown, CheckCircle2,
    Clock, AlertCircle, Circle, BarChart2, Filter, RefreshCw,
    Check, Loader2, Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectItem } from '../../components/ui/select';
import { milestonesApi, MilestoneEntry } from '../../api/milestones.api';

const PHASES = ['Discovery', 'Design', 'Development', 'Testing', 'Launch'] as const;
const STATUSES = ['pending', 'in_progress', 'needs_approval', 'approved', 'rejected'] as const;

const STATUS_BADGE: Record<string, string> = {
    pending:        'bg-muted text-muted-foreground border-border/40',
    in_progress:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
    needs_approval: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    approved:       'bg-green-500/10 text-green-600 border-green-500/20',
    rejected:       'bg-red-500/10 text-red-600 border-red-500/20',
};

const PHASE_BADGE: Record<string, string> = {
    Discovery:   'bg-violet-500/10 text-violet-600 border-violet-500/20',
    Design:      'bg-pink-500/10 text-pink-600 border-pink-500/20',
    Development: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Testing:     'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Launch:      'bg-green-500/10 text-green-600 border-green-500/20',
};

function StatusIcon({ status }: { status: string }) {
    if (status === 'approved')       return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'rejected')       return <AlertCircle  className="h-4 w-4 text-red-500" />;
    if (status === 'needs_approval') return <Clock        className="h-4 w-4 text-amber-500" />;
    if (status === 'in_progress')    return <BarChart2    className="h-4 w-4 text-blue-500" />;
    return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

interface MilestoneFormProps {
    initial?: Partial<MilestoneEntry>;
    onSave: (data: Partial<MilestoneEntry>) => Promise<void>;
    onClose: () => void;
}

function MilestoneForm({ initial, onSave, onClose }: MilestoneFormProps) {
    const isEdit = !!initial?._id;
    const [form, setForm] = useState({
        project:     typeof initial?.project === 'object' ? initial.project._id : (initial?.project || ''),
        title:       initial?.title       || '',
        description: initial?.description || '',
        phase:       (initial?.phase       || 'Discovery') as typeof PHASES[number],
        order:       initial?.order        ?? 0,
        dueDate:     initial?.dueDate      ? initial.dueDate.substring(0, 10) : '',
        deliverables: [] as { title: string }[],
    });
    const [saving, setSaving]       = useState(false);
    const [delivInput, setDelivInput] = useState('');

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const addDeliverable = () => {
        if (!delivInput.trim()) return;
        set('deliverables', [...form.deliverables, { title: delivInput.trim() }]);
        setDelivInput('');
    };

    const handleSubmit = async () => {
        if (!isEdit && !form.project) { toast.error('Project ID is required'); return; }
        if (!form.title)               { toast.error('Title is required'); return; }
        if (!form.phase)               { toast.error('Phase is required'); return; }
        setSaving(true);
        try {
            await onSave({
                ...(!isEdit ? { project: form.project } : {}),
                title:       form.title,
                description: form.description || undefined,
                phase:       form.phase,
                order:       form.order,
                dueDate:     form.dueDate || undefined,
                ...(form.deliverables.length > 0
                    ? { deliverables: form.deliverables.map(d => ({ title: d.title, isComplete: false })) }
                    : {}
                ),
            });
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background border border-border rounded-2xl w-full max-w-lg my-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <h2 className="text-xl font-bold">{isEdit ? 'Edit Milestone' : 'Create Milestone'}</h2>
                            <p className="text-muted-foreground text-sm mt-0.5">Define a project milestone and its deliverables.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* Project ID (create only) */}
                        {!isEdit && (
                            <div className="space-y-1.5">
                                <Label>Project ID <span className="text-xs font-normal text-muted-foreground">(MongoDB ObjectId)</span></Label>
                                <Input
                                    value={form.project}
                                    onChange={e => set('project', e.target.value)}
                                    placeholder="64f1a2b3c4d5e6f7a8b9c0d1"
                                    className="font-mono text-sm"
                                />
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label>Title *</Label>
                            <Input
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder="e.g. Design Mockups Complete"
                            />
                        </div>

                        {/* Phase + Due Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Phase *</Label>
                                <Select
                                    value={form.phase}
                                    onValueChange={(val: any) => set('phase', val)}
                                >
                                    {PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => set('dueDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label>Description <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                            <Textarea
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                rows={3}
                                placeholder="What does this milestone cover?"
                            />
                        </div>

                        {/* Deliverables (create only) */}
                        {!isEdit && (
                            <div className="space-y-1.5">
                                <Label>Deliverables <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={delivInput}
                                        onChange={e => setDelivInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); } }}
                                        placeholder="Press Enter to add…"
                                    />
                                    <Button type="button" variant="outline" onClick={addDeliverable} className="shrink-0">Add</Button>
                                </div>
                                {form.deliverables.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                        {form.deliverables.map((d, i) => (
                                            <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 border border-border/40">
                                                <span className="text-sm text-foreground">{d.title}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                    onClick={() => set('deliverables', form.deliverables.filter((_, j) => j !== i))}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-1 border-t border-border/50">
                        <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving…' : (isEdit ? 'Update Milestone' : 'Create Milestone')}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminMilestones() {
    const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showForm, setShowForm]     = useState(false);
    const [editing, setEditing]       = useState<MilestoneEntry | null>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPhase,  setFilterPhase]  = useState('');
    const [expanded, setExpanded]     = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await milestonesApi.getAll({
                status: filterStatus || undefined,
                phase:  filterPhase  || undefined,
            });
            setMilestones(data);
        } catch {
            toast.error('Failed to load milestones');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterPhase]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (data: Partial<MilestoneEntry>) => {
        const m = await milestonesApi.create(data);
        setMilestones(prev => [m, ...prev]);
        toast.success('Milestone created');
    };

    const handleUpdate = async (data: Partial<MilestoneEntry>) => {
        const m = await milestonesApi.update(editing!._id, data);
        setMilestones(prev => prev.map(x => x._id === m._id ? m : x));
        toast.success('Milestone updated');
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const updated = await milestonesApi.update(id, { status } as any);
            setMilestones(prev => prev.map(m => m._id === id ? updated : m));
            toast.success('Status updated');
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to update status'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this milestone?')) return;
        try {
            await milestonesApi.delete(id);
            setMilestones(prev => prev.filter(m => m._id !== id));
            toast.success('Milestone deleted');
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
    };

    const stats = {
        total:         milestones.length,
        needsApproval: milestones.filter(m => m.status === 'needs_approval').length,
        approved:      milestones.filter(m => m.status === 'approved').length,
        inProgress:    milestones.filter(m => m.status === 'in_progress').length,
    };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Milestones</h1>
                    <p className="text-muted-foreground mt-1">Track project phases and collect client approvals.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Milestone
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total',          value: stats.total,         color: 'text-foreground' },
                    { label: 'In Progress',    value: stats.inProgress,    color: 'text-blue-600' },
                    { label: 'Needs Approval', value: stats.needsApproval, color: 'text-amber-600' },
                    { label: 'Approved',       value: stats.approved,      color: 'text-green-600' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="pt-4 text-center">
                            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                    className="w-40 h-9 text-sm"
                >
                    <SelectItem value="">All Statuses</SelectItem>
                    {STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                </Select>
                <Select
                    value={filterPhase}
                    onValueChange={setFilterPhase}
                    className="w-40 h-9 text-sm"
                >
                    <SelectItem value="">All Phases</SelectItem>
                    {PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </Select>
                {(filterStatus || filterPhase) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setFilterStatus(''); setFilterPhase(''); }}
                        className="h-9 text-muted-foreground gap-1.5"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear filters
                    </Button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10">
                    <Milestone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Milestones Found</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        {filterStatus || filterPhase ? 'Try clearing the filters.' : 'Create your first milestone to get started.'}
                    </p>
                    {!filterStatus && !filterPhase && (
                        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Milestone
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {milestones.map(m => {
                        const proj = typeof m.project === 'object' ? m.project : null;
                        const isExpanded = expanded === m._id;

                        return (
                            <div
                                key={m._id}
                                className="border border-border/40 rounded-xl overflow-hidden bg-card hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <StatusIcon status={m.status} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground truncate">{m.title}</span>
                                            <Badge className={`border text-xs ${PHASE_BADGE[m.phase]}`}>{m.phase}</Badge>
                                            <Badge className={`border text-xs ${STATUS_BADGE[m.status]}`}>
                                                {m.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                        {proj && (
                                            <p className="text-xs text-muted-foreground mt-0.5">Project: {proj.projectName}</p>
                                        )}
                                    </div>

                                    {m.dueDate && (
                                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            {new Date(m.dueDate).toLocaleDateString()}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {m.status === 'pending' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(m._id, 'in_progress')}
                                                className="h-8 text-xs text-blue-600 hover:bg-blue-500/10"
                                            >
                                                Start
                                            </Button>
                                        )}
                                        {m.status === 'in_progress' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(m._id, 'needs_approval')}
                                                className="h-8 text-xs text-amber-600 hover:bg-amber-500/10"
                                            >
                                                Request Approval
                                            </Button>
                                        )}
                                        {m.status === 'needs_approval' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusChange(m._id, 'approved')}
                                                className="h-8 text-xs text-green-600 hover:bg-green-500/10"
                                            >
                                                Approve
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setEditing(m); setShowForm(true); }}
                                            className="h-8 w-8"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(m._id)}
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setExpanded(isExpanded ? null : m._id)}
                                            className="h-8 w-8"
                                        >
                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border/40 px-5 py-4 space-y-4 bg-muted/10">
                                        {m.description && (
                                            <p className="text-sm text-muted-foreground">{m.description}</p>
                                        )}

                                        {m.deliverables.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Deliverables ({m.deliverables.filter(d => d.isComplete).length}/{m.deliverables.length})
                                                </p>
                                                <div className="space-y-1">
                                                    {m.deliverables.map(d => (
                                                        <div key={d._id} className="flex items-center gap-2 text-sm">
                                                            {d.isComplete
                                                                ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                                : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                                            }
                                                            <span className={d.isComplete ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                                                {d.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                                            {m.approvedBy && (
                                                <span>
                                                    Approved by <span className="text-foreground">{m.approvedBy.name}</span>
                                                    {m.approvedAt ? ` on ${new Date(m.approvedAt).toLocaleDateString()}` : ''}
                                                </span>
                                            )}
                                            {m.createdBy && (
                                                <span>Created by <span className="text-foreground">{m.createdBy.name}</span></span>
                                            )}
                                            {m.rejectionReason && (
                                                <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 w-full">
                                                    Rejection reason: {m.rejectionReason}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <MilestoneForm
                    initial={editing || undefined}
                    onSave={editing ? handleUpdate : handleCreate}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            )}
        </div>
    );
}
