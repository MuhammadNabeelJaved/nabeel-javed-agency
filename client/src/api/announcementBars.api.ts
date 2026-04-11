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
  /** Where the bar is rendered: public pages, dashboards, or both. */
  visibility: 'public' | 'dashboard' | 'both';
  createdAt?: string;
}

export interface AnnouncementBarGroup {
  bar: AnnouncementBarConfig;
  items: AnnouncementItem[];
}

export const announcementBarsApi = {
  getActive:          () => apiClient.get('/announcements/bars'),
  /** Fetch bars with visibility 'dashboard' or 'both' — requires auth */
  getActiveDashboard: () => apiClient.get('/announcements/bars/dashboard'),
  getAll:             () => apiClient.get('/announcements/bars/all'),
  create:             (data: Partial<AnnouncementBarConfig>) => apiClient.post('/announcements/bars', data),
  update:             (id: string, data: Partial<AnnouncementBarConfig>) => apiClient.put(`/announcements/bars/${id}`, data),
  delete:             (id: string) => apiClient.delete(`/announcements/bars/${id}`),
};
