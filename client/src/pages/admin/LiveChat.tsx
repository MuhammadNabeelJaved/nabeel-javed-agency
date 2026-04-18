import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  MessageCircle, Users, Clock, Send, X,
  Loader2, Search, RefreshCw, Trash2, Tag, FileText, User,
  Wifi, WifiOff, Sparkles, Zap, ChevronRight, Edit2, Plus,
  CheckCircle, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { liveChatApi, LiveChatSessionDoc, LiveChatMessageDoc, CannedResponseDoc } from '../../api/liveChat.api';
import { cn } from '../../lib/utils';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || window.location.origin;

type SessionTab = 'waiting' | 'active' | 'closed' | 'canned';

interface TeamMember {
  _id: string;
  name: string;
  photo?: string;
  role: string;
}

interface CannedForm {
  title: string;
  shortcut: string;
  category: string;
  content: string;
}

const EMPTY_CANNED_FORM: CannedForm = { title: '', shortcut: '', category: '', content: '' };

function formatWait(startedAt: string) {
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active:  'bg-green-500/20 text-green-400 border-green-500/30',
    closed:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
    missed:  'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs border capitalize', map[status] ?? map.closed)}>
      {status}
    </span>
  );
}

export default function LiveChat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SessionTab) || 'waiting';

  // ── Core state ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<SessionTab>(initialTab);
  const [sessions, setSessions] = useState<LiveChatSessionDoc[]>([]);
  const [selected, setSelected] = useState<LiveChatSessionDoc | null>(null);
  const [messages, setMessages] = useState<LiveChatMessageDoc[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [agentNotes, setAgentNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [stats, setStats] = useState({ waiting: 0, active: 0, todayTotal: 0, avgWaitSec: 0 });
  const [socketConnected, setSocketConnected] = useState(false);

  // ── New feature state ─────────────────────────────────────────────────────
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);
  const [cannedSearch, setCannedSearch] = useState('');
  const [cannedResponses, setCannedResponses] = useState<CannedResponseDoc[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // ── Canned management state ───────────────────────────────────────────────
  const [cannedLoading, setCannedLoading] = useState(false);
  const [editingCanned, setEditingCanned] = useState<CannedResponseDoc | null>(null);
  const [cannedForm, setCannedForm] = useState<CannedForm>(EMPTY_CANNED_FORM);
  const [cannedFormOpen, setCannedFormOpen] = useState(false);
  const [cannedSaving, setCannedSaving] = useState(false);
  const [selectedCannedId, setSelectedCannedId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<LiveChatSessionDoc | null>(null);
  const tabRef = useRef<SessionTab>(tab);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  // ── Connect to /livechat namespace as agent ──────────────────────────────
  useEffect(() => {
    const sock = io(`${SOCKET_URL}/livechat`, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });
    socketRef.current = sock;

    sock.on('connect', () => setSocketConnected(true));
    sock.on('disconnect', () => setSocketConnected(false));
    sock.on('connect_error', (err) => console.warn('[livechat socket]', err.message));

    sock.on('lc:queue_update', ({ sessions: list }: { sessions: LiveChatSessionDoc[] }) => {
      setSessions(prev => {
        const closedAndMissed = prev.filter(s => s.status === 'closed' || s.status === 'missed');
        return [...list, ...closedAndMissed.filter(c => !list.find(l => l._id === c._id))];
      });
      setStats(prev => ({
        ...prev,
        waiting: list.filter(s => s.status === 'waiting').length,
        active: list.filter(s => s.status === 'active').length,
      }));
    });

    sock.on('lc:new_session', ({ session }: { session: LiveChatSessionDoc }) => {
      setSessions(prev => prev.find(s => s.sessionId === session.sessionId) ? prev : [session, ...prev]);
      toast.info(`New chat request from ${session.visitorName}`);
      liveChatApi.getSessions({ status: 'waiting' })
        .then(({ sessions: list }) => setSessions(prev => {
          const merged = [...prev];
          list.forEach(s => { if (!merged.find(x => x._id === s._id)) merged.unshift(s); });
          return merged;
        }))
        .catch(() => {});
      liveChatApi.getStats().then(setStats).catch(() => {});
    });

    sock.on('lc:session_update', (update: { sessionId: string; status: string }) => {
      setSessions(prev => prev.map(s =>
        s.sessionId === update.sessionId ? { ...s, status: update.status as LiveChatSessionDoc['status'] } : s
      ));
      if (selectedRef.current?.sessionId === update.sessionId) {
        setSelected(prev => prev ? { ...prev, status: update.status as LiveChatSessionDoc['status'] } : prev);
      }
    });

    sock.on('lc:new_message', (msg: LiveChatMessageDoc) => {
      if (selectedRef.current?.sessionId === msg.sessionId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });

    sock.on('lc:typing_indicator', ({ sessionId, sender, isTyping: t }: { sessionId: string; sender: string; isTyping: boolean }) => {
      if (sender === 'visitor' && selectedRef.current?.sessionId === sessionId) {
        setVisitorTyping(t);
      }
    });

    sock.on('lc:session_closed', ({ sessionId }: { sessionId: string }) => {
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId || tabRef.current === 'closed'));
      if (selectedRef.current?.sessionId === sessionId) {
        setSelected(prev => prev ? { ...prev, status: 'closed' } : prev);
      }
    });

    return () => { sock.disconnect(); };
  }, []);

  // ── Load team members ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/v1/users', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        const all: TeamMember[] = Array.isArray(json.data) ? json.data : [];
        setTeamMembers(all.filter(u => u.role === 'team'));
      })
      .catch(() => {});
  }, []);

  // ── Load canned responses ─────────────────────────────────────────────────
  const loadCannedResponses = useCallback(async () => {
    setCannedLoading(true);
    try {
      const { responses } = await liveChatApi.getCannedResponses();
      setCannedResponses(responses);
    } catch { /* ignore */ }
    finally { setCannedLoading(false); }
  }, []);

  useEffect(() => { loadCannedResponses(); }, [loadCannedResponses]);

  const filteredCanned = cannedResponses.filter(c =>
    !cannedSearch ||
    c.title.toLowerCase().includes(cannedSearch.toLowerCase()) ||
    c.content.toLowerCase().includes(cannedSearch.toLowerCase()) ||
    (c.shortcut && c.shortcut.toLowerCase().includes(cannedSearch.toLowerCase()))
  );

  // ── Sessions ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try { const s = await liveChatApi.getStats(); setStats(s); } catch { /* ignore */ }
  }, []);

  const loadSessions = useCallback(async () => {
    if (tab === 'canned') return;
    setLoading(true);
    try {
      const { sessions: list } = await liveChatApi.getSessions({ status: tab, search: search || undefined });
      setSessions(list);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { loadSessions(); loadStats(); }, [loadSessions, loadStats]);

  useEffect(() => {
    const t = searchParams.get('tab') as SessionTab;
    if (t && t !== tab) setTab(t);
  }, [searchParams]);

  // ── Select session ────────────────────────────────────────────────────────
  const selectSession = useCallback(async (session: LiveChatSessionDoc) => {
    setSelected(session);
    setShowInfo(false);
    setAgentNotes(session.agentNotes || '');
    setMsgsLoading(true);
    try {
      const { messages: msgs } = await liveChatApi.getMessages(session.sessionId);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgsLoading(false); }
  }, []);

  // ── Chat handlers (kept intact) ───────────────────────────────────────────
  const handleAccept = (sessionId: string) => {
    socketRef.current?.emit('lc:agent_accept', { sessionId });
  };

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    socketRef.current?.emit('lc:message', { sessionId: selected.sessionId, content: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selected) {
      socketRef.current?.emit('lc:typing', { sessionId: selected.sessionId, isTyping: true });
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        socketRef.current?.emit('lc:typing', { sessionId: selected.sessionId, isTyping: false });
      }, 1500));
    }
  };

  const handleClose = () => {
    if (!selected) return;
    socketRef.current?.emit('lc:close', { sessionId: selected.sessionId });
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await liveChatApi.updateSession(selected._id, { agentNotes });
      toast.success('Notes saved');
    } catch { toast.error('Failed to save notes'); }
  };

  const addTag = async () => {
    if (!tagInput.trim() || !selected) return;
    const newTags = [...(selected.tags || []), tagInput.trim()];
    try {
      const { session } = await liveChatApi.updateSession(selected._id, { tags: newTags });
      setSelected(session);
      setSessions(prev => prev.map(s => s._id === session._id ? session : s));
      setTagInput('');
    } catch { toast.error('Failed to add tag'); }
  };

  const removeTag = async (tag: string) => {
    if (!selected) return;
    const newTags = selected.tags.filter(t => t !== tag);
    try {
      const { session } = await liveChatApi.updateSession(selected._id, { tags: newTags });
      setSelected(session);
      setSessions(prev => prev.map(s => s._id === session._id ? session : s));
    } catch { toast.error('Failed to remove tag'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session and all its messages?')) return;
    try {
      await liveChatApi.deleteSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success('Session deleted');
    } catch { toast.error('Failed to delete session'); }
  };

  // ── AI suggest ────────────────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!selected) return;
    setIsAiLoading(true);
    try {
      const { suggestion } = await liveChatApi.suggestReply(selected.sessionId);
      setInput(suggestion);
    } catch { toast.error('AI suggestion failed'); }
    finally { setIsAiLoading(false); }
  };

  // ── Canned CRUD ───────────────────────────────────────────────────────────
  const openCannedCreate = () => {
    setEditingCanned(null);
    setCannedForm(EMPTY_CANNED_FORM);
    setCannedFormOpen(true);
    setSelectedCannedId(null);
  };

  const openCannedEdit = (c: CannedResponseDoc) => {
    setEditingCanned(c);
    setCannedForm({ title: c.title, shortcut: c.shortcut || '', category: c.category || '', content: c.content });
    setCannedFormOpen(true);
    setSelectedCannedId(c._id);
  };

  const handleCannedSave = async () => {
    if (!cannedForm.title.trim() || !cannedForm.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setCannedSaving(true);
    try {
      if (editingCanned) {
        const { response } = await liveChatApi.updateCannedResponse(editingCanned._id, cannedForm);
        setCannedResponses(prev => prev.map(c => c._id === response._id ? response : c));
        toast.success('Response updated');
      } else {
        const { response } = await liveChatApi.createCannedResponse(cannedForm);
        setCannedResponses(prev => [response, ...prev]);
        toast.success('Response created');
      }
      setCannedFormOpen(false);
      setEditingCanned(null);
      setCannedForm(EMPTY_CANNED_FORM);
      setSelectedCannedId(null);
    } catch { toast.error('Failed to save canned response'); }
    finally { setCannedSaving(false); }
  };

  const handleCannedDelete = async (id: string) => {
    if (!confirm('Delete this canned response?')) return;
    try {
      await liveChatApi.deleteCannedResponse(id);
      setCannedResponses(prev => prev.filter(c => c._id !== id));
      if (selectedCannedId === id) { setCannedFormOpen(false); setSelectedCannedId(null); }
      toast.success('Response deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filteredSessions = sessions.filter(s => s.status === tab);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Stats bar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Live Chat</h1>
            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border',
              socketConnected
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            )}>
              {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {socketConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { loadSessions(); loadStats(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Waiting',  value: stats.waiting,   color: 'text-yellow-400', Icon: Clock },
            { label: 'Active',   value: stats.active,    color: 'text-green-400',  Icon: Users },
            { label: 'Today',    value: stats.todayTotal, color: 'text-blue-400',  Icon: MessageCircle },
            { label: 'Avg Wait', value: stats.avgWaitSec < 60 ? `${stats.avgWaitSec}s` : `${Math.floor(stats.avgWaitSec / 60)}m`, color: 'text-purple-400', Icon: Clock },
          ].map(({ label, value, color, Icon }) => (
            <Card key={label} className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className={cn('w-4 h-4', color)} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={cn('text-lg font-bold', color)}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden gap-0 px-4 pb-4">

        {/* ── Left panel ───────────────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-muted/20 dark:bg-white/3 border border-border/50 dark:border-white/10 rounded-2xl mr-3 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50 dark:border-white/10 overflow-x-auto">
            {(['waiting', 'active', 'closed', 'canned'] as SessionTab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearchParams({ tab: t }); }}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors capitalize whitespace-nowrap px-1',
                  tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'canned' ? 'Quick' : t}
                {t === 'waiting' && stats.waiting > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px]">{stats.waiting}</span>
                )}
                {t === 'active' && stats.active > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px]">{stats.active}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Canned responses list ─────────────────────────────────────── */}
          {tab === 'canned' ? (
            <>
              <div className="p-2 border-b border-border/50 dark:border-white/10 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={cannedSearch}
                    onChange={e => setCannedSearch(e.target.value)}
                    placeholder="Search…"
                    className="pl-8 h-8 text-sm bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                  />
                </div>
                <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={openCannedCreate} title="New response">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {cannedLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : filteredCanned.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Zap className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No canned responses</p>
                    <button onClick={openCannedCreate} className="text-xs text-primary mt-1 hover:underline">Create one</button>
                  </div>
                ) : filteredCanned.map(c => (
                  <div
                    key={c._id}
                    onClick={() => openCannedEdit(c)}
                    className={cn(
                      'p-3 border-b border-border/30 dark:border-white/5 cursor-pointer hover:bg-muted/50 dark:hover:bg-white/5 transition-colors',
                      selectedCannedId === c._id && 'bg-muted dark:bg-white/10'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-medium truncate">{c.title}</span>
                          {c.shortcut && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{c.shortcut}</span>
                          )}
                        </div>
                        {c.category && <p className="text-[10px] text-muted-foreground mb-0.5">{c.category}</p>}
                        <p className="text-xs text-muted-foreground truncate">{c.content}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleCannedDelete(c._id); }}
                        className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* ── Session list ─────────────────────────────────────────────── */
            <>
              <div className="p-2 border-b border-border/50 dark:border-white/10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search visitors…"
                    className="pl-8 h-8 text-sm bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No {tab} sessions</p>
                  </div>
                ) : filteredSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => selectSession(session)}
                    className={cn(
                      'p-3 border-b border-border/30 dark:border-white/5 cursor-pointer hover:bg-muted/50 dark:hover:bg-white/5 transition-colors',
                      selected?._id === session._id && 'bg-muted dark:bg-white/10'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium truncate">{session.visitorName}</span>
                          {/* Assigned agent avatar */}
                          {session.assignedTo && (
                            <div
                              className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 ml-auto"
                              title={`Assigned to ${session.assignedTo.name}`}
                            >
                              {session.assignedTo.photo ? (
                                <img src={session.assignedTo.photo} className="w-full h-full rounded-full object-cover" alt={session.assignedTo.name} />
                              ) : (
                                <span className="text-[8px] text-emerald-400 font-bold">{session.assignedTo.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {session.visitorEmail && (
                          <p className="text-xs text-muted-foreground truncate pl-7">{session.visitorEmail}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 pl-7">
                          <StatusBadge status={session.status} />
                          <span className="text-xs text-muted-foreground">{formatWait(session.startedAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {session.status === 'waiting' && (
                          <Button size="sm" className="h-6 text-xs px-2"
                            onClick={e => { e.stopPropagation(); handleAccept(session.sessionId); selectSession(session); }}>
                            Accept
                          </Button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(session._id); }}
                          className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Center + Right area ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden gap-3">

          {/* ── Center panel (chat / canned form) ─────────────────────────── */}
          <div className="flex-1 flex flex-col bg-muted/20 dark:bg-white/3 border border-border/50 dark:border-white/10 rounded-2xl overflow-hidden">
            {tab === 'canned' ? (
              /* Canned response create/edit form */
              cannedFormOpen ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 dark:border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-semibold">{editingCanned ? 'Edit Response' : 'New Canned Response'}</h2>
                    </div>
                    <button onClick={() => { setCannedFormOpen(false); setEditingCanned(null); setSelectedCannedId(null); }}
                      className="p-1 rounded hover:bg-muted dark:hover:bg-white/10 text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title <span className="text-red-400">*</span></label>
                      <Input
                        value={cannedForm.title}
                        onChange={e => setCannedForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Greeting"
                        className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Shortcut</label>
                        <Input
                          value={cannedForm.shortcut}
                          onChange={e => setCannedForm(f => ({ ...f, shortcut: e.target.value }))}
                          placeholder="e.g. /greet"
                          className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                        <Input
                          value={cannedForm.category}
                          onChange={e => setCannedForm(f => ({ ...f, category: e.target.value }))}
                          placeholder="e.g. Support"
                          className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Content <span className="text-red-400">*</span></label>
                      <Textarea
                        value={cannedForm.content}
                        onChange={e => setCannedForm(f => ({ ...f, content: e.target.value }))}
                        placeholder="Type the response text…"
                        className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10 resize-none min-h-[160px]"
                      />
                    </div>
                    {cannedForm.content && (
                      <div className="rounded-xl border border-border/50 dark:border-white/10 bg-muted/40 dark:bg-white/5 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
                        <p className="text-sm whitespace-pre-wrap">{cannedForm.content}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 dark:border-white/10 flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setCannedFormOpen(false); setEditingCanned(null); setSelectedCannedId(null); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCannedSave} disabled={cannedSaving}>
                      {cannedSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                      {editingCanned ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* No canned selected — empty state */
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <Zap className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm mb-2">Quick Reply Templates</p>
                  <p className="text-xs text-center max-w-xs mb-4">Create reusable responses to speed up your support workflow.</p>
                  <Button size="sm" onClick={openCannedCreate}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> New Response
                  </Button>
                </div>
              )
            ) : /* ── Chat panel ───────────────────────────────────────────── */ (
              !selected ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">Select a session to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 dark:border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{selected.visitorName}</p>
                        {selected.visitorEmail && <p className="text-xs text-muted-foreground">{selected.visitorEmail}</p>}
                      </div>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowInfo(v => !v)}
                        className={cn('p-1.5 rounded-lg transition-colors', showInfo ? 'bg-primary/20 text-primary' : 'hover:bg-muted dark:hover:bg-white/10 text-muted-foreground')}
                        title={showInfo ? 'Hide info' : 'Show info'}
                      >
                        {showInfo ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                      </button>
                      {selected.status === 'waiting' && (
                        <Button size="sm" onClick={() => handleAccept(selected.sessionId)}>Accept Chat</Button>
                      )}
                      {(selected.status === 'waiting' || selected.status === 'active') && (
                        <Button size="sm" variant="destructive" onClick={handleClose}>
                          <X className="w-3.5 h-3.5 mr-1" /> End
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {msgsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : messages.map(msg => (
                      <div key={msg._id} className={cn('flex',
                        msg.sender === 'system' ? 'justify-center' :
                        msg.sender === 'agent'  ? 'justify-end'   : 'justify-start'
                      )}>
                        {msg.sender === 'system' ? (
                          <span className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/40 dark:bg-white/5 rounded-full">
                            {msg.content}
                          </span>
                        ) : (
                          <div className={cn('max-w-[70%] rounded-2xl px-3 py-2 text-sm',
                            msg.sender === 'agent'
                              ? 'bg-primary/20 text-foreground rounded-br-sm'
                              : 'bg-muted dark:bg-white/10 text-foreground rounded-bl-sm'
                          )}>
                            {msg.sender === 'agent' && (
                              <p className="text-xs text-primary/70 mb-0.5 font-medium">{msg.senderName || 'Agent'}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {visitorTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted dark:bg-white/10 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                          {[0,1,2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick reply picker */}
                  {showCannedPicker && selected.status === 'active' && (
                    <div className="flex-shrink-0 border-t border-border/50 dark:border-white/10 bg-background dark:bg-background/50 max-h-48 overflow-y-auto">
                      <div className="p-2 border-b border-border/50 dark:border-white/10 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          value={cannedSearch}
                          onChange={e => setCannedSearch(e.target.value)}
                          placeholder="Search responses…"
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                        <button onClick={() => setShowCannedPicker(false)}>
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      {filteredCanned.map(c => (
                        <button
                          key={c._id}
                          onClick={() => { setInput(c.content); setShowCannedPicker(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 dark:hover:bg-white/5 border-b border-border/30 dark:border-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium">{c.title}</span>
                            {c.shortcut && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c.shortcut}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">{c.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.content}</p>
                        </button>
                      ))}
                      {filteredCanned.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">No responses found</p>
                      )}
                    </div>
                  )}

                  {/* Input area */}
                  {selected.status === 'active' && (
                    <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        {/* Quick replies button */}
                        <Button
                          type="button" size="icon" variant="ghost"
                          onClick={() => { setShowCannedPicker(v => !v); setCannedSearch(''); }}
                          title="Quick replies"
                          className={cn('h-8 w-8 shrink-0', showCannedPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary')}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>

                        <Input
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message…"
                          className="bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10 flex-1"
                        />

                        {/* AI suggest */}
                        <Button
                          type="button" size="icon" variant="ghost"
                          disabled={!selected || selected.status !== 'active' || isAiLoading}
                          onClick={handleAiSuggest}
                          title="AI suggest reply"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                        >
                          {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>

                        <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="h-8 w-8 shrink-0">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selected.status === 'waiting' && (
                    <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 dark:border-white/10 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Accept this chat to start messaging</p>
                      <Button onClick={() => handleAccept(selected.sessionId)}>Accept Chat</Button>
                    </div>
                  )}
                  {(selected.status === 'closed' || selected.status === 'missed') && (
                    <div className={cn('flex-shrink-0 px-4 py-3 border-t border-border/50 dark:border-white/10 text-center text-sm',
                      selected.status === 'missed' ? 'text-yellow-400' : 'text-muted-foreground'
                    )}>
                      {selected.status === 'missed' ? 'Visitor left before an agent joined' : 'This session is closed'}
                    </div>
                  )}
                </>
              )
            )}
          </div>

          {/* ── Right info sidebar (chat sessions only) ───────────────────── */}
          {tab !== 'canned' && (
            <AnimatePresence>
              {showInfo && selected && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 256, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 overflow-hidden"
                >
                  <div className="w-64 h-full bg-muted/20 dark:bg-white/3 border border-border/50 dark:border-white/10 rounded-2xl overflow-y-auto p-4 space-y-5">

                    {/* Visitor info */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visitor</h3>
                      <div className="space-y-1.5 text-sm">
                        <p><span className="text-muted-foreground">Name: </span>{selected.visitorName}</p>
                        {selected.visitorEmail && <p><span className="text-muted-foreground">Email: </span>{selected.visitorEmail}</p>}
                        <p><span className="text-muted-foreground">Wait: </span>{formatWait(selected.startedAt)}</p>
                        {selected.pageUrl && (
                          <p>
                            <span className="text-muted-foreground block">Page:</span>
                            <a href={selected.pageUrl} target="_blank" rel="noreferrer" className="text-primary text-xs truncate block">{selected.pageUrl}</a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Assign agent */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assign Agent</h3>
                      <select
                        value={selected.assignedTo?._id || ''}
                        onChange={async e => {
                          const val = e.target.value || null;
                          try {
                            const { session } = await liveChatApi.assignSession(selected._id, val);
                            setSelected(session);
                            setSessions(prev => prev.map(s => s._id === session._id ? session : s));
                            toast.success(val ? 'Session assigned' : 'Assignment removed');
                          } catch { toast.error('Failed to assign'); }
                        }}
                        className="w-full bg-muted/40 dark:bg-white/5 border border-border/50 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                      {selected.assignedTo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: <span className="text-foreground">{selected.assignedTo.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(selected.tags || []).map(tag => (
                          <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {tag}
                            <button onClick={() => removeTag(tag)}><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTag()}
                          placeholder="Add tag…"
                          className="h-7 text-xs bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10"
                        />
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={addTag}>
                          <Tag className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                      <Textarea
                        value={agentNotes}
                        onChange={e => setAgentNotes(e.target.value)}
                        onBlur={saveNotes}
                        placeholder="Private notes…"
                        className="text-xs bg-muted/40 dark:bg-white/5 border-border/50 dark:border-white/10 resize-none min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-saved on blur</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
