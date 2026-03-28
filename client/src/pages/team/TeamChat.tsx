/**
 * Team Chat Page
 * Real-time internal communication between team member and admin.
 * Auto-creates an admin_team conversation on first send (mirrors UserChat).
 * Sidebar shows all admin_team DM conversations.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Send, Search, Phone, Video, MoreVertical, Paperclip, Loader2,
    MessageSquarePlus, CheckCheck
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatApi, ChatMessage, Conversation } from '../../api/chat.api';
import { ChatFileMessage } from '../../components/ChatFileMessage';
import { SwipeableMessage } from '../../components/SwipeableMessage';

export default function TeamChat() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMsgsLoading, setIsMsgsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrolledToMsgRef = useRef<string | null>(null);

    // ── Load conversations ───────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const res = await chatApi.getConversations();
                const convos = (res.data.data || []).filter(
                    (c: Conversation) => c.type === 'admin_team'
                );
                setConversations(convos);
                if (convos.length > 0) await selectConversation(convos[0]);
            } catch (err: any) {
                toast.error('Failed to load conversations', { description: err?.response?.data?.message || 'Please try again.' });
            } finally {
                setIsLoading(false);
            }
        }
        if (user) load();
    }, [user]);

    const selectConversation = async (convo: Conversation) => {
        setSelectedConvo(convo);
        setMessages([]);
        if (!convo) return;
        try {
            setIsMsgsLoading(true);
            const res = await chatApi.getMessages(convo._id, 1, 50);
            const msgs = res.data.data?.messages || [];
            setMessages(msgs);
            // Update sidebar preview with latest message
            const lastMsg = msgs.filter((m: ChatMessage) => m.messageType !== 'system').pop();
            if (lastMsg) {
                setConversations((prev) =>
                    prev.map((c) =>
                        c._id === convo._id
                            ? { ...c, lastMessage: lastMsg, lastMessageAt: lastMsg.createdAt }
                            : c
                    )
                );
            }
        } catch (err: any) {
            toast.error('Failed to load messages', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsMsgsLoading(false);
        }
    };

    // Auto-select conversation from URL param ?convoId=...
    useEffect(() => {
        const convoId = searchParams.get('convoId');
        if (!convoId || conversations.length === 0) return;
        const match = conversations.find((c) => c._id === convoId);
        if (match && selectedConvo?._id !== convoId) selectConversation(match);
    }, [conversations, searchParams]);

    // ── Socket room join (and on reconnect) ──────────────────────────────────
    useEffect(() => {
        if (!socket || !selectedConvo || !isConnected) return;
        socket.emit('chat:join_conversation', { conversationId: selectedConvo._id });
        socket.emit('chat:read_messages', { conversationId: selectedConvo._id });
    }, [socket, selectedConvo?._id, isConnected]);

    // ── Socket listeners ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg: ChatMessage) => {
            if (msg.conversationId === selectedConvo?._id) {
                setMessages((prev) => {
                    if (prev.find((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                socket.emit('chat:read_messages', { conversationId: msg.conversationId });
            }
            // Update sidebar preview
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt }
                        : c
                )
            );
        };

        const onTyping = ({ userName, isTyping: typing }: { userId: string; userName: string; isTyping: boolean }) => {
            setTypingUser(typing ? userName : '');
            setIsTyping(typing);
        };

        const onDeleted = ({ messageId }: { messageId: string }) => {
            setMessages((prev) =>
                prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)
            );
        };

        socket.on('chat:new_message', onNewMessage);
        socket.on('chat:typing_indicator', onTyping);
        socket.on('chat:message_deleted', onDeleted);

        return () => {
            socket.off('chat:new_message', onNewMessage);
            socket.off('chat:typing_indicator', onTyping);
            socket.off('chat:message_deleted', onDeleted);
        };
    }, [socket, selectedConvo?._id]);

    // ── Auto-scroll (skip when navigating to specific message) ───────────────
    useEffect(() => {
        const targetId = searchParams.get('messageId');
        if (targetId && messages.find((m) => m._id === targetId)) return;
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    // ── Scroll to + highlight a specific message from notification ────────────
    useEffect(() => {
        const messageId = searchParams.get('messageId');
        if (!messageId || messages.length === 0) return;
        if (scrolledToMsgRef.current === messageId) return;
        const found = messages.find((m) => m._id === messageId);
        if (!found) return;
        scrolledToMsgRef.current = messageId;
        setHighlightedMsgId(messageId);
        setTimeout(() => {
            document.querySelector(`[data-message-id="${messageId}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        setTimeout(() => setHighlightedMsgId(null), 3000);
    }, [messages, searchParams]);

    // ── Typing indicator ─────────────────────────────────────────────────────
    const handleTypingChange = (value: string) => {
        setMessage(value);
        if (!socket || !selectedConvo) return;
        socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat:typing', { conversationId: selectedConvo._id, isTyping: false });
        }, 1500);
    };

    // ── Send text ────────────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const trimmed = message.trim();
        if (!trimmed || !socket || isSending) return;

        let activeConvo = selectedConvo;

        // If no conversation yet, create one (server auto-finds admin)
        if (!activeConvo) {
            try {
                setIsSending(true);
                const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                activeConvo = convoRes.data.data;
                setConversations([activeConvo!]);
                setSelectedConvo(activeConvo);
                socket.emit('chat:join_conversation', { conversationId: activeConvo!._id });
            } catch (err: any) {
                toast.error('Failed to start conversation', { description: err?.response?.data?.message || 'Please try again.' });
                return;
            } finally {
                setIsSending(false);
            }
        }

        setMessage('');
        const replyToId = replyTo?._id;
        setReplyTo(null);
        socket.emit('chat:typing', { conversationId: activeConvo!._id, isTyping: false });
        socket.emit('chat:send_message', {
            conversationId: activeConvo!._id,
            content: trimmed,
            messageType: 'text',
            replyToId,
        });
    }, [message, socket, selectedConvo, isSending, replyTo]);

    // ── Delete message ────────────────────────────────────────────────────────
    const handleDelete = useCallback((msgId: string) => {
        if (!socket) return;
        socket.emit('chat:delete_message', { messageId: msgId });
    }, [socket]);

    // ── File upload ──────────────────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;

        let activeConvo = selectedConvo;

        // Create conversation if needed before upload
        if (!activeConvo) {
            try {
                setIsUploading(true);
                const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                activeConvo = convoRes.data.data;
                setConversations([activeConvo!]);
                setSelectedConvo(activeConvo);
                socket.emit('chat:join_conversation', { conversationId: activeConvo!._id });
            } catch (err: any) {
                toast.error('Failed to start conversation', { description: err?.response?.data?.message || 'Please try again.' });
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        try {
            setIsUploading(true);
            const res = await chatApi.uploadFile(file);
            const { fileUrl, fileName, fileMime } = res.data.data;
            socket.emit('chat:send_message', {
                conversationId: activeConvo!._id,
                content: '',
                messageType: 'file',
                fileUrl,
                fileName,
                fileMime,
            });
        } catch (err: any) {
            toast.error('File upload failed', { description: err?.response?.data?.message || 'Please try again.' });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getOtherParticipant = (convo: Conversation) =>
        convo.participants.find((p) => p && p._id !== user?._id);

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const filteredConvos = conversations.filter((c) => {
        const other = getOtherParticipant(c);
        return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
    });

    const adminParticipant = selectedConvo ? getOtherParticipant(selectedConvo) : null;

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4">
            {/* Sidebar */}
            <Card className="w-64 flex flex-col overflow-hidden border-border/50">
                <div className="p-3 border-b border-border/50 bg-secondary/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Direct Messages
                    </p>
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : filteredConvos.length === 0 ? (
                        // No conversation yet — show a clickable "Start chat with Admin" entry
                        <button
                            onClick={async () => {
                                if (!socket) return;
                                try {
                                    const convoRes = await chatApi.getOrCreateConversation(undefined, 'admin_team');
                                    const convo = convoRes.data.data;
                                    setConversations([convo]);
                                    await selectConversation(convo);
                                } catch (err: any) {
                                    toast.error('Failed to connect', { description: err?.response?.data?.message });
                                }
                            }}
                            className="w-full text-left px-3 py-3 flex items-center gap-2.5 hover:bg-muted/50 transition-colors"
                        >
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">Admin Support</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MessageSquarePlus className="h-3 w-3" /> Start conversation
                                </p>
                            </div>
                        </button>
                    ) : (
                        filteredConvos.map((convo) => {
                            const other = getOtherParticipant(convo);
                            const isSelected = selectedConvo?._id === convo._id;
                            const lastMsg = (convo as any).lastMessage;
                            return (
                                <button
                                    key={convo._id}
                                    onClick={() => selectConversation(convo)}
                                    className={`w-full text-left px-3 py-3 flex items-center gap-2.5 transition-colors border-b border-border/30 ${
                                        isSelected
                                            ? 'bg-primary/10 border-l-2 border-l-primary'
                                            : 'hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        {other?.photo && other.photo !== 'default.jpg' ? (
                                            <img src={other.photo} alt={other.name} className="h-9 w-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {other?.name?.charAt(0) ?? 'A'}
                                            </div>
                                        )}
                                        {isConnected && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                {other?.name ?? 'Admin'}
                                            </p>
                                            {lastMsg && (
                                                <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                                                    {formatTime(lastMsg.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {lastMsg
                                                ? lastMsg.messageType === 'file' ? '📎 File' : lastMsg.content
                                                : 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-lg">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {adminParticipant?.photo && adminParticipant.photo !== 'default.jpg' ? (
                                <img src={adminParticipant.photo} alt={adminParticipant.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {adminParticipant?.name?.charAt(0) ?? 'A'}
                                </div>
                            )}
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{adminParticipant?.name ?? 'Admin Support'}</h3>
                            <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {isConnected ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 bg-muted/20">
                    {isMsgsLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <MessageSquarePlus className="h-10 w-10 opacity-20" />
                            <p className="text-sm">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderId?._id === user?._id;
                            const prevMsg = messages[index - 1];
                            const nextMsg = messages[index + 1];
                            const isFirstInGroup = !prevMsg || prevMsg.messageType === 'system' || prevMsg.senderId?._id !== msg.senderId?._id;
                            const isLastInGroup = !nextMsg || nextMsg.messageType === 'system' || nextMsg.senderId?._id !== msg.senderId?._id;
                            const senderName = msg.senderId?.name ?? 'Support';
                            const senderPhoto = (msg.senderId as any)?.photo;
                            const isHighlighted = highlightedMsgId === msg._id;

                            if (msg.messageType === 'system') {
                                return (
                                    <div key={msg._id} className="flex justify-center my-4">
                                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{msg.content}</span>
                                    </div>
                                );
                            }

                            return (
                                <motion.div
                                    key={msg._id}
                                    data-message-id={msg._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'} ${isHighlighted ? 'rounded-2xl ring-2 ring-primary/50 bg-primary/5 transition-all duration-500' : ''}`}
                                >
                                    {/* Avatar — other side only, last in group */}
                                    {!isMe && (
                                        <div className="w-8 h-8 shrink-0">
                                            {isLastInGroup ? (
                                                senderPhoto && senderPhoto !== 'default.jpg' ? (
                                                    <img src={senderPhoto} alt={senderName} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {senderName.charAt(0).toUpperCase()}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="w-8 h-8" />
                                            )}
                                        </div>
                                    )}

                                    <div className={`max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {isFirstInGroup && !isMe && (
                                            <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">{senderName}</span>
                                        )}
                                        <SwipeableMessage msg={msg} isMe={isMe} onReply={setReplyTo} onDelete={handleDelete}>
                                            <div
                                                className={`px-4 py-2.5 shadow-sm text-sm ${
                                                    isMe
                                                        ? `bg-primary text-primary-foreground ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl'}`
                                                        : `bg-card border border-border/50 ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl'}`
                                                }`}
                                            >
                                                {msg.replyTo && (
                                                    <div className={`mb-2 px-2 py-1 rounded-lg border-l-2 text-xs opacity-70 ${isMe ? 'border-white/40 bg-white/10' : 'border-primary/40 bg-muted/50'}`}>
                                                        <span className="font-semibold">{msg.replyTo.senderId?.name ?? 'Deleted User'}</span>
                                                        <p className="truncate">{msg.replyTo.isDeleted ? 'Deleted message' : (msg.replyTo.messageType === 'file' ? `📎 ${msg.replyTo.fileName}` : msg.replyTo.content)}</p>
                                                    </div>
                                                )}
                                                {msg.isDeleted ? (
                                                    <p className="italic opacity-50">Message deleted</p>
                                                ) : msg.messageType === 'file' ? (
                                                    <ChatFileMessage
                                                        fileUrl={msg.fileUrl ?? ''}
                                                        fileName={msg.fileName ?? 'File'}
                                                        fileMime={msg.fileMime}
                                                        isMe={isMe}
                                                    />
                                                ) : (
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                )}
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    {isMe && <CheckCheck className="h-3 w-3" />}
                                                </div>
                                            </div>
                                        </SwipeableMessage>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    {isTyping && (
                        <div className="flex items-end gap-2 mt-2">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {adminParticipant?.name?.charAt(0) ?? 'A'}
                            </div>
                            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                <div className="flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">{typingUser} is typing</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-border/50 bg-background">
                    {replyTo && (
                        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                            <div className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-muted border-l-2 border-primary">
                                <span className="font-semibold text-primary">{replyTo.senderId?.name ?? 'Deleted User'}</span>
                                <p className="truncate text-muted-foreground">{replyTo.messageType === 'file' ? `📎 ${replyTo.fileName}` : replyTo.content}</p>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
                        </div>
                    )}
                    <div className="p-4">
                        <input type="file" accept="*/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                            </Button>
                            <input
                                type="text"
                                placeholder="Type your message…"
                                value={message}
                                onChange={(e) => handleTypingChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                className="flex-1 bg-secondary/50 border-transparent focus:bg-background border focus:border-primary/50 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
                            />
                            <Button
                                onClick={handleSend}
                                size="icon"
                                className="rounded-full shadow-lg shadow-primary/25 shrink-0"
                                disabled={!message.trim() || isSending}
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
