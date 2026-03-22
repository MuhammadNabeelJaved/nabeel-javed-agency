import apiClient from './apiClient';

export const jobApplicationsApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get('/job-applications', { params }),

  getStats: () =>
    apiClient.get('/job-applications/stats'),

  getById: (id: string) =>
    apiClient.get(`/job-applications/${id}`),

  updateStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    apiClient.patch(`/job-applications/${id}/status`, data),

  delete: (id: string) =>
    apiClient.delete(`/job-applications/${id}`),
};

// Public — no auth required
export const submitJobApplication = (formData: FormData) =>
  apiClient.post('/job-applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
