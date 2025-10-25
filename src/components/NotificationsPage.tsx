import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Notification, NotificationType, Page } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import * as Icons from './icons';

interface NotificationsPageProps {
    // FIX: Removed userId, backend gets it from token
    setPage: (page: Page, id?: string) => void;
}

const NOTIFICATION_CATEGORIES: Record<string, NotificationType[]> = {
    all: [], // Special case
    collaborations: ['COLLABORATION_REQUEST', 'COLLABORATION_APPROVED', 'COLLABORATION_RECORDED'],
    feedback: ['NEW_COMMENT', 'NEW_FEEDBACK'],
    community: ['NEW_CONNECTION', 'ACHIEVEMENT_UNLOCKED', 'CONTENT_REPORTED_OWNER', 'CONTENT_REPORTED_REPORTER', 'IDEA_TIMESTAMPED', 'NEW_MESSAGE', 'MESSAGE_REQUEST', 'MILESTONE_COMPLETED'],
};

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
    COLLABORATION_REQUEST: Icons.UserPlusIcon,
    COLLABORATION_APPROVED: Icons.UsersIcon,
    COLLABORATION_RECORDED: Icons.ShieldCheckIcon,
    NEW_COMMENT: Icons.MessageSquareIcon,
    NEW_FEEDBACK: Icons.StarIcon,
    NEW_CONNECTION: Icons.UsersIcon,
    ACHIEVEMENT_UNLOCKED: Icons.TrophyIcon,
    CONTENT_REPORTED_OWNER: Icons.AlertTriangleIcon,
    CONTENT_REPORTED_REPORTER: Icons.AlertTriangleIcon,
    IDEA_TIMESTAMPED: Icons.ShieldCheckIcon,
    NEW_MESSAGE: Icons.MessageSquareIcon,
    MESSAGE_REQUEST: Icons.MessageSquareIcon,
    MILESTONE_COMPLETED: Icons.RocketIcon,
};

const NotificationItem: React.FC<{ notification: Notification; setPage: (page: Page, id: string) => void }> = ({ notification, setPage }) => {
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return 'just now';
    };

    const Icon = NOTIFICATION_ICONS[notification.type] || Icons.BellIcon;

    return (
        <li
            onClick={() => setPage(notification.link.page, notification.link.id)}
            className={`p-4 flex items-start space-x-4 cursor-pointer hover:bg-white/5 transition-colors duration-200 ${!notification.read ? 'bg-indigo-900/10' : ''}`}
        >
            <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${notification.read ? 'bg-gray-700' : 'bg-indigo-600'}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
                <p className={`text-sm ${notification.read ? 'text-gray-300' : 'text-white font-semibold'}`}>{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</p>
            </div>
            {!notification.read && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>}
        </li>
    );
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ setPage }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const fetchData = useCallback(async () => {
        try {
            // FIX: Removed userId. Backend gets this from token.
            const data = await api.getNotificationsByUserId();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            alert("Could not load notifications. Please try again later.");
        }
    }, []); // FIX: Dependency array is now empty

    useEffect(() => {
        setIsLoading(true);
        fetchData().finally(() => setIsLoading(false));
    }, [fetchData]);

    const handleMarkAllRead = async () => {
        try {
            // FIX: Removed userId. Backend gets this from token.
            await api.markAllNotificationsAsRead();
            fetchData(); // Refetch after marking all as read
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            alert("Could not mark notifications as read. Please try again.");
        }
    };
    
    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') {
            return notifications;
        }
        return notifications.filter(n => NOTIFICATION_CATEGORIES[activeTab].includes(n.type));
    }, [notifications, activeTab]);

    if (isLoading) {
        return <div className="text-center p-8">Loading notifications...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Notifications</h1>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleMarkAllRead} className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-white">
                            <Icons.CheckCircleIcon className="w-4 h-4"/>
                            <span>Mark all as read</span>
                        </button>
                         <button onClick={() => setPage('notificationSettings')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10">
                            <Icons.SettingsIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="border-b border-white/10 mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {Object.keys(NOTIFICATION_CATEGORIES).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`capitalize whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10">
                    <ul className="divide-y divide-white/10">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map(notification => (
                                <NotificationItem key={notification.id} notification={notification} setPage={setPage} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                You have no notifications in this category.
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};