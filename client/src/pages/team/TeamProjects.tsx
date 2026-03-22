/**
 * Team Projects Page
 * Fetches all projects from DB and displays them.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { adminProjectsApi } from '../../api/adminProjects.api';
import { toast } from 'sonner';

interface Project {
  _id: string;
  projectTitle: string;
  clientName: string;
  status: string;
  yourRole: string;
  deadline?: string;
  startDate?: string;
  completionPercentage?: number;
  teamMembers?: { memberId: { name: string; email: string } | null; role: string }[];
  projectDescription?: string;
  priority?: string;
  tags?: string[];
  category?: string;
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'In Progress') return 'default';
  if (status === 'Completed') return 'secondary';
  return 'outline';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TeamProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await adminProjectsApi.getAll();
      const data = res.data.data;
      setProjects(data?.projects || data || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminProjectsApi.updateStatus(id, status);
      setProjects(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const displayed = statusFilter ? projects.filter(p => p.status === statusFilter) : projects;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your assigned projects and track progress.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >All</Button>
          {['In Progress', 'Completed', 'Draft', 'On Hold'].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >{s}</Button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm">Projects created by admin will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map((project) => (
            <Card key={project._id} className="group hover:border-primary/50 transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                  <div className="flex gap-1">
                    {project.status === 'Draft' && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => handleUpdateStatus(project._id, 'In Progress')}
                        title="Start Project"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle
                  className="line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                  onClick={() => navigate(`/team/projects/${project._id}`)}
                >
                  {project.projectTitle}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> {project.clientName}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                  {project.projectDescription || '—'}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.completionPercentage ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${project.completionPercentage ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.deadline)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {(project.teamMembers || []).slice(0, 3).map((m, i) => (
                          <div key={i} className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                            {m.memberId?.name?.[0] ?? '?'}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => navigate(`/team/projects/${project._id}`)}
                      >
                        Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
