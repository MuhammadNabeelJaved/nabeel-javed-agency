import apiClient from './apiClient';

export const twoFactorApi = {
    getStatus: () =>
        apiClient.get<{ data: { twoFactorEnabled: boolean } }>('/2fa/status').then(r => r.data.data),

    setup: () =>
        apiClient.post<{ data: { secret: string; qrCode: string; manualEntry: string } }>('/2fa/setup').then(r => r.data.data),

    verify: (token: string) =>
        apiClient.post<{ data: { backupCodes: string[] } }>('/2fa/verify', { token }).then(r => r.data.data),

    disable: (token: string, password: string) =>
        apiClient.post('/2fa/disable', { token, password }),

    validate: (token: string, userId: string) =>
        apiClient.post<{ data: { user: any; accessToken: string } }>('/2fa/validate', { token, userId }).then(r => r.data.data),

    getBackupCodes: () =>
        apiClient.get<{ data: { backupCodes: string[] } }>('/2fa/backup-codes').then(r => r.data.data),

    regenerateBackupCodes: (token: string) =>
        apiClient.post<{ data: { backupCodes: string[] } }>('/2fa/regenerate-backup', { token }).then(r => r.data.data),
};
