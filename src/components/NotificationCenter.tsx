import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, Settings as SettingsIcon, Filter } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Switch } from './ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Card, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Spinner } from './ui/Spinner';
import { Tooltip } from './ui/Tooltip';
import { toast } from './ui/Toaster';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Notification {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'normal' | 'low';
  is_read: boolean;
  created_at: string;
}

interface Preference {
  id: number;
  channel: string;
  category: string;
  enabled: boolean;
  frequency: string;
}

interface NotificationCenterProps {
  onClose?: () => void;
}

const PRIORITY_BADGE: Record<string, { variant: 'destructive' | 'warning' | 'soft'; label: string }> = {
  high: { variant: 'destructive', label: 'High' },
  normal: { variant: 'soft', label: 'Normal' },
  low: { variant: 'warning', label: 'Low' },
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Promise.all([
      api.getUnreadNotifications().then(setNotifications).catch(() => {}),
      api.getNotificationPreferences().then(setPreferences).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((p) => p.filter((n) => n.id !== id));
    } catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await (api as any).markAllNotificationsAsRead?.();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch { toast.error('Failed to mark all read'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id);
      setNotifications((p) => p.filter((n) => n.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePreference = async (p: Preference, enabled: boolean) => {
    try {
      await api.updateNotificationPreference(p.channel, p.category, enabled, p.frequency);
      setPreferences((prev) => prev.map((x) => x.id === p.id ? { ...x, enabled } : x));
    } catch { toast.error('Failed to update preference'); }
  };

  const categories = Array.from(new Set(notifications.map((n) => n.category)));
  const filtered = selectedCategory === 'all' ? notifications : notifications.filter((n) => n.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b border-border sticky top-0 z-30">
        <div className="container max-w-4xl flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notification Center
          </h1>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="container max-w-4xl py-6 px-4">
        <Tabs defaultValue="notifications">
          <TabsList variant="underline" className="mb-5">
            <TabsTrigger variant="underline" value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /> Notifications
              {notifications.length > 0 && <Badge variant="default" size="sm">{notifications.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger variant="underline" value="preferences" className="gap-2">
              <SettingsIcon className="h-4 w-4" /> Preferences
            </TabsTrigger>
          </TabsList>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-4 mt-0">
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Filter className="inline h-3 w-3 mr-1" /> All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={cn(
                      'shrink-0 capitalize px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      selectedCategory === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : filtered.length > 0 ? (
              <ul className="space-y-2">
                {filtered.map((n) => {
                  const priority = PRIORITY_BADGE[n.priority] ?? PRIORITY_BADGE.normal;
                  return (
                    <motion.li
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <Card className={cn(!n.is_read && 'border-primary/40')}>
                        <CardContent className="p-4 flex gap-3 items-start">
                          {!n.is_read && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{n.title}</h3>
                              <Badge variant={priority.variant} size="sm">{priority.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="capitalize">{n.category}</span>
                              <span>·</span>
                              <span>{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!n.is_read && (
                              <Tooltip content="Mark as read">
                                <Button variant="ghost" size="icon-sm" onClick={() => handleMarkAsRead(n.id)}>
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content="Delete">
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(n.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<Bell className="h-8 w-8" />}
                title="You're all caught up"
                description="No new notifications. We'll let you know when something happens."
              />
            )}
          </TabsContent>

          {/* PREFERENCES */}
          <TabsContent value="preferences" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : preferences.length > 0 ? (
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {preferences.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm capitalize">{p.category}</p>
                        <p className="text-xs text-muted-foreground capitalize">via {p.channel} · {p.frequency}</p>
                      </div>
                      <Switch
                        checked={p.enabled}
                        onCheckedChange={(c) => handleTogglePreference(p, c)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={<SettingsIcon className="h-8 w-8" />}
                title="No preferences yet"
                description="Default notification settings apply."
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.main>
    </div>
  );
};

export default NotificationCenter;
