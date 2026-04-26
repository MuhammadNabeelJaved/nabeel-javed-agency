import apiClient from './apiClient';

export type TriggerType =
    | 'project_completed'
    | 'project_approved'
    | 'project_rejected'
    | 'milestone_ready'
    | 'milestone_approved'
    | 'welcome_user'
    | 'review_request'
    | 'payment_reminder'
    | 'inactivity_followup';

export interface EmailTemplate {
    _id: string | null;
    file: string | null;
    name: string;
    description: string;
    bestFor: TriggerType | 'custom';
    suggestedSubject: string;
    placeholders: string[];
    html: string;
    isCustom: boolean;
    aiGenerated: boolean;
    isEdited?: boolean;
}

export interface EmailAutomation {
    _id: string;
    name: string;
    trigger: TriggerType;
    delayHours: number;
    isEnabled: boolean;
    emailSubject: string;
    emailBody: string;
    emailText?: string;
    conditions?: string;
    sentCount: number;
    lastFiredAt?: string;
    createdAt: string;
}

export const emailAutomationsApi = {
    // Automations
    getAll: () =>
        apiClient.get<{ data: EmailAutomation[] }>('/email-automations').then(r => r.data.data),
    getById: (id: string) =>
        apiClient.get<{ data: EmailAutomation }>(`/email-automations/${id}`).then(r => r.data.data),
    getStats: () =>
        apiClient.get<{ data: any }>('/email-automations/stats').then(r => r.data.data),
    create: (data: Partial<EmailAutomation>) =>
        apiClient.post<{ data: EmailAutomation }>('/email-automations', data).then(r => r.data.data),
    update: (id: string, data: Partial<EmailAutomation>) =>
        apiClient.put<{ data: EmailAutomation }>(`/email-automations/${id}`, data).then(r => r.data.data),
    toggle: (id: string) =>
        apiClient.patch<{ data: EmailAutomation }>(`/email-automations/${id}/toggle`).then(r => r.data.data),
    delete: (id: string) =>
        apiClient.delete(`/email-automations/${id}`),

    // Templates
    getTemplates: () =>
        apiClient.get<{ data: EmailTemplate[] }>('/email-automations/templates').then(r => r.data.data),
    createTemplate: (data: Partial<EmailTemplate>) =>
        apiClient.post<{ data: EmailTemplate }>('/email-automations/templates', data).then(r => r.data.data),
    updateTemplate: (id: string, data: Partial<EmailTemplate> & { html: string }) =>
        apiClient.put<{ data: EmailTemplate }>(`/email-automations/templates/${id}`, data).then(r => r.data.data),
    deleteTemplate: (id: string) =>
        apiClient.delete(`/email-automations/templates/${id}`),
    resetTemplate: (id: string) =>
        apiClient.delete(`/email-automations/templates/${id}/reset`),
    generateTemplate: (payload: { trigger?: string; name: string; description: string; tone?: string }) =>
        apiClient.post<{ data: { html: string } }>('/email-automations/templates/generate', payload).then(r => r.data.data),
};
