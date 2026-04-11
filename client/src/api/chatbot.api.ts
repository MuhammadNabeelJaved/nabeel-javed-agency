/**
 * Chatbot API client
 *
 * All endpoints under /api/v1/chatbot.
 * The `chat()` function uses the Fetch Streams API to receive Server-Sent
 * Events from the server and calls the provided callbacks in real-time.
 */

const BASE = '/api/v1/chatbot';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PublicChatbotConfig {
  botName: string;
  welcomeMessage: string;
  isEnabled: boolean;
}

export type ChatbotTone = 'professional' | 'friendly' | 'formal' | 'casual' | 'expert' | 'empathetic';

export interface AnthropicModel {
  id: string;
  name: string;
  tier: 'fast' | 'balanced' | 'advanced';
  badge: string;
  desc: string;
}

export interface ChatbotConfigFull {
  activeProvider: string;
  activeModel: string;
  simpleModel: string;
  availableModels: AnthropicModel[];
  systemPrompt: string;
  businessContext: string;
  botName: string;
  welcomeMessage: string;
  isEnabled: boolean;
  isUserChatEnabled: boolean;
  isTeamChatEnabled: boolean;
  userChatSystemPrompt: string;
  teamChatSystemPrompt: string;
  userChatQuickPrompts: string[];
  teamChatQuickPrompts: string[];
  userChatWelcomeMessage: string;
  teamChatWelcomeMessage: string;
  userChatContextHints: string;
  teamChatContextHints: string;
  tone: ChatbotTone;
  maxTokens: number;
  temperature: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  apiKeys: ApiKeyMeta[];
}

export interface ApiKeyMeta {
  _id: string;
  provider: string;
  label: string;
  isActive: boolean;
  addedAt: string;
  keyHint: string;
}

export interface KnowledgeEntry {
  _id: string;
  title: string;
  content: string;
  type: 'text' | 'faq' | 'file' | 'url' | 'auto';
  fileUrl?: string;
  fileName?: string;
  sourceUrl?: string;
  tags: string[];
  roleAccess: 'public' | 'user' | 'team' | 'admin';
  embeddingStatus: 'pending' | 'done' | 'failed' | 'disabled';
  isActive: boolean;
  wordCount: number;
  createdAt: string;
  createdBy?: { name: string };
}

// ─── RAG / Vector DB types ────────────────────────────────────────────────────

export interface VectorStats {
  total: number;
  byType: Record<string, number>;
  byRole: Record<string, number>;
}

export interface VectorStatus {
  embeddingEnabled: boolean;
  vectorDBEnabled: boolean;
  vectorStats: VectorStats | null;
  pendingEmbeddings: number;
  totalKBEntries: number;
  embeddedEntries: number;
}

export interface CrawlPageResult {
  path: string;
  url: string;
  title?: string;
  chunksStored?: number;
  error?: string;
}

export interface WebsiteCrawlResult {
  success: CrawlPageResult[];
  failed:  CrawlPageResult[];
  totalChunks: number;
}

export interface EmbedAllResult {
  total: number;
  done: number;
  failed: number;
}

export interface ChatbotSession {
  _id: string;
  sessionId: string;
  totalMessages: number;
  isResolved: boolean;
  lastActivity: string;
  createdAt: string;
  userId?: { name: string; email: string };
  messages?: ChatMessage[];
}

export interface ChatbotStats {
  totalSessions: number;
  totalMessages: number;
  totalKnowledge: number;
  resolvedSessions: number;
  recentActivity: ChatbotSession[];
  dailyActivity: { _id: string; count: number }[];
}

export interface UsagePeriod { cost: number; requests: number; }
export interface UsageModelRow   { model: string;    totalCost: number; requests: number; inputTokens: number; outputTokens: number; }
export interface UsageEndpointRow { endpoint: string; totalCost: number; requests: number; inputTokens: number; outputTokens: number; }
export interface UsageDailyRow   { date: string;     cost: number;      requests: number; inputTokens: number; outputTokens: number; }

