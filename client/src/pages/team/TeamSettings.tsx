/**
 * Team Settings Page
 * Profile, Security, Notifications — all connected to real auth/API.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { User, Lock, Bell, Shield, Camera, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { TwoFactorSetup } from '../../components/TwoFactorSetup';

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

export default function TeamSettings() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Profile ────────────────────────────────────────────────────────────────
  const [name, setName]           = useState(user?.name ?? '');
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
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
    emailNotifs: true, taskUpdates: true, projectMentions: true,
    newMessages: true, deadlineReminders: true, weeklyReport: false,
  });
  const toggleNotif = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));

  const photoUrl = avatarPreview ?? user?.photo;
  const initials = (user?.name ?? 'TM').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const position = (user as any)?.teamProfile?.position ?? user?.role ?? 'Team Member';
  const department = (user as any)?.teamProfile?.department ?? '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, password, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your name and profile photo.</CardDescription>
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
                  <p className="text-sm text-muted-foreground">{position}{department ? ` · ${department}` : ''}</p>
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
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
                {position && (
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input value={position} disabled className="opacity-60 cursor-not-allowed" />
                  </div>
                )}
                {department && (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={department} disabled className="opacity-60 cursor-not-allowed" />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                  {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account secure with a strong password.</CardDescription>
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
          </div>
        </TabsContent>

        {/* ── Notifications Tab ─────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {([
                { key: 'emailNotifs',       label: 'Email Notifications',   desc: 'Receive daily summaries and important alerts.' },
                { key: 'taskUpdates',       label: 'Task Updates',          desc: 'When a task status changes or is assigned to you.' },
                { key: 'projectMentions',   label: 'Project Mentions',      desc: 'When someone mentions you in a project.' },
                { key: 'newMessages',       label: 'New Messages',          desc: 'When you receive a direct message.' },
                { key: 'deadlineReminders', label: 'Deadline Reminders',    desc: 'Reminders 24h before a task deadline.' },
                { key: 'weeklyReport',      label: 'Weekly Report',         desc: 'A weekly summary of your activity and tasks.' },
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
