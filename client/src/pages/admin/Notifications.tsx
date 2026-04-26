import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Briefcase, Check, ClipboardList, Clock, FileBox, FolderOpen, Info, Loader2, MessageSquare, Paperclip, Plus, RefreshCw, Reply, Save, Settings2, TicketCheck, Trash2, UserCheck, UserPlus, UserX, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationSoundsApi, type NotificationSound, type NotificationSoundRule, type NotificationTypeOption } from '../../api/notificationSounds.api';

export default function Notifications() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshSoundConfig,
    } = useNotifications({ enableToast: false, enableSound: false });

    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [sounds, setSounds] = useState<NotificationSound[]>([]);
    const [rules, setRules] = useState<NotificationSoundRule[]>([]);
    const [notificationTypes, setNotificationTypes] = useState<NotificationTypeOption[]>([]);
    const [audiences, setAudiences] = useState<string[]>([]);
    const [managerLoading, setManagerLoading] = useState(true);
    const [uploadingSound, setUploadingSound] = useState(false);
    const [savingRule, setSavingRule] = useState(false);
    const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [soundFile, setSoundFile] = useState<File | null>(null);
    const [soundForm, setSoundForm] = useState({ name: '', fileUrl: '', isActive: true });
    const [ruleForm, setRuleForm] = useState({
        audience: 'admin',
        notificationType: '',
        soundId: '',
        label: '',
        isEnabled: true,
        isImportant: true,
        volume: 0.85,
        cooldownMs: 2500,
    });

    const filtered = filter === 'all' ? notifications : notifications.filter((n) => !n.isRead);

    const rulesByAudience = useMemo(() => {
        return audiences.map((audience) => ({
            audience,
            items: rules.filter((rule) => rule.audience === audience),
        }));
    }, [audiences, rules]);

    const loadManagerData = async () => {
        try {
            setManagerLoading(true);
            const res = await notificationSoundsApi.getAdminData();
            const nextSounds = res.data.data.sounds || [];
            const nextRules = res.data.data.rules || [];
            const nextTypes = res.data.data.notificationTypes || [];
            const nextAudiences = res.data.data.audiences || [];

            setSounds(nextSounds);
            setRules(nextRules);
            setNotificationTypes(nextTypes);
            setAudiences(nextAudiences);

            setRuleForm((prev) => ({
                ...prev,
                audience: prev.audience || nextAudiences[0] || 'admin',
                notificationType: prev.notificationType || nextTypes[0]?.value || '',
                soundId: prev.soundId || nextSounds[0]?._id || '',
            }));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to load sound manager');
        } finally {
            setManagerLoading(false);
        }
    };

    useEffect(() => {
        loadManagerData();
    }, []);

    const resetSoundForm = () => {
        setEditingSoundId(null);
        setSoundFile(null);
        setSoundForm({ name: '', fileUrl: '', isActive: true });
    };

    const resetRuleForm = () => {
        setEditingRuleId(null);
        setRuleForm({
            audience: audiences[0] || 'admin',
            notificationType: notificationTypes[0]?.value || '',
            soundId: sounds[0]?._id || '',
            label: '',
            isEnabled: true,
            isImportant: true,
            volume: 0.85,
            cooldownMs: 2500,
        });
    };

    const submitSound = async () => {
        if (!soundForm.name.trim()) {
            toast.error('Sound name is required');
            return;
        }
        if (!editingSoundId && !soundFile && !soundForm.fileUrl.trim()) {
            toast.error('Choose an audio file or enter a sound URL');
            return;
        }

        const formData = new FormData();
        formData.append('name', soundForm.name.trim());
        formData.append('isActive', String(soundForm.isActive));
        if (soundForm.fileUrl.trim()) formData.append('fileUrl', soundForm.fileUrl.trim());
        if (soundFile) formData.append('audio', soundFile);

        try {
            setUploadingSound(true);
            if (editingSoundId) {
                await notificationSoundsApi.updateSound(editingSoundId, formData);
                toast.success('Notification sound updated');
            } else {
                await notificationSoundsApi.createSound(formData);
                toast.success('Notification sound created');
            }
            resetSoundForm();
            await loadManagerData();
            await refreshSoundConfig();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save sound');
        } finally {
            setUploadingSound(false);
        }
    };

    const submitRule = async () => {
        if (!ruleForm.notificationType || !ruleForm.soundId) {
            toast.error('Notification type and sound are required');
            return;
        }

        try {
            setSavingRule(true);
            if (editingRuleId) {
                await notificationSoundsApi.updateRule(editingRuleId, ruleForm);
                toast.success('Sound rule updated');
            } else {
                await notificationSoundsApi.createRule(ruleForm);
                toast.success('Sound rule created');
            }
            resetRuleForm();
            await loadManagerData();
            await refreshSoundConfig();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save rule');
        } finally {
            setSavingRule(false);
        }
    };

    const startEditSound = (sound: NotificationSound) => {
        setEditingSoundId(sound._id);
        setSoundFile(null);
        setSoundForm({ name: sound.name, fileUrl: sound.fileUrl, isActive: sound.isActive });
    };

    const startEditRule = (rule: NotificationSoundRule) => {
        setEditingRuleId(rule._id);
        setRuleForm({
            audience: rule.audience,
            notificationType: rule.notificationType,
            soundId: typeof rule.soundId === 'string' ? rule.soundId : rule.soundId._id,
            label: rule.label || '',
            isEnabled: rule.isEnabled,
            isImportant: rule.isImportant,
            volume: rule.volume,
            cooldownMs: rule.cooldownMs,
        });
    };

    const removeSound = async (id: string) => {
        try {
            await notificationSoundsApi.deleteSound(id);
            toast.success('Sound deleted');
            await loadManagerData();
            await refreshSoundConfig();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete sound');
        }
    };

    const removeRule = async (id: string) => {
        try {
            await notificationSoundsApi.deleteRule(id);
            toast.success('Rule deleted');
            await loadManagerData();
            await refreshSoundConfig();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete rule');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'project_accepted': return <UserCheck className="h-5 w-5 text-emerald-500" />;
            case 'project_rejected': return <UserX className="h-5 w-5 text-red-500" />;
            case 'project_assigned': return <FolderOpen className="h-5 w-5 text-blue-500" />;
            case 'project_submitted': return <FolderOpen className="h-5 w-5 text-violet-500" />;
            case 'status_updated': return <RefreshCw className="h-5 w-5 text-amber-500" />;
            case 'task_assigned': return <ClipboardList className="h-5 w-5 text-sky-500" />;
            case 'file_received': return <Paperclip className="h-5 w-5 text-purple-500" />;
            case 'message': return <MessageSquare className="h-5 w-5 text-primary" />;
            case 'ticket_submitted': return <TicketCheck className="h-5 w-5 text-amber-500" />;
            case 'ticket_reply': return <Reply className="h-5 w-5 text-blue-500" />;
            case 'ticket_status_updated': return <RefreshCw className="h-5 w-5 text-teal-500" />;
            case 'application_received': return <Briefcase className="h-5 w-5 text-indigo-500" />;
            case 'application_status_updated': return <Briefcase className="h-5 w-5 text-emerald-500" />;
            case 'resource_added': return <FileBox className="h-5 w-5 text-cyan-500" />;
            case 'user_registered': return <UserPlus className="h-5 w-5 text-violet-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60 * 1000) return 'Just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Manage alerts and build role-based notification sounds.</p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>Mark all as read</Button>
                    )}
                    {notifications.length > 0 && (
                        <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={clearAll}>
                            <Trash2 className="h-4 w-4" /> Clear all
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="feed" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="feed">Notification Feed</TabsTrigger>
                    <TabsTrigger value="sounds">Sound Manager</TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="space-y-6">
                    <div className="flex gap-2 pb-2">
                        <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
                        <Button variant={filter === 'unread' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('unread')}>
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>No notifications found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filtered.map((notification) => (
                                <Card key={notification._id} className={!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}>
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className="mt-1 bg-background p-2 rounded-full border shadow-sm">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>{notification.title}</p>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2 shrink-0">
                                                    <Clock className="h-3 w-3" /> {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            {!notification.isRead && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => markAsRead(notification._id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notification._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sounds" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-primary" />Sound Library</CardTitle>
                                <CardDescription>Add new audio files or point rules to custom URLs.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Sound Name</Label>
                                    <Input value={soundForm.name} onChange={(e) => setSoundForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Important Notification" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Upload Audio</Label>
                                    <Input type="file" accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*" onChange={(e) => setSoundFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>External or Local URL</Label>
                                    <Input value={soundForm.fileUrl} onChange={(e) => setSoundForm((prev) => ({ ...prev, fileUrl: e.target.value }))} placeholder="/notification-sounds/important-notification.mp3" />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border p-3">
                                    <div>
                                        <p className="text-sm font-medium">Sound Active</p>
                                        <p className="text-xs text-muted-foreground">Inactive sounds stay saved but no rule should play them.</p>
                                    </div>
                                    <Switch checked={soundForm.isActive} onCheckedChange={(checked) => setSoundForm((prev) => ({ ...prev, isActive: checked }))} />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={submitSound} disabled={uploadingSound} className="gap-2">
                                        {uploadingSound ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSoundId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {editingSoundId ? 'Update Sound' : 'Add Sound'}
                                    </Button>
                                    {editingSoundId && <Button variant="outline" onClick={resetSoundForm}>Cancel</Button>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />Rule Builder</CardTitle>
                                <CardDescription>Map sounds to specific notification types for admin, team, user, or public audiences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Audience</Label>
                                        <Select value={ruleForm.audience} onValueChange={(value) => setRuleForm((prev) => ({ ...prev, audience: value }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {audiences.map((audience) => <SelectItem key={audience} value={audience}>{audience}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notification Type</Label>
                                        <Select value={ruleForm.notificationType} onValueChange={(value) => setRuleForm((prev) => ({ ...prev, notificationType: value }))}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                {notificationTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sound</Label>
                                        <Select value={ruleForm.soundId} onValueChange={(value) => setRuleForm((prev) => ({ ...prev, soundId: value }))}>
                                            <SelectTrigger><SelectValue placeholder="Select sound" /></SelectTrigger>
                                            <SelectContent>
                                                {sounds.map((sound) => <SelectItem key={sound._id} value={sound._id}>{sound.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rule Label</Label>
                                        <Input value={ruleForm.label} onChange={(e) => setRuleForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="Important client update" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Volume</Label>
                                        <Input type="number" min="0" max="1" step="0.05" value={ruleForm.volume} onChange={(e) => setRuleForm((prev) => ({ ...prev, volume: Number(e.target.value) }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cooldown (ms)</Label>
                                        <Input type="number" min="0" max="60000" step="100" value={ruleForm.cooldownMs} onChange={(e) => setRuleForm((prev) => ({ ...prev, cooldownMs: Number(e.target.value) }))} />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-xl border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Rule Enabled</p>
                                            <p className="text-xs text-muted-foreground">Turn this notification sound on or off.</p>
                                        </div>
                                        <Switch checked={ruleForm.isEnabled} onCheckedChange={(checked) => setRuleForm((prev) => ({ ...prev, isEnabled: checked }))} />
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Important Flag</p>
                                            <p className="text-xs text-muted-foreground">Use this to mark the rule as a high-priority alert.</p>
                                        </div>
                                        <Switch checked={ruleForm.isImportant} onCheckedChange={(checked) => setRuleForm((prev) => ({ ...prev, isImportant: checked }))} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={submitRule} disabled={savingRule} className="gap-2">
                                        {savingRule ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRuleId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {editingRuleId ? 'Update Rule' : 'Add Rule'}
                                    </Button>
                                    {editingRuleId && <Button variant="outline" onClick={resetRuleForm}>Cancel</Button>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {managerLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6 xl:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Saved Sounds</CardTitle>
                                    <CardDescription>Preview, edit, and reuse uploaded notification sounds.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {sounds.map((sound) => (
                                        <div key={sound._id} className="rounded-xl border p-4 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium">{sound.name}</p>
                                                    {sound.isDefault && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Default</span>}
                                                    {!sound.isActive && <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Inactive</span>}
                                                </div>
                                                <p className="mt-1 break-all text-xs text-muted-foreground">{sound.fileUrl}</p>
                                                <audio controls className="mt-3 w-full max-w-sm">
                                                    <source src={sound.fileUrl} type={sound.mimeType || 'audio/mpeg'} />
                                                </audio>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button variant="outline" size="sm" onClick={() => startEditSound(sound)}>Edit</Button>
                                                {!sound.isDefault && (
                                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeSound(sound._id)}>
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Audience Rules</CardTitle>
                                    <CardDescription>Each dashboard audience can have its own sound behavior.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {rulesByAudience.map(({ audience, items }) => (
                                        <div key={audience} className="rounded-xl border p-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium capitalize">{audience}</h4>
                                                <span className="text-xs text-muted-foreground">{items.length} rules</span>
                                            </div>
                                            <div className="mt-3 space-y-3">
                                                {items.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">No rules configured yet.</p>
                                                ) : items.map((rule) => {
                                                    const sound = typeof rule.soundId === 'string'
                                                        ? sounds.find((item) => item._id === rule.soundId)
                                                        : rule.soundId;
                                                    const typeLabel = notificationTypes.find((item) => item.value === rule.notificationType)?.label || rule.notificationType;
                                                    return (
                                                        <div key={rule._id} className="rounded-lg border bg-muted/20 p-3 flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-medium">{typeLabel}</p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    {rule.label || 'No custom label'} | {sound?.name || 'Unknown sound'} | Vol {rule.volume} | {rule.cooldownMs}ms
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0">
                                                                <Button variant="outline" size="sm" onClick={() => startEditRule(rule)}>Edit</Button>
                                                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeRule(rule._id)}>Delete</Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
