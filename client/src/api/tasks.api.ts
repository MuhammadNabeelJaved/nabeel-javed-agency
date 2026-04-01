import apiClient from './apiClient';

export const tasksApi = {
  getAll:       (params?: Record<string, any>) => apiClient.get('/tasks', { params }),
  getMy:        ()                             => apiClient.get('/tasks/my'),
  getById:      (id: string)                   => apiClient.get(`/tasks/${id}`),
  create:       (data: any)                    => apiClient.post('/tasks', data),
  update:       (id: string, data: any)        => apiClient.patch(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string)   => apiClient.patch(`/tasks/${id}/status`, { status }),
  delete:       (id: string)                   => apiClient.delete(`/tasks/${id}`),
  bulkDelete:   (ids: string[])                => apiClient.delete('/tasks/bulk', { data: { ids } }),
  bulkUpdateStatus: (ids: string[], status: string) => apiClient.patch('/tasks/bulk/status', { ids, status }),
};
