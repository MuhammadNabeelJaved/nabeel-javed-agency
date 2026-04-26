import apiClient from './apiClient';

export interface NotificationSound {
    _id: string;
    name: string;
    fileUrl: string;
    storage: 'local' | 'cloudinary' | 'external';
    mimeType: string;
    originalFilename: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
}

export interface NotificationSoundRule {
    _id: string;
    audience: 'admin' | 'team' | 'user' | 'public';
    notificationType: string;
    label: string;
    isEnabled: boolean;
    isImportant: boolean;
    volume: number;
    cooldownMs: number;
    soundId: string | NotificationSound;
    createdAt: string;
}

export interface NotificationTypeOption {
    value: string;
    label: string;
}

export const notificationSoundsApi = {
    getMyConfig: () =>
        apiClient.get<{ data: { audience: string; sounds: NotificationSound[]; rules: NotificationSoundRule[] } }>('/notification-sounds/config'),

    getAdminData: () =>
        apiClient.get<{
            data: {
                sounds: NotificationSound[];
                rules: NotificationSoundRule[];
                notificationTypes: NotificationTypeOption[];
                audiences: string[];
            };
        }>('/notification-sounds/admin'),

    createSound: (formData: FormData) =>
        apiClient.post<{ data: NotificationSound }>('/notification-sounds/admin/sounds', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    updateSound: (id: string, formData: FormData) =>
        apiClient.put<{ data: NotificationSound }>(`/notification-sounds/admin/sounds/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    deleteSound: (id: string) =>
        apiClient.delete(`/notification-sounds/admin/sounds/${id}`),

    createRule: (payload: Record<string, unknown>) =>
        apiClient.post<{ data: NotificationSoundRule }>('/notification-sounds/admin/rules', payload),

    updateRule: (id: string, payload: Record<string, unknown>) =>
        apiClient.put<{ data: NotificationSoundRule }>(`/notification-sounds/admin/rules/${id}`, payload),

    deleteRule: (id: string) =>
        apiClient.delete(`/notification-sounds/admin/rules/${id}`),
};
