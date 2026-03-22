/**
 * PageStatusGate
 * Checks the current route against admin-controlled page statuses.
 * - "maintenance"  → shows Maintenance page
 * - "coming-soon"  → shows UnderConstruction page
 * - "active"       → renders children normally
 * Admin users always see the real page (with a thin warning banner).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Maintenance from '../pages/public/Maintenance';
import UnderConstruction from '../pages/public/UnderConstruction';
import { AlertTriangle } from 'lucide-react';

export function PageStatusGate({ children }: { children: React.ReactNode }) {
  const { pageStatuses } = useContent();
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Find the matching page entry
  const match = pageStatuses.find(p => {
    if (p.matchPrefix) return pathname === p.path || pathname.startsWith(p.path + '/');
    return pathname === p.path;
  });

  const status = match?.status ?? 'active';
  const isAdmin = user?.role === 'admin';

  // Admin bypass — still show the page but with a banner
  if (isAdmin && status !== 'active') {
    return (
      <>
        <div className="fixed top-16 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium
          bg-amber-500/90 backdrop-blur-sm text-white pointer-events-none">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Admin view — this page is currently set to&nbsp;
            <strong>{status === 'maintenance' ? 'Under Maintenance' : 'Coming Soon'}</strong>
            &nbsp;for visitors.
          </span>
        </div>
        {children}
      </>
    );
  }

  if (status === 'maintenance') return <Maintenance />;
  if (status === 'coming-soon') return <UnderConstruction />;

  return <>{children}</>;
}
