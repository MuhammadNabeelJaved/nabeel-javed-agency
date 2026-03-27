/**
 * Dashboard Home Page
 * All data fetched from real APIs — no hardcoded values.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  CreditCard, Users, FolderKanban, Save, LayoutTemplate, CheckCircle2,
  Briefcase, MessageSquare, TrendingUp, Clock, ArrowUpRight, ExternalLink,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { homepageApi } from '../../api/homepage.api';
import { projectsApi } from '../../api/projects.api';
import { clientsApi } from '../../api/clients.api';
import { contactsApi } from '../../api/contacts.api';
import { jobApplicationsApi } from '../../api/jobApplications.api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProjectStats {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  completed: number;
  rejected: number;
  totalRevenue: number;
  totalPaid: number;
  avgProgress: number;
}

interface ClientStats {
  total: number;
  newThisMonth: number;
  totalRevenue: number;
}

interface ContactStats {
  totalContacts: number;
  contactsByMonth: { _id: { year: number; month: number }; count: number }[];
  recentContacts: { _id: string; firstName: string; lastName: string; email: string; subject: string; createdAt: string }[];
}

interface AppStats {
  total: number;
  byStatus: { _id: string; count: number }[];
}

interface Project {
  _id: string;
  projectName: string;
  status: string;
  progress: number;
  deadline?: string;
  projectType: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_BADGE: Record<string, 'default' | 'warning' | 'secondary' | 'destructive'> = {
  approved: 'default',
  in_review: 'warning',
  pending: 'secondary',
  completed: 'default',
  rejected: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved',
  in_review: 'In Review',
  pending: 'Pending',
  completed: 'Completed',
  rejected: 'Rejected',
};

const defaultHero = { statusBadge: '', titleLine1: '', titleLine2: '', subtitle: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { user } = useAuth();

  // Hero edit state
  const [heroForm, setHeroForm] = useState(defaultHero);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [saved, setSaved] = useState(false);

  // Real data state
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch hero ──────────────────────────────────────────────────────────────
  useEffect(() => {
    homepageApi.get().then(res => {
      const d = res.data.data;
      if (d) setHeroForm({ statusBadge: d.statusBadge || '', titleLine1: d.titleLine1 || '', titleLine2: d.titleLine2 || '', subtitle: d.subtitle || '' });
    }).catch(() => {});
  }, []);

  // ── Fetch all dashboard stats in parallel ───────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      projectsApi.getStats(),
      clientsApi.getStats(),
      contactsApi.getStats(),
      jobApplicationsApi.getStats(),
      projectsApi.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
    ]).then(([pStats, cStats, ctStats, appSt, pList]) => {
      if (pStats.status === 'fulfilled') setProjectStats(pStats.value.data.data);
      if (cStats.status === 'fulfilled') setClientStats(cStats.value.data.data);
      if (ctStats.status === 'fulfilled') setContactStats(ctStats.value.data.data);
      if (appSt.status === 'fulfilled') setAppStats(appSt.value.data.data);
      if (pList.status === 'fulfilled') setRecentProjects(pList.value.data.data?.projects || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Hero save ───────────────────────────────────────────────────────────────
  const handleContentChange = (field: keyof typeof heroForm, value: string) => {
    setHeroForm(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
    setSaved(false);
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      try { await homepageApi.update(heroForm); }
      catch (err: any) {
        if (err?.response?.status === 404) await homepageApi.create(heroForm);
        else throw err;
      }
      setIsModified(false);
      setSaved(true);
      toast.success('Hero section updated successfully!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Chart data from real contacts-by-month ──────────────────────────────────
  const chartData = (contactStats?.contactsByMonth || []).map(entry => ({
    name: MONTH_NAMES[(entry._id.month ?? 1) - 1],
    contacts: entry.count,
  }));

  // Fallback empty state for chart
  const hasChartData = chartData.length > 0;

  // Active projects = approved + in_review
  const activeCount = (projectStats?.approved ?? 0) + (projectStats?.inReview ?? 0);

  // Format currency
  const formatRevenue = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}. Here's what's happening.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/client-requests">
            <ExternalLink className="h-4 w-4 mr-2" /> View All Requests
          </Link>
        </Button>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : formatRevenue(clientStats?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '' : `${clientStats?.newThisMonth ?? 0} new clients this month`}
            </p>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '' : `${projectStats?.pending ?? 0} pending review · ${projectStats?.completed ?? 0} completed`}
            </p>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : clientStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '' : `${contactStats?.totalContacts ?? 0} contact form submissions`}
            </p>
          </CardContent>
        </Card>

        {/* Job Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : appStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? '' : (() => {
                const pending = appStats?.byStatus?.find(s => s._id === 'pending')?.count ?? 0;
                return `${pending} pending review`;
              })()}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Middle Row: Hero Edit + Chart ──────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Quick Edit Hero */}
        <Card className="col-span-4 lg:col-span-3 border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Edit Home Page
              </CardTitle>
              <CardDescription>Quickly update your hero section content.</CardDescription>
            </div>
            {saved && !isModified ? (
              <Badge variant="outline" className="text-green-500 border-green-500/50 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </Badge>
            ) : isModified ? (
              <Badge variant="outline" className="text-amber-500 border-amber-500/50">Unsaved</Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Status Badge</label>
              <Input value={heroForm.statusBadge} onChange={e => handleContentChange('statusBadge', e.target.value)} placeholder="e.g. Accepting New Projects" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 1</label>
                <Input value={heroForm.titleLine1} onChange={e => handleContentChange('titleLine1', e.target.value)} placeholder="e.g. We Build" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Title Line 2 (Colored)</label>
                <Input value={heroForm.titleLine2} onChange={e => handleContentChange('titleLine2', e.target.value)} placeholder="e.g. Digital Excellence" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Subtitle</label>
              <Textarea value={heroForm.subtitle} onChange={e => handleContentChange('subtitle', e.target.value)} placeholder="Hero description text..." className="resize-none min-h-[80px]" />
            </div>
            <Button onClick={handleSaveContent} disabled={!isModified || isSaving} className="w-full">
              {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Activity Chart */}
        <Card className="col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Contact Activity
            </CardTitle>
            <CardDescription>New contact form submissions over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
              ) : !hasChartData ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No contact data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                    <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="contacts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Bottom Row: Recent Requests + Recent Contacts ───────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent Client Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Project Requests</CardTitle>
              <CardDescription>Latest 5 client requests from the database.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/client-requests"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No project requests yet.</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map(project => (
                  <div key={project._id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full shrink-0">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{project.projectName}</p>
                        <p className="text-xs text-muted-foreground">{project.projectType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_BADGE[project.status] ?? 'secondary'}>
                        {STATUS_LABEL[project.status] ?? project.status}
                      </Badge>
                      <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${project.progress ?? 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contact Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Contacts</CardTitle>
              <CardDescription>Latest contact form submissions.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/contacts"><ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
            ) : (contactStats?.recentContacts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No contacts yet.</p>
            ) : (
              <div className="space-y-4">
                {(contactStats?.recentContacts ?? []).map(contact => (
                  <div key={contact._id} className="flex items-start gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="bg-primary/10 p-2 rounded-full shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.subject || contact.email}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
