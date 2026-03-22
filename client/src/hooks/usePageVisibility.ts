/**
 * usePageVisibility
 * Returns an `isVisible(path)` helper that checks if a page is hidden
 * from the current user via the admin Page Manager.
 *
 * - Admin: always sees every page (returns true always)
 * - Others: returns false if the page has isHidden=true in pageStatuses
 */
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';

export function usePageVisibility() {
  const { pageStatuses } = useContent();
  const { user } = useAuth();

  const isVisible = (path: string): boolean => {
    // Admin always sees everything
    if (user?.role === 'admin') return true;

    const match = pageStatuses.find(p => {
      if (p.matchPrefix) return path === p.path || path.startsWith(p.path + '/');
      return path === p.path;
    });

    return !(match?.isHidden ?? false);
  };

  return { isVisible };
}
