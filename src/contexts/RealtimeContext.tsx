import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

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

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Map<string, any>>(new Map());
    const toast = useToast();

    useEffect(() => {
        // Single connection check on mount with a short timeout
        const checkConnection = async () => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
                clearTimeout(timeout);
                setIsConnected(!error);
            } catch {
                setIsConnected(false);
            }
        };

        checkConnection();
    }, []);

    const subscribe = (table: string, callback: (update: RealtimeUpdate) => void) => {
        // Don't subscribe if already subscribed
        if (subscriptions.has(table)) {

            return;
        }

        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table
                },
                (payload) => {
                    const update: RealtimeUpdate = {
                        type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                        table: table,
                        record: payload.new || payload.old
                    };
                    callback(update);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {

                } else if (status === 'CHANNEL_ERROR') {
                    toast.error(`Failed to subscribe to ${table} updates`);
                }
            });

        setSubscriptions((prev) => new Map(prev).set(table, channel));
    };

    const unsubscribe = (table: string) => {
        const channel = subscriptions.get(table);
        if (channel) {
            supabase.removeChannel(channel);
            setSubscriptions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(table);
                return newMap;
            });

        }
    };

    // Cleanup all subscriptions on unmount
    useEffect(() => {
        return () => {
            subscriptions.forEach((channel) => {
                supabase.removeChannel(channel);
            });
        };
    }, []);

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
