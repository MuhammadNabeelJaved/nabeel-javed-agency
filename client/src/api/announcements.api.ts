import apiClient from './apiClient';

export interface AnnouncementItem {
  _id: string;
  text: string;
  emoji?: string;
  link?: string;
  linkLabel?: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementPayload {
  text: string;
  emoji?: string;
  link?: string;
  linkLabel?: string;
  bgColor?: string;
  textColor?: string;
  isActive?: boolean;
  order?: number;
  barId?: string;
}

export const announcementsApi = {
  getActive:      () => apiClient.get('/announcements'),
  getAll:         () => apiClient.get('/announcements/all'),
  create:         (data: AnnouncementPayload) => apiClient.post('/announcements', data),
  update:         (id: string, data: Partial<AnnouncementPayload>) => apiClient.put(`/announcements/${id}`, data),
  delete:         (id: string) => apiClient.delete(`/announcements/${id}`),
  getSettings:    () => apiClient.get('/announcements/settings'),
  updateSettings: (settings: {
    tickerDuration?: number;
    scrollEnabled?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    separatorVisible?: boolean;
    separatorColor?: string;
    itemSpacing?: number;
  }) => apiClient.put('/announcements/settings', settings),
};
