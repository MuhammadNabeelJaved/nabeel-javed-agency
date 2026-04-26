import React, { useEffect, useState, useCallback } from 'react';
import {
    Workflow, Plus, X, Save, Trash2, Edit3,
    RefreshCw, Mail, Clock, Zap, ChevronDown,
    AlertCircle, CheckCircle2, Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectItem } from '../../components/ui/select';
import { emailAutomationsApi, EmailAutomation, TriggerType } from '../../api/emailAutomations.api';

const TRIGGERS: { value: TriggerType; label: string; description: string; badge: string }[] = [
    { value: 'project_completed',   label: 'Project Completed',    description: 'Fires when a project is marked completed',       badge: 'bg-green-500/10 text-green-600 border-green-500/20' },
    { value: 'project_approved',    label: 'Project Approved',     description: 'Fires when a project request is approved',       badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { value: 'project_rejected',    label: 'Project Rejected',     description: 'Fires when a project request is rejected',       badge: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'milestone_ready',     label: 'Milestone Ready',      description: 'Fires when a milestone needs client approval',   badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { value: 'milestone_approved',  label: 'Milestone Approved',   description: 'Fires when a client approves a milestone',      badge: 'bg-green-500/10 text-green-600 border-green-500/20' },
    { value: 'welcome_user',        label: 'Welcome User',         description: 'Fires when a new user verifies their email',    badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
    { value: 'review_request',      label: 'Review Request',       description: 'Delayed review nudge after project completion', badge: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
    { value: 'payment_reminder',    label: 'Payment Reminder',     description: 'Fires when payment is overdue',                 badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    { value: 'inactivity_followup', label: 'Inactivity Follow-up', description: 'Fires after N hours of client inactivity',     badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
];

const PLACEHOLDERS = [
    '{{USER_NAME}}', '{{USER_EMAIL}}', '{{PROJECT_NAME}}', '{{PROJECT_TYPE}}',
    '{{MILESTONE_TITLE}}', '{{DASHBOARD_URL}}', '{{REVIEW_URL}}', '{{CLIENT_URL}}', '{{ADMIN_URL}}',
];

const EMPTY_FORM: Partial<EmailAutomation> = {
    name: '', trigger: 'project_completed', delayHours: 0,
    isEnabled: true, emailSubject: '', emailBody: '', emailText: '',
};

interface AutomationFormProps {
    initial?: Partial<EmailAutomation>;
    onSave: (data: Partial<EmailAutomation>) => Promise<void>;
    onClose: () => void;
}

function AutomationForm({ initial, onSave, onClose }: AutomationFormProps) {
    const [form, setForm] = useState<Partial<EmailAutomation>>({ ...EMPTY_FORM, ...initial });
    const [saving, setSaving] = useState(false);
    const [showPlaceholders, setShowPlaceholders] = useState(false);
    const isEdit = !!initial?._id;

    const set = (k: keyof EmailAutomation, v: any) => setForm(f => ({ ...f, [k]: v }));

    const insertPlaceholder = (p: string) =>
        setForm(f => ({ ...f, emailBody: (f.emailBody || '') + p }));

    const handleSubmit = async () => {
        if (!form.name || !form.trigger || !form.emailSubject || !form.emailBody) {
            toast.error('Name, trigger, subject, and body are required');
            return;
        }
        setSaving(true);
        try { await onSave(form); onClose(); }
        catch (e: any) { toast.error(e?.response?.data?.message || e.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const triggerInfo = TRIGGERS.find(t => t.value === form.trigger);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-background border border-border rounded-2xl w-full max-w-2xl my-4 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <h2 className="text-xl font-bold">{isEdit ? 'Edit Automation' : 'New Automation'}</h2>
                            <p className="text-muted-foreground text-sm mt-0.5">Configure an automated email rule.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Automation Name</Label>
                            <Input
                                value={form.name || ''}
                                onChange={e => set('name', e.target.value)}
                                placeholder="e.g. Project Completed — Thank You Email"
                            />
                        </div>

                        {/* Trigger */}
                        <div className="space-y-1.5">
                            <Label>Trigger Event</Label>
                            <Select
                                value={form.trigger}
                                onValueChange={(val: any) => set('trigger', val as TriggerType)}
                            >
                                {TRIGGERS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </Select>
                            {triggerInfo && (
                                <p className="text-xs text-muted-foreground">{triggerInfo.description}</p>
                            )}
                        </div>

                        {/* Delay */}
                        <div className="space-y-1.5">
                            <Label>Delay (hours, 0 = immediate)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={8760}
                                value={form.delayHours ?? 0}
                                onChange={e => set('delayHours', Number(e.target.value))}
                            />
                            {(form.delayHours || 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Sends {form.delayHours}h ({((form.delayHours || 0) / 24).toFixed(1)} days) after trigger
                                </p>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>Email Subject</Label>
                            <Input
                                value={form.emailSubject || ''}
                                onChange={e => set('emailSubject', e.target.value)}
                                placeholder="Your project {{PROJECT_NAME}} is complete!"
                            />
                        </div>

                        {/* Body */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label>Email Body (HTML)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPlaceholders(o => !o)}
                                    className="h-7 gap-1.5 text-xs text-primary"
                                >
                                    <Zap className="h-3 w-3" />
                                    Placeholders
                                </Button>
                            </div>
                            {showPlaceholders && (
                                <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg border border-border/40">
                                    {PLACEHOLDERS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => insertPlaceholder(p)}
                                            className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors font-mono"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Textarea
                                value={form.emailBody || ''}
                                onChange={e => set('emailBody', e.target.value)}
                                rows={8}
                                placeholder={`<p>Hi {{USER_NAME}},</p>\n<p>Your project <strong>{{PROJECT_NAME}}</strong> has been completed!</p>\n<p><a href="{{DASHBOARD_URL}}">View Dashboard</a></p>`}
                                className="font-mono text-xs"
                            />
                        </div>

                        {/* Plain text */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <Label>
                                Plain-text fallback
                                <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
                            </Label>
                            <Textarea
                                value={form.emailText || ''}
                                onChange={e => set('emailText', e.target.value)}
                                rows={3}
                                placeholder="Hi {{USER_NAME}}, your project {{PROJECT_NAME}} is complete..."
                            />
                        </div>

                        {/* Enabled toggle */}
                        <div className="lg:col-span-2">
                            <div
                                onClick={() => set('isEnabled', !form.isEnabled)}
                                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
                            >
                                <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${form.isEnabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm text-foreground">
                                    {form.isEnabled ? 'Enabled — will fire on trigger' : 'Disabled — will not fire'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-1 border-t border-border/50">
                        <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving…' : (isEdit ? 'Update Automation' : 'Create Automation')}
                        </Button>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminEmailAutomations() {
    const [automations, setAutomations] = useState<EmailAutomation[]>([]);
    const [stats, setStats]             = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [showForm, setShowForm]       = useState(false);
    const [editing, setEditing]         = useState<EmailAutomation | null>(null);
    const [expanded, setExpanded]       = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [data, s] = await Promise.all([
                emailAutomationsApi.getAll(),
                emailAutomationsApi.getStats().catch(() => null),
            ]);
            setAutomations(data);
            setStats(s);
        } catch { toast.error('Failed to load automations'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (data: Partial<EmailAutomation>) => {
        const a = await emailAutomationsApi.create(data);
        setAutomations(prev => [a, ...prev]);
        toast.success('Automation created');
    };

    const handleUpdate = async (data: Partial<EmailAutomation>) => {
        const a = await emailAutomationsApi.update(editing!._id, data);
        setAutomations(prev => prev.map(x => x._id === a._id ? a : x));
        toast.success('Automation updated');
    };

    const handleToggle = async (id: string) => {
        try {
            const a = await emailAutomationsApi.toggle(id);
            setAutomations(prev => prev.map(x => x._id === id ? a : x));
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to toggle'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this automation?')) return;
        try {
            await emailAutomationsApi.delete(id);
            setAutomations(prev => prev.filter(x => x._id !== id));
            toast.success('Automation deleted');
        } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to delete'); }
    };

    const getTriggerInfo = (t: TriggerType) => TRIGGERS.find(x => x.value === t);
    const enabledCount   = automations.filter(a => a.isEnabled).length;
    const totalSent      = stats?.totalSent || 0;

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Automations</h1>
                    <p className="text-muted-foreground mt-1">Configure automatic emails triggered by system events.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={load} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Automation
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Rules',  value: automations.length, color: 'text-foreground' },
                    { label: 'Active',       value: enabledCount,        color: 'text-green-600' },
                    { label: 'Disabled',     value: automations.length - enabledCount, color: 'text-red-600' },
                    { label: 'Emails Sent',  value: totalSent,           color: 'text-primary' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="pt-4 text-center">
                            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Trigger breakdown */}
            {stats?.byTrigger?.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Activity by Trigger</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {stats.byTrigger.map((b: any) => {
                                const info = getTriggerInfo(b._id);
                                return (
                                    <div key={b._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${info?.badge || 'bg-muted text-muted-foreground border-border/40'}`}>
                                        <span className="font-medium">{info?.label || b._id}</span>
                                        <span className="opacity-70">{b.total} rule{b.total !== 1 ? 's' : ''} · {b.sentCount} sent</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Automation List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : automations.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10">
                    <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Automations Yet</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first email automation to get started.</p>
                    <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Automation
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {automations.map(a => {
                        const info = getTriggerInfo(a.trigger);
                        const isExpanded = expanded === a._id;
                        return (
                            <div
                                key={a._id}
                                className={`border rounded-xl overflow-hidden bg-card transition-opacity ${!a.isEnabled ? 'opacity-60' : ''} ${a.isEnabled ? 'border-border/40' : 'border-border/20'}`}
                            >
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <div className={`p-2 rounded-lg ${a.isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                                        <Mail className={`h-4 w-4 ${a.isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground">{a.name}</span>
                                            {info && (
                                                <Badge className={`border text-xs ${info.badge}`}>{info.label}</Badge>
                                            )}
                                            {a.delayHours > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />{a.delayHours}h delay
                                                </span>
                                            )}
                                            {a.isEnabled
                                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                : <AlertCircle  className="h-3.5 w-3.5 text-muted-foreground/50" />
                                            }
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {a.sentCount} emails sent
                                            {a.lastFiredAt ? ` · Last: ${new Date(a.lastFiredAt).toLocaleDateString()}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggle(a._id)}
                                            title={a.isEnabled ? 'Disable' : 'Enable'}
                                            className="h-8 w-8"
                                        >
                                            {a.isEnabled
                                                ? <ToggleRight className="h-5 w-5 text-green-500" />
                                                : <ToggleLeft  className="h-5 w-5 text-muted-foreground" />
                                            }
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setEditing(a); setShowForm(true); }}
                                            className="h-8 w-8"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(a._id)}
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setExpanded(isExpanded ? null : a._id)}
                                            className="h-8 w-8"
                                        >
                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border/40 px-5 py-4 space-y-3 bg-muted/10">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">Email Subject</p>
                                            <p className="text-sm text-foreground font-mono">{a.emailSubject}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">Body preview</p>
                                            <div className="text-xs font-mono text-muted-foreground bg-muted rounded-lg p-3 max-h-24 overflow-y-auto whitespace-pre-wrap border border-border/40">
                                                {a.emailBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300)}…
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <AutomationForm
                    initial={editing || undefined}
                    onSave={editing ? handleUpdate : handleCreate}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            )}
        </div>
    );
}
