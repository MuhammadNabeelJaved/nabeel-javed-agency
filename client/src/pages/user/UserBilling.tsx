/**
 * User Billing Page
 * Shows project payment summaries, invoice history, and payment status
 * based on real project data from the API.
 */
import React, { useEffect, useState } from 'react';
import {
  CreditCard, Download, CheckCircle, Clock, AlertCircle,
  DollarSign, TrendingUp, FileText, Loader2, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { projectsApi } from '../../api/projects.api';
import { toast } from 'sonner';

interface Project {
  _id: string;
  projectName: string;
  status: string;
  paymentStatus: string;
  totalCost: number;
  paidAmount: number;
  createdAt: string;
  deadline?: string;
}

function paymentBadgeVariant(status: string) {
  if (status === 'paid')         return 'success'    as const;
  if (status === 'partial')      return 'warning'    as const;
  if (status === 'overdue')      return 'destructive' as const;
  return 'secondary' as const;
}

function paymentLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function UserBilling() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll();
      const data = res.data?.data ?? res.data ?? [];
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // Derived totals
  const totalCost  = projects.reduce((s, p) => s + (p.totalCost  || 0), 0);
  const totalPaid  = projects.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const totalDue   = totalCost - totalPaid;
  const paidCount  = projects.filter(p => p.paymentStatus === 'paid').length;
  const partialCount = projects.filter(p => p.paymentStatus === 'partial').length;
  const overdueCount = projects.filter(p => p.paymentStatus === 'overdue').length;

  // Only show projects that have a cost set
  const billableProjects = projects.filter(p => p.totalCost > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Payments</h2>
          <p className="text-muted-foreground mt-1">
            Track your project costs, payments, and outstanding balances.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchProjects} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Billed</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">{billableProjects.length} project{billableProjects.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Paid</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{paidCount} fully paid</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalDue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{partialCount} partial</p>
          </CardContent>
        </Card>

        <Card className={`border-red-500/20 bg-red-500/5 ${overdueCount === 0 ? 'opacity-60' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overdue</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-muted-foreground mt-1">project{overdueCount !== 1 ? 's' : ''} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress Bar */}
      {totalCost > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Overall Payment Progress</span>
              <span className="text-sm font-bold text-primary">
                {Math.round((totalPaid / totalCost) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPaid / totalCost) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatCurrency(totalPaid)} paid</span>
              <span>{formatCurrency(totalDue)} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice / Project Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Project Invoices
          </CardTitle>
          <CardDescription>
            Payment breakdown for each of your projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading invoices…</span>
            </div>
          ) : billableProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No billable projects yet</p>
              <p className="text-xs mt-1">Cost details will appear here once your projects are approved.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billableProjects.map(p => {
                  const due = (p.totalCost || 0) - (p.paidAmount || 0);
                  return (
                    <TableRow key={p._id}>
                      <TableCell>
                        <p className="font-medium text-sm">{p.projectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {p.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.totalCost)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatCurrency(p.paidAmount || 0)}</TableCell>
                      <TableCell className={`text-right font-medium ${due > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(due)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentBadgeVariant(p.paymentStatus)} className="capitalize text-xs">
                          {paymentLabel(p.paymentStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/40 bg-muted/20">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Payment Questions?</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              If you have questions about an invoice or payment, please open a support ticket from the
              Support Center or contact us via Live Chat. Our team usually responds within 24 business hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
