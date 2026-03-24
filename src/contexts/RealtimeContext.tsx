import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface RealtimeUpdate {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: any;
}

interface RealtimeContextType {
    subscribe: (table: string, callback: (update: RealtimeUpdate) => void) => void;
    unsubscribe: (table: string) => void;
    isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const subscribersRef = useRef<Map<string, (update: RealtimeUpdate) => void>>(new Map());
    const esRef = useRef<EventSource | null>(null);
    const lastEventIdRef = useRef<string>('');
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = () => {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const url = `${API_URL}/notifications/stream/${lastEventIdRef.current ? `?last_event_id=${encodeURIComponent(lastEventIdRef.current)}` : ''}`;

        // EventSource doesn't support custom headers, so we rely on cookies for auth
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        es.onopen = () => {
            setIsConnected(true);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') return;

                // Update last event id for reconnect
                if (data.record?.created_at) {
                    lastEventIdRef.current = data.record.created_at;
                }

                // Dispatch to all subscribers for the matching table
                const table = data.table || 'notifications';
                const callback = subscribersRef.current.get(table);
                if (callback) {
                    callback({
                        type: 'INSERT',
                        table,
                        record: data.record,
                    });
                }
            } catch {
                // Ignore parse errors (heartbeat comments come as blank data)
            }
        };

        es.onerror = () => {
            setIsConnected(false);
            es.close();
            esRef.current = null;
            // Auto-reconnect after 5 seconds
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = setTimeout(connect, 5000);
        };
    };

    useEffect(() => {
        // Only connect if there are any subscribers (lazy connection)
        return () => {
            esRef.current?.close();
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, []);

    const subscribe = (table: string, callback: (update: RealtimeUpdate) => void) => {
        subscribersRef.current.set(table, callback);
        // Connect on first subscription
        if (!esRef.current) {
            connect();
        }
    };

    const unsubscribe = (table: string) => {
        subscribersRef.current.delete(table);
        // Disconnect when no subscribers remain
        if (subscribersRef.current.size === 0 && esRef.current) {
            esRef.current.close();
            esRef.current = null;
            setIsConnected(false);
        }
    };

    return (
        <RealtimeContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
            {children}
        </RealtimeContext.Provider>
    );
};

export const useRealtime = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within RealtimeProvider');
    }
    return context;
};

export default RealtimeContext;
