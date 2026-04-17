const BASE = '/api/v1/live-chat';

export interface LiveChatSessionDoc {
  _id: string;
  sessionId: string;
  visitorName: string;
  visitorEmail: string | null;
  status: 'waiting' | 'active' | 'closed' | 'missed';
  agentId: { _id: string; name: string; photo: string } | null;
  startedAt: string;
  acceptedAt: string | null;
  closedAt: string | null;
  closedBy: 'agent' | 'visitor' | 'system' | null;
  tags: string[];
  agentNotes: string;
  userAgent: string | null;
  pageUrl: string | null;
}

export interface LiveChatMessageDoc {
  _id: string;
  sessionId: string;
  sender: 'visitor' | 'agent' | 'system';
  senderId: string | null;
  senderName: string | null;
  senderPhoto: string | null;
  content: string;
  timestamp: string;
}

export interface LiveChatStats {
  total: number;
  waiting: number;
  active: number;
  closed: number;
  missed: number;
  avgWaitSec: number;
  todayTotal: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...options });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data as T;
}

export const liveChatApi = {
  getStats: () =>
    apiFetch<LiveChatStats>(`${BASE}/stats`),

  getSessions: (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page)   q.set('page', String(params.page));
    if (params?.limit)  q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    return apiFetch<{ sessions: LiveChatSessionDoc[]; total: number }>(`${BASE}/sessions?${q}`);
  },

  getSessionById: (id: string) =>
    apiFetch<{ session: LiveChatSessionDoc; messages: LiveChatMessageDoc[] }>(`${BASE}/sessions/${id}`),

  updateSession: (id: string, payload: { tags?: string[]; agentNotes?: string; status?: string }) =>
    apiFetch<{ session: LiveChatSessionDoc }>(`${BASE}/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  deleteSession: (id: string) =>
    apiFetch<null>(`${BASE}/sessions/${id}`, { method: 'DELETE' }),

  getMessages: (sessionId: string) =>
    apiFetch<{ messages: LiveChatMessageDoc[] }>(`${BASE}/messages/${sessionId}`),
};
