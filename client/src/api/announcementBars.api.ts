import apiClient from './apiClient';
import type { AnnouncementItem } from './announcements.api';

export interface AnnouncementBarConfig {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
  bgColor: string;
  textColor: string;
  scrollEnabled: boolean;
  tickerDuration: number;
  textAlign: 'left' | 'center' | 'right';
  separatorVisible: boolean;
  separatorColor: string;
  itemSpacing: number;
  createdAt?: string;
}

export interface AnnouncementBarGroup {
  bar: AnnouncementBarConfig;
  items: AnnouncementItem[];
}

export const announcementBarsApi = {
  getActive: () => apiClient.get('/announcements/bars'),
  getAll:    () => apiClient.get('/announcements/bars/all'),
  create:    (data: Partial<AnnouncementBarConfig>) => apiClient.post('/announcements/bars', data),
  update:    (id: string, data: Partial<AnnouncementBarConfig>) => apiClient.put(`/announcements/bars/${id}`, data),
  delete:    (id: string) => apiClient.delete(`/announcements/bars/${id}`),
};
