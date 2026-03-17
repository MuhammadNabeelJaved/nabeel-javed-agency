import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Eye, EyeOff, Save, AlertTriangle, Upload, Bell, Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export default function UserProfile() {
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Marcus Chen',
    email: 'marcus@techcorp.com',
    phone: '+1 555-0101',
    company: 'TechCorp Inc.',
    jobTitle: 'Chief Technology Officer',
  });
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [notifPrefs, setNotifPrefs] = useState({
    projectUpdates: true,
    messageAlerts: true,
    invoiceNotifs: true,
    milestoneAlerts: true,
    weeklyReport: true,
    marketingEmails: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-white/50 mt-0.5">Manage your account settings and preferences</p>
      </motion.div>

      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
        <Tabs defaultValue="personal">
          <TabsList className="bg-white/[0.04] border border-white/10 p-1 rounded-xl mb-6 flex flex-wrap gap-1">
            {[
              { value: 'personal', icon: User, label: 'Personal Info' },
              { value: 'notifications', icon: Bell, label: 'Notifications' },
              { value: 'security', icon: Shield, label: 'Security' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50 text-sm"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Personal Info */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardContent className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className={cn(
                      'w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden',
                      !avatarPreview && 'bg-gradient-to-br from-violet-600 to-purple-600'
                    )}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : 'MC'}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/10 text-white/60 hover:text-white gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                    </Button>
                    <p className="text-xs text-white/30 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Full Name', type: 'text' },
                    { key: 'email', label: 'Email Address', type: 'email' },
                    { key: 'phone', label: 'Phone Number', type: 'tel' },
                    { key: 'company', label: 'Company', type: 'text' },
                    { key: 'jobTitle', label: 'Job Title', type: 'text' },
                  ].map((field) => (
                    <div key={field.key} className={cn('space-y-1.5', field.key === 'name' && 'sm:col-span-2')}>
                      <Label className="text-xs text-white/60">{field.label}</Label>
                      <Input
                        type={field.type}
                        value={profile[field.key]}
                        onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="bg-white/[0.04] border-white/10 text-white"
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} variant="glow" className="gap-2">
                  <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {[
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes, progress, and team updates' },
                  { key: 'messageAlerts', label: 'New Messages', desc: 'When your project team sends you a message' },
                  { key: 'invoiceNotifs', label: 'Invoice Notifications', desc: 'New invoices and payment confirmations' },
                  { key: 'milestoneAlerts', label: 'Milestone Alerts', desc: 'When a project milestone is reached' },
                  { key: 'weeklyReport', label: 'Weekly Summary', desc: 'Weekly email digest of all project activity' },
                  { key: 'marketingEmails', label: 'Product Updates', desc: 'News, tips, and announcements from our team' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="text-sm text-white/80">{item.label}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key]}
                      onCheckedChange={(val) => setNotifPrefs((p) => ({ ...p, [item.key]: val }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {[
                  { key: 'current', label: 'Current Password' },
                  { key: 'newPwd', label: 'New Password' },
                  { key: 'confirm', label: 'Confirm New Password' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs text-white/60">{field.label}</Label>
                    <div className="relative">
                      <Input
                        type={showPwd[field.key] ? 'text' : 'password'}
                        value={passwords[field.key]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="bg-white/[0.04] border-white/10 text-white pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => ({ ...p, [field.key]: !p[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPwd[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button variant="glow" className="gap-2">
                  <Shield className="w-4 h-4" /> Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-rose-500/5 border-rose-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Delete Account</p>
                    <p className="text-xs text-white/40">Permanently remove your account and all data.</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="text-xs flex-shrink-0"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#131320] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" /> Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-white/60">
              This action is <span className="text-rose-400 font-semibold">permanent and irreversible</span>.
              All your data, projects, and messages will be permanently deleted.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Type <span className="text-white font-mono">DELETE</span> to confirm</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white font-mono"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="text-white/50">Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== 'DELETE'}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Permanently Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
