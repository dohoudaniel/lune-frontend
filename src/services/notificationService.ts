import { Notification, VerificationEvent } from '../types';
import { api } from '../lib/api';

let cachedNotifications: Notification[] = [];
let cachedVerificationEvents: VerificationEvent[] = [];
let defaultUserId: string | null = null;

export const initializeNotifications = async (userId: string) => {
    defaultUserId = userId;
    try {
        const data = await api.get(`/users/${userId}/preferences/`);
        if (data) {
            const prefs = data as any;
            if (prefs.notifications) {
                cachedNotifications = prefs.notifications;
                localStorage.setItem('lune_notifications', JSON.stringify(cachedNotifications));
            }
            if (prefs.verification_events) {
                cachedVerificationEvents = prefs.verification_events;
                localStorage.setItem('lune_verification_events', JSON.stringify(cachedVerificationEvents));
            }
        } else {
            // Fallback load
            const storedNotifs = localStorage.getItem('lune_notifications');
            if (storedNotifs) cachedNotifications = JSON.parse(storedNotifs);

            const storedEvents = localStorage.getItem('lune_verification_events');
            if (storedEvents) cachedVerificationEvents = JSON.parse(storedEvents);
        }
    } catch (err) {
        console.error('Failed to init notifications:', err);
    }
};

const syncToSupabaseAsync = async (section: 'notifications' | 'verification_events', payload: any) => {
    if (!defaultUserId) return;
    try {
        const data = await api.get(`/users/${defaultUserId}/preferences/`);
        const prefs = data || {};
        (prefs as any)[section] = payload;
        await api.put(`/users/${defaultUserId}/preferences/`, prefs);
    } catch (e) {
        console.error('Failed to sync notifications', e);
    }
};

class NotificationService {
    private storageKey = 'lune_notifications';
    private eventsKey = 'lune_verification_events';

    // Get all notifications for a user
    getNotifications(userId: string): Notification[] {
        const all = this.getAllNotifications();
        return all.filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Create a new notification
    createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
        const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            createdAt: new Date().toISOString()
        };

        const existing = this.getAllNotifications();
        existing.push(newNotification);
        cachedNotifications = existing;
        localStorage.setItem(this.storageKey, JSON.stringify(existing));
        syncToSupabaseAsync('notifications', existing);

        return newNotification;
    }

    // Record a certificate verification event
    recordVerificationEvent(event: Omit<VerificationEvent, 'id' | 'verifiedAt'>): void {
        const verificationEvent: VerificationEvent = {
            ...event,
            id: `verify_${Date.now()}`,
            verifiedAt: new Date().toISOString()
        };

        // Store verification event
        const events = this.getVerificationEvents();
        events.push(verificationEvent);
        cachedVerificationEvents = events;
        localStorage.setItem(this.eventsKey, JSON.stringify(events));
        syncToSupabaseAsync('verification_events', events);

        // Create notification for candidate
        this.createNotification({
            userId: event.candidateId,
            type: 'certificate_verified',
            title: 'Certificate Verified!',
            message: `${event.verifiedBy} verified your ${event.skill} certificate`,
            relatedData: {
                certificateHash: event.certificateHash,
                skill: event.skill,
                companyName: event.verifiedBy
            },
            read: false
        });
    }

    // Mark notification as read
    markAsRead(notificationId: string): void {
        const all = this.getAllNotifications();
        const index = all.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            all[index].read = true;
            cachedNotifications = all;
            localStorage.setItem(this.storageKey, JSON.stringify(all));
            syncToSupabaseAsync('notifications', all);
        }
    }

    // Mark all as read for a user
    markAllAsRead(userId: string): void {
        const all = this.getAllNotifications();
        all.forEach(n => {
            if (n.userId === userId) n.read = true;
        });
        cachedNotifications = all;
        localStorage.setItem(this.storageKey, JSON.stringify(all));
        syncToSupabaseAsync('notifications', all);
    }

    // Delete a notification
    deleteNotification(notificationId: string): void {
        const all = this.getAllNotifications();
        const filtered = all.filter(n => n.id !== notificationId);
        cachedNotifications = filtered;
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        syncToSupabaseAsync('notifications', filtered);
    }

    // Get unread count
    getUnreadCount(userId: string): number {
        return this.getNotifications(userId).filter(n => !n.read).length;
    }

    // Get verification events (for analytics)
    getVerificationEvents(): VerificationEvent[] {
        if (cachedVerificationEvents.length > 0) return cachedVerificationEvents;
        const stored = localStorage.getItem(this.eventsKey);
        return stored ? JSON.parse(stored) : [];
    }

    // Get verification events for a certificate
    getVerificationEventsForCertificate(certificateHash: string): VerificationEvent[] {
        return this.getVerificationEvents()
            .filter(e => e.certificateHash === certificateHash)
            .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
    }

    private getAllNotifications(): Notification[] {
        if (cachedNotifications.length > 0) return cachedNotifications;
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }
}

export const notificationService = new NotificationService();
