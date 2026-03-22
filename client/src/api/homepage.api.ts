import apiClient from './apiClient';

export const homepageApi = {
  get: () => apiClient.get('/homepage'),
  create: (data: any) => apiClient.post('/homepage/add', data),
  update: (data: any) => apiClient.put('/homepage/update', data),
};
