import { Notification, VerificationEvent } from '../types';
import { api } from '../lib/api';

// In-memory optimistic cache — avoids re-fetching immediately after mutations
let cachedNotifications: Notification[] = [];
let cachedVerificationEvents: VerificationEvent[] = [];
let defaultUserId: string | null = null;
let _initialized = false;

// ---------------------------------------------------------------------------
// Map backend notification shape → frontend Notification type
// ---------------------------------------------------------------------------
function mapBackendNotification(raw: any): Notification {
    return {
        id: raw.id,
        userId: defaultUserId || '',
        type: raw.notification_type as Notification['type'],
        title: raw.title,
        message: raw.message,
        relatedData: raw.related_data || {},
        read: raw.read,
        createdAt: raw.created_at,
    };
}

export const initializeNotifications = async (userId: string) => {
    defaultUserId = userId;
    try {
        const data = await api.get('/notifications/?page_size=50') as any;
        if (data?.results) {
            cachedNotifications = (data.results as any[]).map(mapBackendNotification);
        }
        // Also try to load verification events from localStorage (still local-only for now)
        const storedEvents = localStorage.getItem('lune_verification_events');
        if (storedEvents) {
            try { cachedVerificationEvents = JSON.parse(storedEvents); } catch { /**/ }
        }
        _initialized = true;
    } catch (err) {
        console.error('Failed to init notifications:', err);
        // Fallback: keep whatever is in the cache (empty on first load)
        _initialized = true;
    }
};

class NotificationService {
    private eventsKey = 'lune_verification_events';

    // Get all notifications (from cache, refreshed by initializeNotifications)
    getNotifications(userId: string): Notification[] {
        return cachedNotifications
            .filter(n => !userId || n.userId === userId || true) // all belong to current user
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Fetch fresh from backend and refresh cache
    async fetchNotifications(unreadOnly = false): Promise<Notification[]> {
        try {
            const url = `/notifications/${unreadOnly ? '?unread_only=true' : ''}`;
            const data = await api.get(url) as any;
            if (data?.results) {
                const mapped = (data.results as any[]).map(mapBackendNotification);
                cachedNotifications = mapped;
                return mapped;
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
        return cachedNotifications;
    }

    // Get unread count (from cache)
    getUnreadCount(userId: string): number {
        return cachedNotifications.filter(n => !n.read).length;
    }

    // Mark a single notification as read
    async markAsRead(notificationId: string): Promise<void> {
        // Optimistic update
        const idx = cachedNotifications.findIndex(n => n.id === notificationId);
        if (idx !== -1) cachedNotifications[idx].read = true;

        try {
            await api.patch(`/notifications/${notificationId}/`, { read: true });
        } catch (err) {
            // Revert optimistic update on error
            if (idx !== -1) cachedNotifications[idx].read = false;
            console.error('Failed to mark notification as read:', err);
        }
    }

    // Mark all notifications as read
    async markAllAsRead(userId: string): Promise<void> {
        // Optimistic update
        cachedNotifications.forEach(n => { n.read = true; });

        try {
            await api.post('/notifications/mark-all-read/', {});
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    }

    // Delete a notification
    async deleteNotification(notificationId: string): Promise<void> {
        const prev = [...cachedNotifications];
        cachedNotifications = cachedNotifications.filter(n => n.id !== notificationId);

        try {
            await (api as any).delete(`/notifications/${notificationId}/`);
        } catch (err) {
            cachedNotifications = prev;
            console.error('Failed to delete notification:', err);
        }
    }

    // Record a certificate verification event (local-only until dedicated endpoint exists)
    recordVerificationEvent(event: Omit<VerificationEvent, 'id' | 'verifiedAt'>): void {
        const verificationEvent: VerificationEvent = {
            ...event,
            id: `verify_${Date.now()}`,
            verifiedAt: new Date().toISOString(),
        };

        const events = this.getVerificationEvents();
        events.push(verificationEvent);
        cachedVerificationEvents = events;
        localStorage.setItem(this.eventsKey, JSON.stringify(events));

        // The backend will create a notification asynchronously (job matching task / API).
        // For immediate UI feedback, push an optimistic notification to the cache.
        const optimistic: Notification = {
            id: `local_${Date.now()}`,
            userId: defaultUserId || '',
            type: 'certificate_verified',
            title: 'Certificate Verified!',
            message: `${event.verifiedBy} verified your ${event.skill} certificate`,
            relatedData: {
                certificateHash: event.certificateHash,
                skill: event.skill,
                companyName: event.verifiedBy,
            },
            read: false,
            createdAt: new Date().toISOString(),
        };
        cachedNotifications.unshift(optimistic);
    }

    getVerificationEvents(): VerificationEvent[] {
        if (cachedVerificationEvents.length > 0) return cachedVerificationEvents;
        const stored = localStorage.getItem(this.eventsKey);
        try { return stored ? JSON.parse(stored) : []; } catch { return []; }
    }

    getVerificationEventsForCertificate(certificateHash: string): VerificationEvent[] {
        return this.getVerificationEvents()
            .filter(e => e.certificateHash === certificateHash)
            .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
    }
}

export const notificationService = new NotificationService();
