import React, { useState, useEffect } from 'react';
import { Notification, Page } from '../types';
import api from '../services/backendApiService';
import { BellIcon } from './icons';

interface NotificationBellProps {
    setPage: (page: Page, id?: string) => void; // Allow optional ID
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ setPage }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await api.getNotificationsByUserId();
                // Sort by date descending, ensure createdAt exists
                setNotifications((data || []).sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                ));
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000);
        return () => clearInterval(intervalId);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1A1A24]" />
                )}
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg bg-white/80 dark:bg-[#1A1A24]/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 focus:outline-none z-50">
                    <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-900 dark:text-white font-semibold border-b border-gray-200 dark:border-white/10">Notifications</div>
                        <div className="max-h-60 overflow-y-auto scrollbar-thin">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 5).map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            // --- FIX: Check if link exists before navigating ---
                                            if (notification.link) {
                                                setPage(notification.link.page, notification.link.id); // Pass ID
                                            } else {
                                                console.warn("Notification link missing:", notification);
                                                setPage('notifications'); // Fallback: go to notifications page
                                            }
                                            // TODO: Add API call here to mark this specific notification as read
                                            setIsOpen(false);
                                        }}
                                        className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 cursor-pointer"
                                    >
                                        <p className={`${!notification.read ? 'font-bold text-gray-900 dark:text-white' : ''}`}>{notification.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                            )}
                        </div>
                         <div className="px-4 py-2 border-t border-gray-200 dark:border-white/10">
                            <button onClick={() => { setPage('notifications'); setIsOpen(false); }} className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                                View All Notifications
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};