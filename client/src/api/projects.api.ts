import apiClient from './apiClient';

export const projectsApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get('/projects', { params }),

  getStats: () =>
    apiClient.get('/projects/stats'),

  getById: (id: string) =>
    apiClient.get(`/projects/${id}`),

  create: (formData: FormData) =>
    apiClient.post('/projects/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    apiClient.delete(`/projects/${id}`),
};
