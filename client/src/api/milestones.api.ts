import apiClient from './apiClient';

export interface Deliverable {
    _id?: string;
    title: string;
    fileUrl?: string;
    isComplete: boolean;
}

export interface MilestoneEntry {
    _id: string;
    project: string | { _id: string; projectName: string; status: string };
    title: string;
    description?: string;
    phase: 'Discovery' | 'Design' | 'Development' | 'Testing' | 'Launch';
    status: 'pending' | 'in_progress' | 'needs_approval' | 'approved' | 'rejected';
    order: number;
    dueDate?: string;
    completedAt?: string;
    deliverables: Deliverable[];
    approvedBy?: { name: string; email: string };
    approvedAt?: string;
    rejectionReason?: string;
    createdBy?: { name: string; email: string };
    createdAt: string;
}

export const milestonesApi = {
    getForProject: (projectId: string) =>
        apiClient.get<{ data: MilestoneEntry[] }>(`/milestones?project=${projectId}`).then(r => r.data.data),

    getAll: (params?: { project?: string; status?: string; phase?: string }) => {
        const clean = Object.fromEntries(
            Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        const qs = new URLSearchParams(clean).toString();
        return apiClient
            .get<{ data: MilestoneEntry[] }>(`/milestones/admin${qs ? '?' + qs : ''}`)
            .then(r => r.data.data);
    },

    create: (data: Partial<MilestoneEntry>) =>
        apiClient.post<{ data: MilestoneEntry }>('/milestones', data).then(r => r.data.data),

    update: (id: string, data: Partial<MilestoneEntry>) =>
        apiClient.put<{ data: MilestoneEntry }>(`/milestones/${id}`, data).then(r => r.data.data),

    approve: (id: string) =>
        apiClient.put<{ data: MilestoneEntry }>(`/milestones/${id}/approve`).then(r => r.data.data),

    reject: (id: string, reason: string) =>
        apiClient.put<{ data: MilestoneEntry }>(`/milestones/${id}/reject`, { reason }).then(r => r.data.data),

    delete: (id: string) =>
        apiClient.delete(`/milestones/${id}`),

    toggleDeliverable: (id: string, delivId: string) =>
        apiClient.patch<{ data: MilestoneEntry }>(`/milestones/${id}/deliverable/${delivId}`).then(r => r.data.data),
};
