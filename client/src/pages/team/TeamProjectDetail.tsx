/**
 * Team Project Detail Page
 * Fetches a single project by ID from the DB.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Users, CheckCircle2, ArrowLeft, FileText, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { adminProjectsApi } from '../../api/adminProjects.api';
import { toast } from 'sonner';

interface TeamMember {
  memberId: { _id: string; name: string; email: string } | null;
  role: string;
}

interface Project {
  _id: string;
  projectTitle: string;
  clientName: string;
  status: string;
  priority: string;
  deadline?: string;
  startDate?: string;
  projectDescription?: string;
  tags?: string[];
  teamMembers?: TeamMember[];
  completionPercentage?: number;
  yourRole?: string;
  category?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function priorityColor(p?: string) {
  if (p === 'High') return 'text-orange-500';
  if (p === 'Critical') return 'text-red-500';
  if (p === 'Low') return 'text-green-500';
  return 'text-foreground';
}

export default function TeamProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminProjectsApi.getById(id)
      .then(res => setProject(res.data.data))
      .catch(() => toast.error('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/team/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
        <div className="text-center text-muted-foreground py-16">Project not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/team/projects')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.projectTitle}</h1>
            <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'}>{project.status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {project.clientName}</span>
            {project.deadline && (
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Due: {formatDate(project.deadline)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="h-9 px-4 text-sm flex items-center">
            {project.yourRole || project.category}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span className="font-medium text-foreground">{project.completionPercentage ?? 0}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${project.completionPercentage ?? 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {project.projectDescription || 'No description provided.'}
              </p>
              {project.tags && project.tags.length > 0 && (
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Tech Stack / Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="team">
            <TabsList>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-3 mt-4">
              {(project.teamMembers || []).length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">No team members assigned.</p>
              ) : (
                project.teamMembers!.map((m, i) => (
                  <Card key={i} className="flex items-center gap-4 p-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {m.memberId?.name?.[0] ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{m.memberId?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                    {m.memberId?.email && (
                      <p className="text-xs text-muted-foreground ml-auto">{m.memberId.email}</p>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="files">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No files attached yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 text-sm">
              {[
                { label: 'Start Date', value: formatDate(project.startDate) },
                { label: 'Deadline', value: formatDate(project.deadline) },
                { label: 'Category', value: project.category },
                { label: 'Priority', value: project.priority, className: priorityColor(project.priority) },
                { label: 'Status', value: project.status },
              ].map(({ label, value, className }) => (
                <div key={label} className="flex justify-between py-2.5 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${className ?? ''}`}>{value || '—'}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{project.clientName}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
