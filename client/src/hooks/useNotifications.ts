import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../api/notifications.api';
import { notificationSoundsApi, type NotificationSound, type NotificationSoundRule } from '../api/notificationSounds.api';

export interface AppNotification {
    _id: string;
    type: string;
    title: string;
    message: string;
    payload: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
    createdBy?: { name: string; photo: string; role: string };
}

interface UseNotificationsOptions {
    enableToast?: boolean;
    enableSound?: boolean;
}

export function useNotifications({ enableToast = true, enableSound = true }: UseNotificationsOptions = {}) {
    const { socket } = useSocket();
    const { isAuthenticated, user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [soundRules, setSoundRules] = useState<NotificationSoundRule[]>([]);
    const [soundLibrary, setSoundLibrary] = useState<NotificationSound[]>([]);
    const lastPlayedRef = useRef<Record<string, number>>({});
    const audience = user?.role === 'admin' ? 'admin' : user?.role === 'team' ? 'team' : 'user';

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setIsLoading(true);
            const res = await notificationsApi.getAll();
            setNotifications(res.data.data.notifications || []);
            setUnreadCount(res.data.data.unreadCount || 0);
        } catch {
            // Silent fail while auth state is still settling.
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchSoundConfig = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await notificationSoundsApi.getMyConfig();
            setSoundLibrary(res.data.data.sounds || []);
            setSoundRules(res.data.data.rules || []);
        } catch {
            setSoundLibrary([]);
            setSoundRules([]);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchNotifications();
        fetchSoundConfig();
    }, [fetchNotifications, fetchSoundConfig]);

    const playNotificationSound = useCallback((notif: AppNotification) => {
        if (!enableSound || typeof window === 'undefined') return;

        const matchedRule = soundRules.find((rule) => {
            const sound = typeof rule.soundId === 'string'
                ? soundLibrary.find((item) => item._id === rule.soundId)
                : rule.soundId;

            return (
                rule.isEnabled &&
                (rule.audience === audience || (audience === 'user' && rule.audience === 'public')) &&
                rule.notificationType === notif.type &&
                sound &&
                sound.isActive
            );
        });

        if (!matchedRule) return;

        const sound = typeof matchedRule.soundId === 'string'
            ? soundLibrary.find((item) => item._id === matchedRule.soundId)
            : matchedRule.soundId;

        if (!sound?.fileUrl) return;

        const cooldownKey = `${matchedRule.audience}:${matchedRule.notificationType}`;
        const now = Date.now();
        const lastPlayedAt = lastPlayedRef.current[cooldownKey] ?? 0;
        if (now - lastPlayedAt < matchedRule.cooldownMs) return;

        const audio = new Audio(sound.fileUrl);
        audio.volume = Math.max(0, Math.min(1, matchedRule.volume ?? 0.85));
        audio.play().catch(() => {});
        lastPlayedRef.current[cooldownKey] = now;
    }, [audience, enableSound, soundLibrary, soundRules]);

    useEffect(() => {
        if (!socket) return;

        const onNew = (notif: AppNotification) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((c) => c + 1);
            playNotificationSound(notif);

            if (enableToast) {
                const toastFn = getToastFn(notif.type);
                toastFn(notif.title, { description: notif.message });
            }
        };

        const onUnreadCount = ({ count }: { count: number }) => {
            setUnreadCount(count);
            fetchNotifications();
        };

        socket.on('notification:new', onNew);
        socket.on('notification:unread_count', onUnreadCount);

        return () => {
            socket.off('notification:new', onNew);
            socket.off('notification:unread_count', onUnreadCount);
        };
    }, [socket, enableToast, playNotificationSound, fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
            socket?.emit('notification:mark_read', { notificationId: id });
        } catch {
            toast.error('Failed to mark notification as read');
        }
    }, [socket]);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            socket?.emit('notification:mark_all_read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    }, [socket]);

    const deleteNotification = useCallback(async (id: string) => {
        const notif = notifications.find((n) => n._id === id);
        try {
            await notificationsApi.deleteOne(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (notif && !notif.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            toast.error('Failed to delete notification');
        }
    }, [notifications]);

    const clearAll = useCallback(async () => {
        try {
            await notificationsApi.clearAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            toast.error('Failed to clear notifications');
        }
    }, []);

    const chatUnreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead && (n.type === 'message' || n.type === 'file_received')).length,
        [notifications]
    );

    const ticketUnreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead && (
            n.type === 'ticket_submitted' || n.type === 'ticket_reply' || n.type === 'ticket_status_updated'
        )).length,
        [notifications]
    );

    const jobUnreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead && (
            n.type === 'application_received' || n.type === 'application_status_updated'
        )).length,
        [notifications]
    );

    return {
        notifications,
        unreadCount,
        chatUnreadCount,
        ticketUnreadCount,
        jobUnreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh: fetchNotifications,
        refreshSoundConfig: fetchSoundConfig,
        soundLibrary,
        soundRules,
    };
}

function getToastFn(type: string) {
    switch (type) {
        case 'project_accepted':
        case 'application_status_updated':
            return toast.success;
        case 'project_rejected':
            return toast.error;
        case 'ticket_submitted':
        case 'application_received':
        case 'user_registered':
        case 'project_submitted':
        case 'task_assigned':
        case 'project_assigned':
        case 'file_received':
        case 'resource_added':
        case 'live_chat_request':
            return toast.info;
        case 'ticket_reply':
        case 'ticket_status_updated':
        case 'status_updated':
            return toast.warning;
        case 'message':
        default:
            return toast.message;
    }
}
