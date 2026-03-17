import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Lock, Palette, Bell, Link2, Camera, Eye, EyeOff,
  Github, Monitor, LogOut, Shield, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { toast } from 'sonner';

const accentColors = [
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
];

const activeSessions = [
  { device: 'Chrome on Windows 11', ip: '192.168.1.1', lastActive: 'Now', current: true },
  { device: 'Safari on iPhone 15', ip: '172.16.0.45', lastActive: '2 hours ago', current: false },
  { device: 'Firefox on MacBook', ip: '10.0.0.23', lastActive: '1 day ago', current: false },
];

const integrations = [
  { id: 'github', name: 'GitHub', desc: 'Connect your repositories', icon: Github, connected: true },
  { id: 'analytics', name: 'Google Analytics', desc: 'Track website performance', icon: Monitor, connected: false },
  { id: 'slack', name: 'Slack', desc: 'Receive notifications in Slack', icon: Link2, connected: true },
];

export default function Settings() {
  // Profile
  const [profile, setProfile] = useState({
    name: 'Admin User', email: 'admin@agency.com', bio: 'Agency founder and lead developer.', phone: '+1 415-555-0100',
  });

  // Security
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [twoFA, setTwoFA] = useState(false);

  // Appearance
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('#8b5cf6');

  // Notifications
  const [notifSettings, setNotifSettings] = useState({
    emailMessages: true, emailProjects: true, emailBilling: false,
    pushMessages: true, pushProjects: false, pushSystem: true,
  });

  // Integrations
  const [connectedIntegrations, setConnectedIntegrations] = useState(
    integrations.reduce((acc, i) => ({ ...acc, [i.id]: i.connected }), {})
  );

  const handleSaveProfile = () => toast.success('Profile saved successfully');
  const handleChangePassword = () => {
    if (!passwords.current || !passwords.newPass) { toast.error('All fields required'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    toast.success('Password changed successfully');
    setPasswords({ current: '', newPass: '', confirm: '' });
  };
  const handleSaveAppearance = () => toast.success('Appearance settings saved');
  const handleSaveNotifications = () => toast.success('Notification preferences saved');
  const toggleIntegration = (id) => {
    setConnectedIntegrations((prev) => {
      const newVal = !prev[id];
      toast.success(newVal ? `${id} connected` : `${id} disconnected`);
      return { ...prev, [id]: newVal };
    });
  };
  const revokeSession = (index) => toast.success('Session revoked');

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
            {[
              { value: 'profile', label: 'Profile', Icon: User },
              { value: 'security', label: 'Security', Icon: Lock },
              { value: 'appearance', label: 'Appearance', Icon: Palette },
              { value: 'notifications', label: 'Notifications', Icon: Bell },
              { value: 'integrations', label: 'Integrations', Icon: Link2 },
            ].map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400 gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      A
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-gray-950 flex items-center justify-center hover:bg-violet-500">
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-white font-medium">{profile.name}</p>
                    <p className="text-gray-500 text-sm">Admin</p>
                    <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 text-xs h-7 px-2 mt-1">
                      Upload photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Full Name</label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Email</label>
                    <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Phone</label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-9" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Bio</label>
                  <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={3} />
                </div>
                <Button onClick={handleSaveProfile} variant="glow" className="gap-2">
                  <Check className="w-3.5 h-3.5" /> Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { field: 'current', label: 'Current Password' },
                  { field: 'newPass', label: 'New Password' },
                  { field: 'confirm', label: 'Confirm New Password' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="text-gray-400 text-xs mb-1 block">{label}</label>
                    <div className="relative">
                      <Input
                        type={showPass[field] ? 'text' : 'password'}
                        value={passwords[field]}
                        onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                        className="bg-white/5 border-white/10 text-white h-9 pr-9"
                        placeholder="••••••••"
                      />
                      <button
                        onClick={() => setShowPass((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPass[field] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button onClick={handleChangePassword} variant="glow" className="gap-2">
                  <Lock className="w-3.5 h-3.5" /> Change Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Enable 2FA</p>
                    <p className="text-gray-500 text-xs mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <Switch checked={twoFA} onCheckedChange={setTwoFA}
                    className="data-[state=checked]:bg-violet-600" />
                </div>
                {twoFA && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" /> 2FA is enabled. Your account is more secure.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm">{session.device}</p>
                        {session.current && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">{session.ip} · {session.lastActive}</p>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" onClick={() => revokeSession(i)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 h-8">
                        <LogOut className="w-3.5 h-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-gray-400 text-xs mb-3 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['dark', 'light', 'system'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                          theme === t
                            ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {theme === t && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-3 block">Accent Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {accentColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setAccent(c.value)}
                        className={`w-9 h-9 rounded-xl transition-all ${
                          accent === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Selected: <span className="font-mono" style={{ color: accent }}>{accent}</span></p>
                </div>
                <Button onClick={handleSaveAppearance} variant="glow" className="gap-2">
                  <Check className="w-3.5 h-3.5" /> Save Appearance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { section: 'Email Notifications', items: [
                    { key: 'emailMessages', label: 'New messages', desc: 'Get notified when someone sends a message' },
                    { key: 'emailProjects', label: 'Project updates', desc: 'Milestones, completions, and status changes' },
                    { key: 'emailBilling', label: 'Billing & invoices', desc: 'Payment receipts and overdue alerts' },
                  ]},
                  { section: 'Push Notifications', items: [
                    { key: 'pushMessages', label: 'Real-time messages', desc: 'Instant push for new messages' },
                    { key: 'pushProjects', label: 'Project activity', desc: 'Live updates on project changes' },
                    { key: 'pushSystem', label: 'System alerts', desc: 'Server and system notifications' },
                  ]},
                ].map(({ section, items }) => (
                  <div key={section}>
                    <h4 className="text-gray-300 text-sm font-semibold mb-3">{section}</h4>
                    <div className="space-y-3">
                      {items.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <p className="text-white text-sm">{label}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                          </div>
                          <Switch
                            checked={notifSettings[key]}
                            onCheckedChange={(v) => setNotifSettings((p) => ({ ...p, [key]: v }))}
                            className="data-[state=checked]:bg-violet-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button onClick={handleSaveNotifications} variant="glow" className="gap-2">
                  <Check className="w-3.5 h-3.5" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-xl">
              <CardHeader>
                <CardTitle className="text-white text-base">Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrations.map((intg) => (
                  <div key={intg.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        connectedIntegrations[intg.id] ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-white/10'
                      }`}>
                        <intg.icon className={`w-5 h-5 ${connectedIntegrations[intg.id] ? 'text-emerald-400' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{intg.name}</p>
                        <p className="text-gray-500 text-xs">{intg.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={connectedIntegrations[intg.id]}
                      onCheckedChange={() => toggleIntegration(intg.id)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
