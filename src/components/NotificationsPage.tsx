import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Notification, NotificationType, Page } from '../types';
import api from '../services/backendApiService';
import {
  Bell, CheckCheck, Settings as SettingsIcon, UserPlus, Users, MessageSquare,
  Star, Trophy, AlertTriangle, ShieldCheck, Rocket, Inbox,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { SkeletonCard } from './ui/Skeleton';
import { Tooltip } from './ui/Tooltip';
import { toast } from './ui/Toaster';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface NotificationsPageProps {
  setPage: (page: Page, id?: string) => void;
}

const NOTIFICATION_CATEGORIES: Record<string, NotificationType[]> = {
  all: [],
  collaborations: ['COLLABORATION_REQUEST', 'COLLABORATION_APPROVED', 'COLLABORATION_RECORDED'],
  feedback: ['NEW_COMMENT', 'NEW_FEEDBACK'],
  community: ['NEW_CONNECTION', 'ACHIEVEMENT_UNLOCKED', 'CONTENT_REPORTED_OWNER', 'CONTENT_REPORTED_REPORTER', 'IDEA_TIMESTAMPED', 'NEW_MESSAGE', 'MESSAGE_REQUEST', 'MILESTONE_COMPLETED'],
};

const NOTIFICATION_ICON: Record<NotificationType, { Icon: React.ElementType; color: string }> = {
  COLLABORATION_REQUEST: { Icon: UserPlus, color: 'from-indigo-500 to-violet-500' },
  COLLABORATION_APPROVED: { Icon: Users, color: 'from-emerald-500 to-teal-500' },
  COLLABORATION_RECORDED: { Icon: ShieldCheck, color: 'from-sky-500 to-blue-500' },
  NEW_COMMENT: { Icon: MessageSquare, color: 'from-amber-500 to-orange-500' },
  NEW_FEEDBACK: { Icon: Star, color: 'from-yellow-500 to-amber-500' },
  NEW_CONNECTION: { Icon: Users, color: 'from-rose-500 to-pink-500' },
  ACHIEVEMENT_UNLOCKED: { Icon: Trophy, color: 'from-amber-400 to-orange-500' },
  CONTENT_REPORTED_OWNER: { Icon: AlertTriangle, color: 'from-red-500 to-rose-500' },
  CONTENT_REPORTED_REPORTER: { Icon: AlertTriangle, color: 'from-red-500 to-rose-500' },
  IDEA_TIMESTAMPED: { Icon: ShieldCheck, color: 'from-sky-500 to-blue-500' },
  NEW_MESSAGE: { Icon: MessageSquare, color: 'from-violet-500 to-fuchsia-500' },
  MESSAGE_REQUEST: { Icon: MessageSquare, color: 'from-violet-500 to-fuchsia-500' },
  MILESTONE_COMPLETED: { Icon: Rocket, color: 'from-emerald-500 to-cyan-500' },
};

const NotificationItem: React.FC<{ notification: Notification; setPage: (page: Page, id?: string) => void }> = ({ notification, setPage }) => {
  const meta = NOTIFICATION_ICON[notification.type] || { Icon: Bell, color: 'from-gray-500 to-gray-600' };
  const Icon = meta.Icon;
  const isUnread = !notification.read && !notification.is_read;

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        if (notification.link) setPage(notification.link.page, notification.link.id);
      }}
      className={cn(
        'flex items-start gap-3 p-4 cursor-pointer transition-colors',
        'hover:bg-secondary/50',
        isUnread && 'bg-primary/5'
      )}
    >
      <div className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shrink-0 shadow-sm',
        meta.color
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-foreground' : 'text-foreground/85')}>
          {notification.message || notification.content}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notification.createdAt || notification.created_at)}</p>
      </div>
      {isUnread && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />}
    </motion.li>
  );
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ setPage }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getNotificationsByUserId();
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error(error?.message ?? 'Could not load notifications');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  const handleMarkAllRead = async () => {
    try {
      await (api as any).markAllNotificationsAsRead?.();
      setNotifications((p) => p.map((n) => ({ ...n, read: true, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to mark as read');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => NOTIFICATION_CATEGORIES[activeTab]?.includes(n.type));
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read && !n.is_read).length, [notifications]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
            <Tooltip content="Notification settings">
              <Button variant="ghost" size="icon-sm" onClick={() => setPage('notificationSettings')}>
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="underline" className="mb-4">
            {Object.keys(NOTIFICATION_CATEGORIES).map((tab) => (
              <TabsTrigger key={tab} variant="underline" value={tab} className="capitalize gap-2">
                {tab}
                {tab !== 'all' && (() => {
                  const count = notifications.filter((n) => NOTIFICATION_CATEGORIES[tab].includes(n.type)).length;
                  return count > 0 ? <Badge variant="ghost" size="sm">{count}</Badge> : null;
                })()}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(NOTIFICATION_CATEGORIES).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="surface overflow-hidden">
                {isLoading ? (
                  <div className="p-3 space-y-3">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {filteredNotifications.map((n) => (
                      <NotificationItem key={n.id} notification={n} setPage={setPage} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<Inbox className="h-8 w-8" />}
                    title="Nothing here yet"
                    description={tab === 'all' ? "You're all caught up." : `No ${tab} notifications.`}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </motion.div>
  );
};
