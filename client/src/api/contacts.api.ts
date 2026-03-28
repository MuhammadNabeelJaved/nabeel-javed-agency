import apiClient from './apiClient';

export const contactsApi = {
  create: (data: { name: string; email: string; subject?: string; message: string; phone?: string }) =>
    apiClient.post('/contacts', data),
  getAll: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; order?: string }) =>
    apiClient.get('/contacts', { params }),
  getById: (id: string) => apiClient.get(`/contacts/${id}`),
  update: (id: string, data: any) => apiClient.put(`/contacts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/contacts/${id}`),
  deleteBulk: (ids: string[]) => apiClient.delete('/contacts', { data: { ids } }),
  getStats: () => apiClient.get('/contacts/stats'),
};
