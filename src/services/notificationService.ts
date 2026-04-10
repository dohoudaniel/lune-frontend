import { Notification, VerificationEvent } from "../types";
import { api } from "../lib/api";

// In-memory optimistic cache
let cachedNotifications: Notification[] = [];
let cachedVerificationEvents: VerificationEvent[] = [];
let defaultUserId: string | null = null;
let _initialized = false;

// SSE-related state
let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
let reconnectDelay = INITIAL_RECONNECT_DELAY;
let lastEventId: string | null = null;

// Listeners for cache updates (so UI can react to SSE changes)
type CacheListener = (notifications: Notification[]) => void;
const cacheListeners: Set<CacheListener> = new Set();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapBackendNotification(raw: any): Notification {
  return {
    id: raw.id,
    userId: defaultUserId || "",
    type: raw.notification_type as Notification["type"],
    title: raw.title,
    message: raw.message,
    relatedData: raw.related_data || {},
    read: raw.read,
    createdAt: raw.created_at,
  };
}

function notifyCacheListeners() {
  cacheListeners.forEach((listener) => listener([...cachedNotifications]));
}

// ---------------------------------------------------------------------------
// SSE Connection Management
// ---------------------------------------------------------------------------

function connectSSE() {
  if (eventSource) {
    eventSource.close();
  }

  try {
    const url = lastEventId
      ? `/api/notifications/stream/?last_event_id=${encodeURIComponent(lastEventId)}`
      : "/api/notifications/stream/";

    eventSource = new EventSource(url);

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          // Connection established successfully
          reconnectAttempts = 0;
          reconnectDelay = INITIAL_RECONNECT_DELAY;
          console.log("[Notifications] SSE connected");
        } else if (data.type === "notification") {
          // New notification arrived
          const mapped = mapBackendNotification(data.record);
          const exists = cachedNotifications.some((n) => n.id === mapped.id);
          if (!exists) {
            cachedNotifications.unshift(mapped);
            lastEventId = mapped.createdAt;
            notifyCacheListeners();
          }
        }
        // Ignore heartbeat comments (lines starting with ':')
      } catch (err) {
        console.error("[Notifications] Failed to parse SSE message:", err);
      }
    });

    eventSource.addEventListener("error", (event) => {
      console.error("[Notifications] SSE error:", event);
      eventSource?.close();
      eventSource = null;
      scheduleReconnect();
    });
  } catch (err) {
    console.error("[Notifications] Failed to create EventSource:", err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn(
      "[Notifications] Max reconnect attempts reached. Will retry on next poll.",
    );
    return;
  }

  reconnectAttempts++;
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
  const jitter = Math.random() * 1000; // Random jitter up to 1s
  const delay = reconnectDelay + jitter;

  console.log(
    `[Notifications] Reconnecting in ${Math.round(delay)}ms ` +
      `(attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  setTimeout(() => {
    connectSSE();
  }, delay);
}

export const disconnectSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  reconnectAttempts = 0;
  reconnectDelay = INITIAL_RECONNECT_DELAY;
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export const initializeNotifications = async (userId: string) => {
  defaultUserId = userId;
  try {
    // Load initial notifications from REST endpoint
    const data = (await api.get("/notifications/?page_size=50")) as any;
    if (data?.results) {
      cachedNotifications = (data.results as any[]).map(mapBackendNotification);
      if (cachedNotifications.length > 0) {
        // Use the most recent notification's timestamp as last_event_id for SSE
        const mostRecent = cachedNotifications[0];
        lastEventId = mostRecent.createdAt;
      }
    }

    // Load verification events from localStorage
    const storedEvents = localStorage.getItem("lune_verification_events");
    if (storedEvents) {
      try {
        cachedVerificationEvents = JSON.parse(storedEvents);
      } catch {
        /**/
      }
    }

    _initialized = true;
    notifyCacheListeners();

    // Start SSE connection for real-time updates
    connectSSE();
  } catch (err) {
    console.error("Failed to init notifications:", err);
    _initialized = true;
  }
};

// ---------------------------------------------------------------------------
// Notification Service Class
// ---------------------------------------------------------------------------

class NotificationService {
  private eventsKey = "lune_verification_events";

  /**
   * Subscribe to cache changes (called when SSE delivers new notifications)
   * Returns unsubscribe function
   */
  onCacheChange(listener: CacheListener): () => void {
    cacheListeners.add(listener);
    return () => cacheListeners.delete(listener);
  }

  /**
   * Get all notifications (from cache)
   */
  getNotifications(userId: string): Notification[] {
    return cachedNotifications
      .slice() // Return a copy
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  /**
   * Fetch fresh from backend (fallback if SSE fails)
   */
  async fetchNotifications(unreadOnly = false): Promise<Notification[]> {
    try {
      const url = `/notifications/${unreadOnly ? "?unread_only=true" : ""}`;
      const data = (await api.get(url)) as any;
      if (data?.results) {
        const mapped = (data.results as any[]).map(mapBackendNotification);
        cachedNotifications = mapped;
        if (mapped.length > 0) {
          lastEventId = mapped[0].createdAt;
        }
        notifyCacheListeners();
        return mapped;
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
    return cachedNotifications;
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    return cachedNotifications.filter((n) => !n.read).length;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const idx = cachedNotifications.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      cachedNotifications[idx].read = true;
      notifyCacheListeners();
    }

    try {
      await api.patch(`/notifications/${notificationId}/`, { read: true });
    } catch (err) {
      if (idx !== -1) {
        cachedNotifications[idx].read = false;
        notifyCacheListeners();
      }
      console.error("Failed to mark notification as read:", err);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    cachedNotifications.forEach((n) => {
      n.read = true;
    });
    notifyCacheListeners();

    try {
      await api.post("/notifications/mark-all-read/", {});
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const prev = [...cachedNotifications];
    cachedNotifications = cachedNotifications.filter(
      (n) => n.id !== notificationId,
    );
    notifyCacheListeners();

    try {
      await (api as any).delete(`/notifications/${notificationId}/`);
    } catch (err) {
      cachedNotifications = prev;
      notifyCacheListeners();
      console.error("Failed to delete notification:", err);
    }
  }

  /**
   * Record a certificate verification event
   */
  recordVerificationEvent(
    event: Omit<VerificationEvent, "id" | "verifiedAt">,
  ): void {
    const verificationEvent: VerificationEvent = {
      ...event,
      id: `verify_${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };

    const events = this.getVerificationEvents();
    events.push(verificationEvent);
    cachedVerificationEvents = events;
    localStorage.setItem(this.eventsKey, JSON.stringify(events));

    // Push optimistic notification for immediate UI feedback
    const optimistic: Notification = {
      id: `local_${Date.now()}`,
      userId: defaultUserId || "",
      type: "certificate_verified",
      title: "Certificate Verified!",
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
    notifyCacheListeners();
  }

  /**
   * Get verification events for certificate
   */
  getVerificationEvents(): VerificationEvent[] {
    if (cachedVerificationEvents.length > 0) return cachedVerificationEvents;
    const stored = localStorage.getItem(this.eventsKey);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get verification events for specific certificate
   */
  getVerificationEventsForCertificate(
    certificateHash: string,
  ): VerificationEvent[] {
    return this.getVerificationEvents()
      .filter((e) => e.certificateHash === certificateHash)
      .sort(
        (a, b) =>
          new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime(),
      );
  }
}

export const notificationService = new NotificationService();
