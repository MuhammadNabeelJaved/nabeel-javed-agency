/**
 * OAuthCallback
 * Landing page after Google / GitHub OAuth redirect.
 *
 * Three outcomes the backend can produce:
 *  1. Success (verified user)    → params: userId, email, role, name, photo, isVerified=true
 *  2. New signup (unverified)    → params: email, requiresVerification=true
 *  3. Error                      → params: error=<code>
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { AuthUser } from '../../api/auth.api';

const ERROR_MESSAGES: Record<string, { title: string; description: string; redirect: string }> = {
  account_not_found: {
    title:       'Account not found',
    description: 'No account exists for that email. Please sign up first.',
    redirect:    '/login',
  },
  account_exists: {
    title:       'Account already exists',
    description: 'An account with that email already exists. Please log in instead.',
    redirect:    '/login',
  },
  account_deactivated: {
    title:       'Account deactivated',
    description: 'This account has been deactivated. Please contact support.',
    redirect:    '/login',
  },
  github_no_email: {
    title:       'Email not accessible',
    description: 'GitHub email is private. Please make your primary email public in GitHub settings.',
    redirect:    '/login',
  },
  no_email: {
    title:       'Email not accessible',
    description: 'Could not retrieve your email from the OAuth provider.',
    redirect:    '/login',
  },
};

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

    // ── Error from backend ─────────────────────────────────────────────────
    if (error) {
      const msg = ERROR_MESSAGES[error] ?? {
        title:       'Sign-in failed',
        description: 'Authentication failed. Please try again.',
        redirect:    '/login',
      };
      toast.error(msg.title, { description: msg.description });
      navigate(msg.redirect, { replace: true });
      return;
    }

    // ── New signup — backend created account but email not yet verified ────
    const requiresVerification = searchParams.get('requiresVerification') === 'true';
    if (requiresVerification) {
      const email = searchParams.get('email') || '';
      toast.info('Verify your email', {
        description: `A verification code has been sent to ${email}. Please check your inbox.`,
      });
      navigate('/verification', { state: { email }, replace: true });
      return;
    }

    // ── Verified user — hydrate context and go to dashboard ───────────────
    const userId = searchParams.get('userId');
    const email  = searchParams.get('email');
    const role   = (searchParams.get('role') || 'user') as AuthUser['role'];
    const name   = searchParams.get('name') || email?.split('@')[0] || 'User';
    const photo  = searchParams.get('photo') ?? undefined;
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
