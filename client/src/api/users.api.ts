import apiClient from './apiClient';

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getProfile: (id: string) => apiClient.get(`/users/profile/${id}`),
  createTeamMember: (data: any) => apiClient.post('/users/create-team-member', data),
  update: (id: string, data: any) => apiClient.put(`/users/update/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
