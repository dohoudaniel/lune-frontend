import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, Award, Briefcase, Eye } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
    userId: string;
}

const POLLING_INTERVAL_MS = 30000;
const MAX_CONSECUTIVE_ERRORS = 3;

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [consecutiveErrors, setConsecutiveErrors] = useState(0);
    const [pollingPaused, setPollingPaused] = useState(false);

    const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadNotifications();
        startPolling();
        return () => stopPolling();
    }, [userId]);

    // Clean up pending-delete timer on unmount
    useEffect(() => {
        return () => {
            if (pendingDeleteTimerRef.current) {
                clearTimeout(pendingDeleteTimerRef.current);
            }
        };
    }, []);

    const startPolling = () => {
        stopPolling();
        intervalRef.current = setInterval(() => {
            if (!pollingPaused) {
                loadNotifications();
            }
        }, POLLING_INTERVAL_MS);
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const loadNotifications = () => {
        try {
            const notifs = notificationService.getNotifications(userId);
            setNotifications(notifs);
            setUnreadCount(notificationService.getUnreadCount(userId));
            setConsecutiveErrors(0);
        } catch {
            setConsecutiveErrors(prev => {
                const next = prev + 1;
                if (next >= MAX_CONSECUTIVE_ERRORS) {
                    setPollingPaused(true);
                    stopPolling();
                }
                return next;
            });
        }
    };

    const handleReconnect = () => {
        setPollingPaused(false);
        setConsecutiveErrors(0);
        loadNotifications();
        startPolling();
    };

    const handleMarkAsRead = (notificationId: string) => {
        notificationService.markAsRead(notificationId);
        loadNotifications();
    };

    const handleMarkAllAsRead = () => {
        notificationService.markAllAsRead(userId);
        loadNotifications();
    };

    const handleDelete = (notificationId: string) => {
        // Cancel any existing pending delete and commit it immediately before starting new one
        if (pendingDelete && pendingDelete !== notificationId) {
            if (pendingDeleteTimerRef.current) {
                clearTimeout(pendingDeleteTimerRef.current);
                pendingDeleteTimerRef.current = null;
            }
            notificationService.deleteNotification(pendingDelete);
            loadNotifications();
        }

        setPendingDelete(notificationId);

        pendingDeleteTimerRef.current = setTimeout(() => {
            notificationService.deleteNotification(notificationId);
            setPendingDelete(null);
            loadNotifications();
            pendingDeleteTimerRef.current = null;
        }, 5000);
    };

    const handleUndoDelete = () => {
        if (pendingDeleteTimerRef.current) {
            clearTimeout(pendingDeleteTimerRef.current);
            pendingDeleteTimerRef.current = null;
        }
        setPendingDelete(null);
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'certificate_verified':
                return <Award className="text-teal-600" size={20} />;
            case 'certificate_minted':
                return <CheckCircle className="text-green-600" size={20} />;
            case 'job_match':
                return <Briefcase className="text-blue-600" size={20} />;
            case 'profile_view':
                return <Eye className="text-purple-600" size={20} />;
            default:
                return <Bell className="text-gray-600" size={20} />;
        }
    };

    // Visually hide the notification that is pending deletion
    const visibleNotifications = notifications.filter(n => n.id !== pendingDelete);

    const headerSubtext = (() => {
        if (notifications.length === 0) return 'All caught up!';
        if (unreadCount > 0) return `${unreadCount} unread`;
        return 'All read — you\'re up to date.';
    })();

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
            >
                <Bell size={24} className="text-gray-700" />
                {unreadCount > 0 && (
                    <motion.span
                        aria-hidden="true"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-screen max-w-[calc(100vw-2rem)] sm:w-96 max-h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-900">Notifications</h3>
                                    <p className="text-xs text-gray-500">{headerSubtext}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {pollingPaused && (
                                        <button
                                            onClick={handleReconnect}
                                            className="text-xs text-red-500 font-semibold hover:underline"
                                        >
                                            Reconnect
                                        </button>
                                    )}
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-teal-600 font-semibold hover:underline"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto">
                                {visibleNotifications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bell className="mx-auto text-gray-300 mb-3" size={48} />
                                        <p className="text-gray-500 font-medium">No notifications yet</p>
                                        <p className="text-gray-400 text-sm">We'll notify you when something happens!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {visibleNotifications.map((notification) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-teal-50/30' : ''
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-semibold text-sm text-gray-900">
                                                                {notification.title}
                                                            </h4>
                                                            <button
                                                                aria-label="Delete notification"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(notification.id);
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="text-xs text-gray-400">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkAsRead(notification.id);
                                                                    }}
                                                                    className="text-xs text-teal-600 font-semibold hover:underline"
                                                                >
                                                                    Mark as read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Undo delete toast */}
                            <AnimatePresence>
                                {pendingDelete && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white text-sm"
                                    >
                                        <span>Notification deleted.</span>
                                        <button
                                            onClick={handleUndoDelete}
                                            className="ml-3 font-semibold text-teal-300 hover:text-teal-200 underline"
                                        >
                                            Undo
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
