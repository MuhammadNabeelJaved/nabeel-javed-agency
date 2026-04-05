/**
 * OAuthCallback
 * Landing page after Google / GitHub OAuth redirect.
 * Reads user data from query params, hydrates AuthContext, then navigates to dashboard.
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { AuthUser } from '../../api/auth.api';

const getDashboardPath = (role: string) => {
  if (role === 'admin') return '/admin';
  if (role === 'team') return '/team';
  return '/user-dashboard';
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginFromOAuth } = useAuth();
  // Prevent double-processing in React 18 StrictMode (effects run twice in dev)
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const error = searchParams.get('error');

    if (error) {
      toast.error('Sign-in failed', {
        description:
          error === 'oauth_failed'
            ? 'Could not sign in with that provider. If using GitHub, ensure your email is public in GitHub settings.'
            : 'Authentication failed. Please try again.',
      });
      navigate('/login', { replace: true });
      return;
    }

    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const role = (searchParams.get('role') || 'user') as AuthUser['role'];
    const name = searchParams.get('name') || email?.split('@')[0] || 'User';
    const photo = searchParams.get('photo') ?? undefined;
    const isVerified = searchParams.get('isVerified') === 'true';

    if (!userId || !email) {
      toast.error('Sign-in failed', { description: 'Incomplete user data returned. Please try again.' });
      navigate('/login', { replace: true });
      return;
    }

    const userData: AuthUser = { _id: userId, name, email, role, photo, isVerified };
    loginFromOAuth(userData);
    navigate(getDashboardPath(role), { replace: true });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
