import apiClient from './apiClient';

export const resourcesApi = {
  getAll:  ()                          => apiClient.get('/resources'),
  upload:  (formData: FormData)        => apiClient.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:  (id: string)               => apiClient.delete(`/resources/${id}`),
  bulkDelete: (ids: string[])         => apiClient.delete('/resources/bulk', { data: { ids } }),
};
