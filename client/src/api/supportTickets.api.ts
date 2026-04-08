import apiClient from './apiClient';

export const supportTicketsApi = {
  // ── User ──────────────────────────────────────────────────────────────────
  create: (data: { subject: string; category: string; priority: string; message: string }) =>
    apiClient.post('/support-tickets', data),

  getMyTickets: () =>
    apiClient.get('/support-tickets/my'),

  addReply: (id: string, message: string) =>
    apiClient.post(`/support-tickets/${id}/reply`, { message }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  getStats: () =>
    apiClient.get('/support-tickets/stats'),

  getAll: (params?: Record<string, any>) =>
    apiClient.get('/support-tickets', { params }),

  update: (id: string, data: { status?: string; priority?: string; adminNotes?: string }) =>
    apiClient.put(`/support-tickets/${id}`, data),

  respond: (id: string, message: string) =>
    apiClient.post(`/support-tickets/${id}/respond`, { message }),

  delete: (id: string) =>
    apiClient.delete(`/support-tickets/${id}`),
};
