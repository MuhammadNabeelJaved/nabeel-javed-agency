import apiClient from './apiClient';

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getProfile: (id: string) => apiClient.get(`/users/profile/${id}`),
  createTeamMember: (data: any) => apiClient.post('/users/create-team-member', data),
  update: (id: string, data: FormData | Record<string, any>) =>
    apiClient.put(`/users/update/${id}`, data,
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    ),
  updatePassword: (id: string, data: { oldPassword: string; newPassword: string }) =>
    apiClient.put(`/users/update-password/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
