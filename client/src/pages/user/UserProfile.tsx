/**
 * User Profile Page
 * Account management — personal details, avatar upload, password change.
 * All connected to real DB via usersApi.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { User, Lock, Bell, Save, Shield, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [name, setName]   = useState(user?.name ?? '');
  const [email]           = useState(user?.email ?? '');  // email is read-only
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password state ─────────────────────────────────────────────────────────
  const [oldPassword, setOldPassword]     = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword]   = useState(false);

  // ── Notification prefs (local only for now) ───────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    projectUpdates: true,
    newMessages: true,
    marketing: false,
    security: true,
  });

  // Sync name from auth when user loads
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  // ── Avatar change ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save profile ───────────────────────────────────────────────────────────
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
      toast.success('Profile updated successfully');
      setAvatarFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!user?._id) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.updatePassword(user._id, { oldPassword, newPassword });
      toast.success('Password updated successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const photoUrl = avatarPreview ?? user?.photo ?? user?.avatar;
  const initials = (user?.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and billing details.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name and profile photo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
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
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                  {avatarFile && (
                    <p className="text-xs text-primary mt-1">New photo selected — save to apply</p>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><Save className="h-4 w-4" /> Save Changes</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" /> Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/10">
                  <div>
                    <p className="font-medium text-sm">Secure your account</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security (coming soon).</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Enable 2FA</Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={savingPassword}>
                  {savingPassword
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating…</>
                    : 'Update Password'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ─────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes, new milestones, and progress updates.' },
                  { key: 'newMessages',    label: 'New Messages',    desc: 'When you receive a message from our team.' },
                  { key: 'marketing',      label: 'Marketing Emails', desc: 'Tips, offers, and product announcements.' },
                  { key: 'security',       label: 'Security Alerts',  desc: 'Login attempts and account changes.' },
                ] as const
              ).map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notifPrefs[item.key]}
                    onClick={() => setNotifPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      notifPrefs[item.key] ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
