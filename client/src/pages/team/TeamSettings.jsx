import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Calendar, Shield, Plus, X, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const initialNotifs = {
  taskAssigned: true,
  taskCompleted: true,
  projectUpdated: true,
  deadlineReminder: true,
  mention: true,
  approval: false,
  weeklyDigest: true,
  marketingEmails: false,
};

export default function TeamSettings() {
  const [profile, setProfile] = useState({
    name: 'Alex Chen',
    role: 'Senior Designer',
    email: 'alex.chen@agency.com',
    bio: 'Passionate about crafting beautiful, accessible digital experiences. 6+ years in product design.',
    skills: ['UI Design', 'Figma', 'Design Systems', 'Prototyping', 'User Research'],
  });
  const [newSkill, setNewSkill] = useState('');
  const [notifs, setNotifs] = useState(initialNotifs);
  const [availability, setAvailability] = useState({
    Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false,
  });
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '17:00' });
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, newPwd: false, confirm: false });
  const [saved, setSaved] = useState(false);

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((p) => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-0.5">Manage your account and preferences</p>
      </motion.div>

      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
        <Tabs defaultValue="profile">
          <TabsList className="bg-white/[0.04] border border-white/10 p-1 rounded-xl mb-6 flex flex-wrap gap-1">
            {[
              { value: 'profile', icon: User, label: 'Profile' },
              { value: 'notifications', icon: Bell, label: 'Notifications' },
              { value: 'availability', icon: Calendar, label: 'Availability' },
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

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    AC
                  </div>
                  <div>
                    <Button size="sm" variant="outline" className="border-white/10 text-white/60 hover:text-white text-xs">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-white/30 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Full Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Role</Label>
                    <Input
                      value={profile.role}
                      onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-white/60">Email</Label>
                    <Input
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-white/60">Bio</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <div key={skill} className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-rose-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                      placeholder="Add a skill..."
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 flex-1"
                    />
                    <Button onClick={addSkill} variant="outline" className="border-white/10 text-white/60 hover:text-white gap-1">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSave} variant="glow" className="gap-2">
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {[
                  { key: 'taskAssigned', label: 'Task assigned to me', desc: 'When someone assigns a task to you' },
                  { key: 'taskCompleted', label: 'Task completed', desc: 'When tasks in your projects are completed' },
                  { key: 'projectUpdated', label: 'Project updates', desc: 'Status changes and milestone updates' },
                  { key: 'deadlineReminder', label: 'Deadline reminders', desc: '24h before task or project deadlines' },
                  { key: 'mention', label: 'Mentions', desc: 'When someone @mentions you in chat or notes' },
                  { key: 'approval', label: 'Approval requests', desc: 'When work needs your review or approval' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Summary of your week every Monday morning' },
                  { key: 'marketingEmails', label: 'Product updates', desc: 'New features and announcements' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="text-sm text-white/80">{item.label}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[item.key]}
                      onCheckedChange={(val) => setNotifs((p) => ({ ...p, [item.key]: val }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Work Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => setAvailability((p) => ({ ...p, [day]: !p[day] }))}
                      className={cn(
                        'flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all',
                        availability[day]
                          ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                          : 'bg-white/[0.03] border-white/10 text-white/30 hover:border-white/20'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full', availability[day] ? 'bg-violet-400' : 'bg-white/20')} />
                      {day}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">Start Time</Label>
                    <Input
                      type="time"
                      value={workHours.start}
                      onChange={(e) => setWorkHours((p) => ({ ...p, start: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/60">End Time</Label>
                    <Input
                      type="time"
                      value={workHours.end}
                      onChange={(e) => setWorkHours((p) => ({ ...p, end: e.target.value }))}
                      className="bg-white/[0.04] border-white/10 text-white"
                    />
                  </div>
                </div>
                <Button onClick={handleSave} variant="glow" className="gap-2">
                  <Save className="w-4 h-4" /> Save Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
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
                        type={showPassword[field.key] ? 'text' : 'password'}
                        value={passwords[field.key]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="bg-white/[0.04] border-white/10 text-white pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => ({ ...p, [field.key]: !p[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <Button variant="glow" className="gap-2">
                  <Shield className="w-4 h-4" /> Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.04] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/80">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {[
                  { device: 'MacBook Pro — Chrome', location: 'New York, US', current: true },
                  { device: 'iPhone 15 Pro — Safari', location: 'New York, US', current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm text-white/70">{session.device}</p>
                      <p className="text-xs text-white/30">{session.location}</p>
                    </div>
                    {session.current ? (
                      <Badge variant="success" className="text-xs">Current</Badge>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 text-xs h-7">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