export interface ChatbotUsageStats {
  summary: {
    allTime:   UsagePeriod & { inputTokens: number; outputTokens: number };
    today:     UsagePeriod;
    thisWeek:  UsagePeriod;
    thisMonth: UsagePeriod;
  };
  byModel:    UsageModelRow[];
  byEndpoint: UsageEndpointRow[];
  daily:      UsageDailyRow[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Public ───────────────────────────────────────────────────────────────────

/** Fetch the public widget config (botName, welcomeMessage, isEnabled). */
export async function getPublicConfig(): Promise<PublicChatbotConfig> {
  const data = await apiFetch<{ data: PublicChatbotConfig }>(`${BASE}/config/public`);
  return data.data;
}

/** Internal SSE streaming helper shared across all chat endpoints. */
async function _streamFromEndpoint(
  url: string,
  opts: {
    message: string;
    sessionId: string;
    history: ChatMessage[];
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (msg: string) => void;
    signal?: AbortSignal;
  },
): Promise<string> {
  const { message, sessionId, history, onDelta, onDone, onError, signal } = opts;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    const err = await response.json().catch(() => ({ message: 'Chat failed' }));
    onError(err.message || 'Chat failed');
    return '';
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';
  let   full    = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw);
        if (event.type === 'delta') {
          full += event.text;
          onDelta(event.text);
        } else if (event.type === 'done') {
          onDone();
        } else if (event.type === 'error') {
          onError(event.message || 'AI error');
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  return full;
}

/**
 * Stream a public chat message.  Calls `onDelta` for each text chunk and `onDone`
 * when the stream ends.  Returns the full response string on completion.
 */
export async function streamChat(opts: {
  message: string;
  sessionId: string;
  history: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  return _streamFromEndpoint(`${BASE}/chat`, opts);
}

/** Stream a user-dashboard chat message (requires auth). */
export async function streamUserChat(opts: {
  message: string;
  sessionId: string;
  history: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  return _streamFromEndpoint(`${BASE}/user-chat`, opts);
}

/** Stream a team-dashboard chat message (requires auth + team role). */
export async function streamTeamChat(opts: {
  message: string;
  sessionId: string;
  history: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  return _streamFromEndpoint(`${BASE}/team-chat`, opts);
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export async function getChatHistory(sessionId: string): Promise<HistoryMessage[]> {
  try {
    const data = await apiFetch<{ data: { messages: HistoryMessage[] } }>(
      `${BASE}/history/${encodeURIComponent(sessionId)}`
    );
    return data.data.messages || [];
  } catch {
    return [];
  }
}

/**
 * Fetch chat history for the authenticated user (userId-based lookup).
 * Returns the most recent session's messages + the server-assigned sessionId.
 * Use this for logged-in users so history persists across devices / localStorage clears.
 */
export async function getMyHistory(): Promise<{ messages: HistoryMessage[]; sessionId: string | null }> {
  try {
    const data = await apiFetch<{ data: { messages: HistoryMessage[]; sessionId: string | null } }>(
      `${BASE}/my-history`
    );
    return data.data;
  } catch {
    return { messages: [], sessionId: null };
  }
}

// ─── Authenticated — Dashboard config ────────────────────────────────────────

export interface DashboardConfig {
  isUserChatEnabled: boolean;
  isTeamChatEnabled: boolean;
  botName: string;
  userChatWelcomeMessage: string;
  teamChatWelcomeMessage: string;
  userChatQuickPrompts: string[];
  teamChatQuickPrompts: string[];
}

export async function getDashboardConfig(): Promise<DashboardConfig> {
  const data = await apiFetch<{ data: DashboardConfig }>(`${BASE}/dashboard-config`);
  return data.data;
}

// ─── Admin — Stats & Sessions ─────────────────────────────────────────────────

export async function getStats(): Promise<ChatbotStats> {
  const data = await apiFetch<{ data: ChatbotStats }>(`${BASE}/stats`);
  return data.data;
}

export async function getUsageStats(): Promise<ChatbotUsageStats> {
  const data = await apiFetch<{ data: ChatbotUsageStats }>(`${BASE}/usage/stats`);
  return data.data;
}

export async function getSessions(params?: {
  page?: number; limit?: number; resolved?: boolean;
}): Promise<{ sessions: ChatbotSession[]; pagination: { total: number; pages: number; page: number } }> {
  const q = new URLSearchParams();
  if (params?.page    !== undefined) q.set('page',     String(params.page));
  if (params?.limit   !== undefined) q.set('limit',    String(params.limit));
  if (params?.resolved !== undefined) q.set('resolved', String(params.resolved));
  const data = await apiFetch<{ data: any }>(`${BASE}/sessions?${q}`);
  return data.data;
}

export async function getSession(id: string): Promise<ChatbotSession> {
  const data = await apiFetch<{ data: ChatbotSession }>(`${BASE}/sessions/${id}`);
  return data.data;
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch(`${BASE}/sessions/${id}`, { method: 'DELETE' });
}

export async function resolveSession(id: string): Promise<void> {
  await apiFetch(`${BASE}/sessions/${id}/resolve`, { method: 'PATCH' });
}

// ─── Admin — Config ───────────────────────────────────────────────────────────

export async function getConfig(): Promise<ChatbotConfigFull> {
  const data = await apiFetch<{ data: ChatbotConfigFull }>(`${BASE}/config`);
  return data.data;
}

export async function updateConfig(updates: Partial<ChatbotConfigFull>): Promise<void> {
  await apiFetch(`${BASE}/config`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function addApiKey(payload: {
  provider: string; apiKey: string; label?: string; setActive?: boolean;
}): Promise<void> {
  await apiFetch(`${BASE}/config/keys`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeApiKey(keyId: string): Promise<void> {
  await apiFetch(`${BASE}/config/keys/${keyId}`, { method: 'DELETE' });
}

export async function activateApiKey(keyId: string): Promise<void> {
  await apiFetch(`${BASE}/config/keys/${keyId}/activate`, { method: 'PATCH' });
}

// ─── Admin — Knowledge ────────────────────────────────────────────────────────

export async function getKnowledge(params?: {
  page?: number; limit?: number; type?: string; active?: boolean;
}): Promise<{ entries: KnowledgeEntry[]; pagination: { total: number; pages: number } }> {
  const q = new URLSearchParams();
  if (params?.page   !== undefined) q.set('page',  String(params.page));
  if (params?.limit  !== undefined) q.set('limit', String(params.limit));
  if (params?.type)                 q.set('type',  params.type);
  if (params?.active !== undefined) q.set('active', String(params.active));
  const data = await apiFetch<{ data: any }>(`${BASE}/knowledge?${q}`);
  return data.data;
}

export async function createKnowledge(payload: {
  title: string; content: string; type?: string; tags?: string[];
}): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function updateKnowledge(id: string, payload: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export async function deleteKnowledge(id: string): Promise<void> {
  await apiFetch(`${BASE}/knowledge/${id}`, { method: 'DELETE' });
}

export async function uploadKnowledgeFile(formData: FormData): Promise<KnowledgeEntry> {
  const res = await fetch(`${BASE}/knowledge/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data.data;
}

export async function crawlUrl(payload: {
  url: string; title?: string; tags?: string[];
}): Promise<KnowledgeEntry> {
  const data = await apiFetch<{ data: KnowledgeEntry }>(`${BASE}/knowledge/crawl`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
  details: { action: 'created' | 'updated'; title: string }[];
}

export async function syncFromDatabase(): Promise<SyncResult> {
  const data = await apiFetch<{ data: SyncResult }>(`${BASE}/knowledge/sync`, {
    method: 'POST',
  });
  return data.data;
}

// ─── Admin — RAG / Vector DB ──────────────────────────────────────────────────

/** Fetch vector DB health and chunk counts. */
export async function getVectorStatus(): Promise<VectorStatus> {
  const data = await apiFetch<{ data: VectorStatus }>(`${BASE}/vector/stats`);
  return data.data;
}

/** Clear all embeddings from Supabase and reset embeddingStatus to 'pending'. */
export async function clearVectorDB(): Promise<void> {
  await apiFetch(`${BASE}/vector/clear`, { method: 'DELETE' });
}

/**
 * Crawl every active public page of the website and store embeddings.
 * @param baseUrl  - Site base URL, e.g. 'https://yoursite.com'
 * @param extraPaths - Additional relative paths to crawl
 */
export async function crawlWebsite(payload: {
  baseUrl: string;
  extraPaths?: string[];
}): Promise<WebsiteCrawlResult> {
  const data = await apiFetch<{ data: WebsiteCrawlResult }>(`${BASE}/crawl/website`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.data;
}

/**
 * Batch-generate embeddings for all active KB entries that haven't been
 * embedded yet (or all, if force=true).
 */
export async function embedAllKnowledge(force = false): Promise<EmbedAllResult> {
  const data = await apiFetch<{ data: EmbedAllResult }>(
    `${BASE}/knowledge/embed-all${force ? '?force=true' : ''}`,
    { method: 'POST' }
  );
  return data.data;
}
