/**
 * PageStatusGate
 * Checks the current route against admin-controlled page statuses.
 *
 * Status checks:
 * - "maintenance"  → shows Maintenance page
 * - "coming-soon"  → shows UnderConstruction page
 * - "active"       → renders children normally
 *
 * Visibility checks:
 * - isHidden=true  → redirects non-admins to `hiddenRedirectTo`
 *
 * Admin users always see the real page with a thin warning banner.
 */
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Maintenance from '../pages/public/Maintenance';
import UnderConstruction from '../pages/public/UnderConstruction';
import { AlertTriangle, EyeOff } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Where to redirect non-admins when the page is hidden. Default: "/" */
  hiddenRedirectTo?: string;
}

export function PageStatusGate({ children, hiddenRedirectTo = '/' }: Props) {
  const { pageStatuses } = useContent();
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Find the matching page entry
  const match = pageStatuses.find(p => {
    if (p.matchPrefix) return pathname === p.path || pathname.startsWith(p.path + '/');
    return pathname === p.path;
  });

  const status = match?.status ?? 'active';
  const isHidden = match?.isHidden ?? false;
  const isAdmin = user?.role === 'admin';

  // ── Admin bypass — show page with warning banner(s) ──
  if (isAdmin && (status !== 'active' || isHidden)) {
    const banners: React.ReactNode[] = [];

    if (isHidden) {
      banners.push(
        <div key="hidden" className="fixed top-16 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium bg-slate-800/95 backdrop-blur-sm text-white pointer-events-none">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span>Admin view — this page is <strong>hidden</strong> from visitors.</span>
        </div>
      );
    }

    if (status !== 'active') {
      banners.push(
        <div key="status" className={`fixed inset-x-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium backdrop-blur-sm text-white pointer-events-none ${isHidden ? 'top-26' : 'top-16'} bg-amber-500/90`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Admin view — this page is set to&nbsp;
            <strong>{status === 'maintenance' ? 'Under Maintenance' : 'Coming Soon'}</strong>
            &nbsp;for visitors.
          </span>
        </div>
      );
    }

    return (
      <>
        {banners}
        {children}
      </>
    );
  }

  // ── Non-admin: hidden page → redirect ──
  if (isHidden) {
    return <Navigate to={hiddenRedirectTo} replace />;
  }

  // ── Non-admin: status checks ──
  if (status === 'maintenance') return <Maintenance />;
  if (status === 'coming-soon') return <UnderConstruction />;

  return <>{children}</>;
}
