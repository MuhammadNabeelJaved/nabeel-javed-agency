import apiClient from './apiClient';

export const reviewsApi = {
  submit: (payload: { rating: number; reviewText: string; project: string }) =>
    apiClient.post('/reviews', payload),

  getMyReviews: () =>
    apiClient.get('/reviews/my-reviews'),

  update: (id: string, payload: { rating: number; reviewText: string }) =>
    apiClient.put(`/reviews/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`/reviews/${id}`),

  // Admin
  getAll: (params?: Record<string, any>) =>
    apiClient.get('/reviews', { params }),

  getStats: () =>
    apiClient.get('/reviews/statistics'),

  setStatus: (id: string, status: 'approved' | 'rejected') =>
    apiClient.put(`/reviews/${id}/status`, { status }),

  toggleHome: (id: string) =>
    apiClient.patch(`/reviews/${id}/toggle-home`),

  adminCreate: (payload: Record<string, any>) =>
    apiClient.post('/reviews/admin', payload),

  adminUpdate: (id: string, payload: Record<string, any>) =>
    apiClient.put(`/reviews/${id}/admin`, payload),
};
