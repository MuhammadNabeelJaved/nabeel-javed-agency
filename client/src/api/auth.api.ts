import apiClient from './apiClient';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'team' | 'user';
  isVerified: boolean;
  photo?: string;   // backend field name
  avatar?: string;  // alias used in some places
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/users/register', { name, email, password }),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/users/login', { email, password }),

  logout: () =>
    apiClient.post('/users/logout'),

  getProfile: (id: string) =>
    apiClient.get<{ success: boolean; data: AuthUser }>(`/users/profile/${id}`),

  verifyEmail: (email: string, code: string) =>
    apiClient.post('/users/verify', { email, code }),

  resendVerification: (email: string) =>
    apiClient.post('/users/resend-verification', { email }),

  refreshToken: () =>
    apiClient.post('/users/refresh-token'),

  // OAuth — full-page browser navigations (not axios calls)
  initiateGoogleOAuth: () => {
    window.location.href = '/api/v1/users/auth/google';
  },
  initiateGitHubOAuth: () => {
    window.location.href = '/api/v1/users/auth/github';
  },
};
