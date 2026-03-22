import apiClient from './apiClient';

export interface PageStatusItem {
  _id?: string;
  key: string;
  label: string;
  path: string;
  matchPrefix: boolean;
  status: 'active' | 'maintenance' | 'coming-soon';
  updatedAt?: string;
}

export const pageStatusApi = {
  getAll: () => apiClient.get<{ success: boolean; data: PageStatusItem[] }>('/page-status'),
  update: (key: string, status: string) => apiClient.put(`/page-status/${key}`, { status }),
};
