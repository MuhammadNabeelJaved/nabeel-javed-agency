/**
 * useDataRealtime — subscribe to real-time data updates dispatched by ContentContext.
 *
 * ContentContext listens to the public socket namespace and dispatches a browser-level
 * CustomEvent 'cms:updated' for every section name received from the server.
 * This hook lets any page/component react to a specific section update.
 *
 * Usage:
 *   useDataRealtime('services', loadServices);   // refetches when admin saves services
 *   useDataRealtime('projects', loadProjects);   // refetches when admin saves projects
 *
 * Server controllers emit: req.app.get('io').of('/public').emit('cms:updated', { section })
 * Known sections: 'services' | 'projects' | 'jobs' | 'clients' | 'team' |
 *                 'tasks' | 'resources' | 'navLinks' | 'footerSections' |
 *                 'announcements' | 'pageStatus' | 'globalTheme' | 'cms'
 */
import { useEffect, useCallback } from 'react';

export function useDataRealtime(section: string, refetch: () => void) {
  const stableRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ section: string }>).detail;
      if (detail?.section === section) stableRefetch();
    };
    window.addEventListener('cms:updated', handler);
    return () => window.removeEventListener('cms:updated', handler);
  }, [section, stableRefetch]);
}
