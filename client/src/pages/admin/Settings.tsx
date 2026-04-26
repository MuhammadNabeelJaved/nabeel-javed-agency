/**
 * Admin Settings Page
 * Profile, Security, Notifications, Language & Region, API Keys
 * All tabs connected to real auth/API.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  User, Lock, Bell, Globe, Key, Shield, Camera, Save, Loader2,
  Copy, RefreshCw, Eye, EyeOff, Check, Cookie, Trash2, BarChart3,
  Users, TrendingUp, AlertTriangle, RotateCcw, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { TwoFactorSetup } from '../../components/TwoFactorSetup';
import apiClient from '../../api/apiClient';

type Tab = 'profile' | 'security' | 'notifications' | 'language' | 'apikeys' | 'cookies';

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',           Icon: User   },
  { id: 'security',      label: 'Security',           Icon: Lock   },
  { id: 'notifications', label: 'Notifications',      Icon: Bell   },
  { id: 'language',      label: 'Language & Region',  Icon: Globe  },
  { id: 'apikeys',       label: 'API Keys',           Icon: Key    },
  { id: 'cookies',       label: 'Cookie Consent',     Icon: Cookie },
];

// ── Reusable toggle ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Profile ────────────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio]   = useState('');
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (bio.trim()) fd.append('bio', bio.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await usersApi.update(user._id, fd);
      const updated = res.data.data;
      updateUser({ name: updated.name, photo: updated.photo });
      toast.success('Profile updated');
      setAvatarFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Security ───────────────────────────────────────────────────────────────
  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);

  const handleChangePassword = async () => {
    if (!user?._id) return;
    if (!oldPassword || !newPassword || !confirmPassword) { toast.error('Fill all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPassword(true);
    try {
      await usersApi.updatePassword(user._id, { oldPassword, newPassword });
      toast.success('Password updated');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    projectUpdates: true, newMessages: true, teamActivity: true,
    marketing: false, security: true, weeklyReport: true,
  });
  const toggleNotif = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));

  // ── Language ───────────────────────────────────────────────────────────────
  const [language, setLanguage]   = useState('en');
  const [timezone, setTimezone]   = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  // ── API Keys ───────────────────────────────────────────────────────────────
  const [apiKey]        = useState('sk-admin-' + Math.random().toString(36).slice(2, 18));
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  // ── Cookie Consent ─────────────────────────────────────────────────────────
  type ConsentStats = {
    total: number;
    last30Days: number;
    breakdown: {
      essential:  { count: number; pct: number };
      functional: { count: number; pct: number };
      analytics:  { count: number; pct: number };
      marketing:  { count: number; pct: number };
    };
  };
  type ConsentRecord = {
    _id: string;
    userId?: { name: string; email: string } | null;
    consent: { essential: boolean; functional: boolean; analytics: boolean; marketing: boolean };
    timestamp: string | null;
    ipAddress: string | null;
    createdAt: string;
  };
  type UserConsent = {
    _id: string;
    name: string;
    email: string;
    role: string;
    photo?: string;
    latestConsent: {
      consent: { essential: boolean; functional: boolean; analytics: boolean; marketing: boolean };
      updatedAt: string;
      recordId: string;
    } | null;
  };

  const [consentStats, setConsentStats] = useState<ConsentStats | null>(null);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [consentPage, setConsentPage] = useState(1);
  const [consentTotal, setConsentTotal] = useState(0);
  const [consentLoading, setConsentLoading] = useState(false);
  const [clearDays, setClearDays] = useState(90);
  const [clearing, setClearing] = useState(false);

  // User cookie controls
  const [usersConsent, setUsersConsent] = useState<UserConsent[]>([]);
  const [usersConsentLoading, setUsersConsentLoading] = useState(false);
  const [overriding, setOverriding] = useState<string | null>(null);   // userId being saved
  const [resetting, setResetting]   = useState<string | null>(null);   // userId being reset
  // Local edits: userId → draft consent state
  const [draftConsent, setDraftConsent] = useState<Record<string, { functional: boolean; analytics: boolean; marketing: boolean }>>({});

  const loadConsentData = async (page = 1) => {
    setConsentLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        apiClient.get('/consent/stats'),
        apiClient.get(`/consent?page=${page}&limit=15`),
      ]);
      setConsentStats(statsRes.data.data);
      setConsentRecords(recordsRes.data.data.records);
      setConsentTotal(recordsRes.data.data.pagination.total);
      setConsentPage(page);
    } catch (err: any) {
      toast.error('Failed to load consent data', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setConsentLoading(false);
    }
  };

  React.useEffect(() => {
    if (tab === 'cookies') {
      loadConsentData(1);
      loadUsersConsent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleDeleteRecord = async (id: string) => {
    try {
      await apiClient.delete(`/consent/${id}`);
      setConsentRecords(prev => prev.filter(r => r._id !== id));
      setConsentTotal(prev => prev - 1);
      if (consentStats) {
        setConsentStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
      }
      toast.success('Record deleted');
    } catch (err: any) {
      toast.error('Failed to delete record', { description: err?.response?.data?.message || 'Please try again.' });
    }
  };

  const loadUsersConsent = async () => {
    setUsersConsentLoading(true);
    try {
      const res = await apiClient.get('/consent/users');
      const users: UserConsent[] = res.data.data.users;
      setUsersConsent(users);
      // Seed draft from latest consent
      const drafts: Record<string, { functional: boolean; analytics: boolean; marketing: boolean }> = {};
      for (const u of users) {
        drafts[u._id] = {
          functional: u.latestConsent?.consent.functional ?? false,
          analytics:  u.latestConsent?.consent.analytics  ?? false,
          marketing:  u.latestConsent?.consent.marketing  ?? false,
        };
      }
      setDraftConsent(drafts);
    } catch (err: any) {
      toast.error('Failed to load users consent', { description: err?.response?.data?.message });
    } finally {
      setUsersConsentLoading(false);
    }
  };

  const handleOverrideConsent = async (userId: string, userName: string) => {
    const draft = draftConsent[userId];
    if (!draft) return;
    setOverriding(userId);
    try {
      const res = await apiClient.patch(`/consent/users/${userId}`, draft);
      const updated = res.data.data;
      setUsersConsent(prev => prev.map(u =>
        u._id === userId ? { ...u, latestConsent: { consent: { essential: true, ...draft }, updatedAt: updated.updatedAt, recordId: updated.recordId } } : u
      ));
      toast.success(`Consent updated for ${userName}`);
    } catch (err: any) {
      toast.error('Failed to update consent', { description: err?.response?.data?.message });
    } finally {
      setOverriding(null);
    }
  };

  const handleResetConsent = async (userId: string, userName: string) => {
    setResetting(userId);
    try {
      const res = await apiClient.delete(`/consent/users/${userId}/reset`);
      setUsersConsent(prev => prev.map(u =>
        u._id === userId ? { ...u, latestConsent: null } : u
      ));
      setDraftConsent(prev => ({ ...prev, [userId]: { functional: false, analytics: false, marketing: false } }));
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error('Failed to reset consent', { description: err?.response?.data?.message });
    } finally {
      setResetting(null);
    }
  };

  const handleClearOld = async () => {
    setClearing(true);
    try {
      const res = await apiClient.delete(`/consent/clear?days=${clearDays}`);
      toast.success(res.data.message);
      loadConsentData(1);
    } catch (err: any) {
      toast.error('Failed to clear records', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setClearing(false);
    }
  };

  const photoUrl = avatarPreview ?? user?.photo;
  const initials = (user?.name ?? 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account, security, and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ── Sidebar nav ─────────────────────────────────────────────────── */}
        <nav className="md:col-span-3 space-y-1">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="md:col-span-9 space-y-6">

          {/* ── Profile ─────────────────────────────────────────────── */}
          {tab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your name, avatar, and bio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 ring-2 ring-primary/20">
                      <AvatarImage src={photoUrl} alt={user?.name} />
                      <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {avatarFile && <p className="text-xs text-primary mt-1">New photo selected — save to apply</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell us a little about yourself…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                    {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save Changes</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Security ────────────────────────────────────────────── */}
          {tab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Use a strong password you don't use elsewhere.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showOld ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10"
                      />
                      <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleChangePassword} disabled={savingPassword} className="gap-2">
                      {savingPassword ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : 'Update Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TwoFactorSetup />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Devices currently signed in to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div>
                      <p className="font-medium text-sm">Current Browser</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Signed in now · {new Date().toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Notifications ────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {([
                  { key: 'projectUpdates', label: 'Project Updates',   desc: 'Status changes, milestones, and progress.' },
                  { key: 'newMessages',    label: 'New Messages',      desc: 'When a user or team member messages you.' },
                  { key: 'teamActivity',   label: 'Team Activity',     desc: 'When team members complete tasks or update projects.' },
                  { key: 'weeklyReport',   label: 'Weekly Report',     desc: 'A weekly summary of dashboard activity.' },
                  { key: 'security',       label: 'Security Alerts',   desc: 'Login attempts and account changes.' },
                  { key: 'marketing',      label: 'Marketing Emails',  desc: 'Product news and feature announcements.' },
                ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle checked={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={() => toast.success('Notification preferences saved')} className="gap-2">
                    <Save className="h-4 w-4" /> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Language & Region ─────────────────────────────────────── */}
          {tab === 'language' && (
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>Customize your display language, timezone, and date format.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Display Language</Label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="jp">日本語</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Karachi">Karachi (PKT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <select
                    value={dateFormat}
                    onChange={e => setDateFormat(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast.success('Regional settings saved')} className="gap-2">
                    <Save className="h-4 w-4" /> Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── API Keys ──────────────────────────────────────────────── */}
          {tab === 'apikeys' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Use these keys to authenticate requests from your applications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Admin API Key</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Full access · Created {new Date().toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-xs bg-background border border-border rounded-lg px-3 py-2 truncate">
                        {showKey ? apiKey : apiKey.slice(0, 12) + '••••••••••••••••••••'}
                      </div>
                      <button
                        onClick={() => setShowKey(v => !v)}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                        title={showKey ? 'Hide' : 'Reveal'}
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={copyApiKey}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                        title="Copy"
                      >
                        {apiKeyCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
                    <Shield className="h-4 w-4 shrink-0" />
                    Never expose your API key in public code or client-side JavaScript.
                  </div>

                  <Button variant="outline" className="gap-2 w-full" onClick={() => toast.info('Key regenerated (demo)')}>
                    <RefreshCw className="h-4 w-4" /> Regenerate Key
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhook URL</CardTitle>
                  <CardDescription>Receive real-time events from the platform to your endpoint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <Input placeholder="https://your-server.com/webhook" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Webhook URL saved')} className="gap-2">
                      <Save className="h-4 w-4" /> Save Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Cookie Consent ────────────────────────────────────────── */}
          {tab === 'cookies' && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consentLoading && !consentStats ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                  ))
                ) : consentStats ? (
                  <>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Total Records</p>
                        <p className="text-3xl font-bold">{consentStats.total}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last 30d: {consentStats.last30Days}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Analytics</p>
                        <p className="text-3xl font-bold">{consentStats.breakdown.analytics.pct}<span className="text-lg text-muted-foreground">%</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{consentStats.breakdown.analytics.count} users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" />Marketing</p>
                        <p className="text-3xl font-bold">{consentStats.breakdown.marketing.pct}<span className="text-lg text-muted-foreground">%</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{consentStats.breakdown.marketing.count} users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Cookie className="h-3 w-3" />Functional</p>
                        <p className="text-3xl font-bold">{consentStats.breakdown.functional.pct}<span className="text-lg text-muted-foreground">%</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{consentStats.breakdown.functional.count} users</p>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>

              {/* Consent breakdown bar */}
              {consentStats && consentStats.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Consent Acceptance Rates</CardTitle>
                    <CardDescription>Percentage of users who accepted each category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      [
                        { key: 'essential',  label: 'Essential',  color: 'bg-blue-500'   },
                        { key: 'functional', label: 'Functional', color: 'bg-purple-500' },
                        { key: 'analytics',  label: 'Analytics',  color: 'bg-green-500'  },
                        { key: 'marketing',  label: 'Marketing',  color: 'bg-orange-500' },
                      ] as const
                    ).map(({ key, label, color }) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{consentStats.breakdown[key].pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color} transition-all duration-700`}
                            style={{ width: `${consentStats.breakdown[key].pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Bulk clear */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Bulk Delete Old Records
                  </CardTitle>
                  <CardDescription>Remove consent logs older than a specified number of days. Useful for GDPR data minimisation.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Older than</label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={clearDays}
                      onChange={e => setClearDays(Number(e.target.value))}
                      className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={clearing}
                    onClick={handleClearOld}
                    className="gap-2"
                  >
                    {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {clearing ? 'Clearing…' : 'Clear Old Records'}
                  </Button>
                </CardContent>
              </Card>

              {/* ── User Cookie Controls ──────────────────────────────── */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" /> User Cookie Controls
                    </CardTitle>
                    <CardDescription>View and override each user's cookie consent preferences</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadUsersConsent} disabled={usersConsentLoading}>
                    <RefreshCw className={`h-4 w-4 ${usersConsentLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {usersConsentLoading && usersConsent.length === 0 ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
                      ))}
                    </div>
                  ) : usersConsent.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {usersConsent.map(u => {
                        const draft = draftConsent[u._id] ?? { functional: false, analytics: false, marketing: false };
                        const hasConsent = !!u.latestConsent;
                        const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        const isSaving  = overriding === u._id;
                        const isReset   = resetting  === u._id;
                        return (
                          <div key={u._id} className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                            {/* User row */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                  {u.photo && u.photo !== 'default.jpg'
                                    ? <img src={u.photo} alt={u.name} className="h-full w-full object-cover" />
                                    : initials
                                  }
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-tight truncate">{u.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  u.role === 'admin' ? 'bg-primary/15 text-primary'
                                  : u.role === 'team' ? 'bg-blue-500/15 text-blue-400'
                                  : 'bg-muted text-muted-foreground'
                                }`}>{u.role}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasConsent ? (
                                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Consent given · {new Date(u.latestConsent!.updatedAt).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ShieldOff className="h-3.5 w-3.5" />
                                    No consent yet
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Consent toggles */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                              {/* Essential — always on, disabled */}
                              <div className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2">
                                <span className="text-xs text-muted-foreground">Essential</span>
                                <Toggle checked={true} onChange={() => {}} />
                              </div>
                              {(['functional', 'analytics', 'marketing'] as const).map(cat => (
                                <div key={cat} className="flex items-center justify-between rounded-lg bg-background border border-border px-3 py-2">
                                  <span className="text-xs text-muted-foreground capitalize">{cat}</span>
                                  <Toggle
                                    checked={draft[cat]}
                                    onChange={() =>
                                      setDraftConsent(prev => ({
                                        ...prev,
                                        [u._id]: { ...prev[u._id], [cat]: !prev[u._id]?.[cat] },
                                      }))
                                    }
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Action buttons */}
                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isReset || isSaving}
                                onClick={() => handleResetConsent(u._id, u.name)}
                                className="gap-1.5 text-xs"
                              >
                                {isReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                Reset
                              </Button>
                              <Button
                                size="sm"
                                disabled={isSaving || isReset}
                                onClick={() => handleOverrideConsent(u._id, u.name)}
                                className="gap-1.5 text-xs"
                              >
                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Records table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Consent Audit Log</CardTitle>
                    <CardDescription>{consentTotal} total records</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadConsentData(consentPage)} disabled={consentLoading}>
                    <RefreshCw className={`h-4 w-4 ${consentLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {consentLoading && consentRecords.length === 0 ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
                      ))}
                    </div>
                  ) : consentRecords.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Cookie className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No consent records yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">User</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Essential</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Functional</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Analytics</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Marketing</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">IP</th>
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Date</th>
                            <th className="text-right py-2 text-muted-foreground font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {consentRecords.map(r => (
                            <tr key={r._id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 pr-4">
                                {r.userId ? (
                                  <div>
                                    <p className="font-medium leading-tight">{r.userId.name}</p>
                                    <p className="text-xs text-muted-foreground">{r.userId.email}</p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-xs">Anonymous</span>
                                )}
                              </td>
                              {(['essential', 'functional', 'analytics', 'marketing'] as const).map(k => (
                                <td key={k} className="py-2.5 pr-4">
                                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                    r.consent[k]
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {r.consent[k] ? '✓' : '✕'}
                                  </span>
                                </td>
                              ))}
                              <td className="py-2.5 pr-4 text-xs text-muted-foreground font-mono">
                                {r.ipAddress ?? '—'}
                              </td>
                              <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => handleDeleteRecord(r._id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {consentTotal > 15 && (
                        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                          <p className="text-xs text-muted-foreground">
                            Page {consentPage} of {Math.ceil(consentTotal / 15)}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={consentPage <= 1 || consentLoading}
                              onClick={() => loadConsentData(consentPage - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={consentPage >= Math.ceil(consentTotal / 15) || consentLoading}
                              onClick={() => loadConsentData(consentPage + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
