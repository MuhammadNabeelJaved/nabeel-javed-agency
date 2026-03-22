/**
 * User Dashboard Home
 * Overview of the user's account and activities — live data from DB.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  FolderKanban,
  Clock,
  CheckCircle,
  CreditCard,
  ArrowRight,
  MessageSquare,
  Plus,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { projectsApi } from '../../api/projects.api';

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

interface RecentProject {
  _id: string;
  projectName: string;
  status: string;
  progress: number;
  createdAt: string;
  projectType: string;
}

export default function UserDashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          projectsApi.getStats(),
          projectsApi.getAll({ limit: 3, sortBy: 'createdAt', order: 'desc' }),
        ]);
        setStats(statsRes.data.data);
        const list = projectsRes.data.data?.projects ?? projectsRes.data.data ?? [];
        setRecentProjects(list.slice(0, 3));
      } catch (err) {
        console.error('[UserDashboard] load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeCount   = (stats?.approved ?? 0) + (stats?.inReview ?? 0);
  const pendingCount  = stats?.pending ?? 0;
  const completedCount = stats?.completed ?? 0;
  const totalPaid     = stats?.totalPaid ?? 0;

  const statCards = [
    { label: 'Active Projects', value: loading ? '—' : String(activeCount),    icon: FolderKanban, color: 'text-blue-500',   bg: 'bg-blue-500/10' },
    { label: 'Pending Requests',value: loading ? '—' : String(pendingCount),   icon: Clock,        color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Completed',       value: loading ? '—' : String(completedCount), icon: CheckCircle,  color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Paid',      value: loading ? '—' : `$${totalPaid.toLocaleString()}`, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':  return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'approved':   return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_review':  return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'pending':    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'rejected':   return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:           return 'bg-secondary text-muted-foreground';
    }
  };

  const statusLabel = (s: string) => ({
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    completed: 'Completed',
    rejected: 'Rejected',
  }[s] ?? s);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/25"
          onClick={() => navigate('/user-dashboard/projects', { state: { openNewProject: true } })}
        >
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
              onClick={() => navigate('/user-dashboard/projects')}
            >
              View All
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground gap-2">
              <FolderKanban className="h-8 w-8 opacity-40" />
              <p>No projects yet. Start your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, i) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="group relative bg-card border border-border/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
                  onClick={() => navigate('/user-dashboard/projects')}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate pr-4">{project.projectName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(project.status)}`}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{project.projectType}</p>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{project.progress}% complete</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Support */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-blue-600/5 border-none shadow-inner">
            <CardHeader>
              <CardTitle className="text-lg">Need Assistance?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our support team is available 24/7 to help you with any questions or project details.
              </p>
              <Button
                className="w-full gap-2"
                variant="secondary"
                onClick={() => navigate('/user-dashboard/messages')}
              >
                <MessageSquare className="h-4 w-4" /> Chat with Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                [
                  { label: 'Total Requests', value: stats?.total ?? 0 },
                  { label: 'In Review', value: stats?.inReview ?? 0 },
                  { label: 'Avg. Progress', value: `${Math.round(stats?.avgProgress ?? 0)}%` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
