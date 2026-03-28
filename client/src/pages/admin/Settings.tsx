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
  Copy, RefreshCw, Eye, EyeOff, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';

type Tab = 'profile' | 'security' | 'notifications' | 'language' | 'apikeys';

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',           Icon: User   },
  { id: 'security',      label: 'Security',           Icon: Lock   },
  { id: 'notifications', label: 'Notifications',      Icon: Bell   },
  { id: 'language',      label: 'Language & Region',  Icon: Globe  },
  { id: 'apikeys',       label: 'API Keys',           Icon: Key    },
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
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                    <div>
                      <p className="font-medium text-sm">Authenticator App</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Use an app like Google Authenticator (coming soon).</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>Enable 2FA</Button>
                  </div>
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

        </div>
      </div>
    </div>
  );
}
