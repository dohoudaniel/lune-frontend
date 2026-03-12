import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    
    useEffect(() => {
        setIsConnected(true);
    }, []);

    const subscribe = (table: string, callback: (update: RealtimeUpdate) => void) => {
        console.log(`Subscribed to ${table} via WebSocket (mock)`);
    };

    const unsubscribe = (table: string) => {
        console.log(`Unsubscribed from ${table}`);
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
