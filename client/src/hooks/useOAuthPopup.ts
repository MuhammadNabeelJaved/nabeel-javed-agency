import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthUser } from '../api/auth.api';
import { toast } from 'sonner';

export type OAuthPopupMessage =
  | { type: 'oauth-result'; status: 'success'; user: AuthUser }
  | { type: 'oauth-result'; status: 'verification'; email: string }
  | { type: 'oauth-result'; status: 'error'; code: string };

const POPUP_W = 500;
const POPUP_H = 620;

function openCenteredPopup(url: string): Window | null {
  const left = Math.round(window.screenX + (window.outerWidth  - POPUP_W) / 2);
  const top  = Math.round(window.screenY + (window.outerHeight - POPUP_H) / 2);
  return window.open(
    url,
    'oauth-popup',
    `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},` +
    `toolbar=0,menubar=0,scrollbars=1,resizable=1,status=1`
  );
}

const getDashboardPath = (role: string) => {
  if (role === 'admin') return '/admin';
  if (role === 'team')  return '/team';
  return '/user-dashboard';
};

export function useOAuthPopup() {
  const { loginFromOAuth } = useAuth();
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, []);

  const handleMessage = useCallback(
    (e: MessageEvent<OAuthPopupMessage>) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data || e.data.type !== 'oauth-result') return;

      timerRef.current && clearInterval(timerRef.current);
      popupRef.current?.close();
      setIsWaiting(false);
      window.removeEventListener('message', handleMessage);

      const msg = e.data;

      if (msg.status === 'error') {
        const messages: Record<string, string> = {
          account_not_found:   'No account for that email. Please sign up first.',
          account_exists:      'Account already exists. Please log in instead.',
          account_deactivated: 'This account has been deactivated.',
          github_no_email:     'GitHub email is private. Make your primary email public in GitHub settings.',
          no_email:            'Could not retrieve your email from the provider.',
        };
        toast.error('Sign-in failed', {
          description: messages[msg.code] ?? 'Authentication failed. Please try again.',
        });
        return;
      }

      if (msg.status === 'verification') {
        toast.info('Verify your email', {
          description: `A verification code was sent to ${msg.email}.`,
        });
        navigate('/verification', { state: { email: msg.email }, replace: true });
        return;
      }

      // status === 'success'
      loginFromOAuth(msg.user);
      navigate(getDashboardPath(msg.user.role), { replace: true });
    },
    [loginFromOAuth, navigate]
  );

  const openPopup = useCallback(
    (url: string) => {
      const popup = openCenteredPopup(url);

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup blocked', {
          description: 'Please allow popups for this site, or click the button below.',
          action: { label: 'Open in tab', onClick: () => { window.location.href = url; } },
        });
        return;
      }

      popupRef.current = popup;
      setIsWaiting(true);
      window.addEventListener('message', handleMessage);

      // Detect user manually closing the popup
      timerRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsWaiting(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    },
    [handleMessage]
  );

  return { openPopup, isWaiting };
}
