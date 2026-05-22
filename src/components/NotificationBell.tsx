import React, { useState, useEffect } from 'react';
import { Notification, Page } from '../types';
import api from '../services/backendApiService';
import { Bell, CheckCheck } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/Popover';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { Badge } from './ui/Badge';
import { Separator } from './ui/Separator';
import { EmptyState } from './ui/EmptyState';
import { ScrollArea } from './ui/ScrollArea';
import { cn } from '../utils/cn';
import { timeAgo } from '../utils/format';

interface NotificationBellProps {
  setPage: (page: Page, id?: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ setPage }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    try {
      const data = await api.getNotificationsByUserId();
      setNotifications(
        (data || []).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      );
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetch();
    const intervalId = setInterval(fetch, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await (api as any).markAllNotificationsAsRead?.();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
    } catch {/* silent */}
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip content="Notifications">
        <PopoverTrigger asChild>
          <button
            className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-ring"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && <Badge variant="default" size="sm">{unreadCount} new</Badge>}
          </div>
          {unreadCount > 0 && (
            <Tooltip content="Mark all as read">
              <button
                onClick={handleMarkAllRead}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
        <Separator />

        <ScrollArea className="max-h-80">
          {notifications.length > 0 ? (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 6).map((n) => {
                const isUnread = !n.read && !n.is_read;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        if (n.link) setPage(n.link.page, n.link.id);
                        else setPage('notifications');
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-secondary/50 transition-colors',
                        isUnread && 'bg-primary/5'
                      )}
                    >
                      {isUnread && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />}
                      {!isUnread && <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm leading-snug', isUnread ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                          {n.message || n.content}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {timeAgo(n.createdAt || n.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="You're all caught up"
              description="No new notifications."
              size="sm"
              icon={<Bell className="h-6 w-6" />}
            />
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => { setPage('notifications'); setOpen(false); }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
