import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Page, NotificationSettings as NotificationSettingsType, NotificationChannel } from '../types';
import api from '../services/backendApiService';
import { ArrowLeft, Save, BellOff, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Switch } from './ui/Switch';
import { Label } from './ui/Label';
import { Separator } from './ui/Separator';
import { toast } from './ui/Toaster';

const DEFAULT_DND = { enabled: false, startTime: '22:00', endTime: '08:00' };

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsType = {
  collaborationRequests: ['inApp'],
  collaborationUpdates: ['inApp'],
  commentsOnMyIdeas: ['inApp'],
  feedbackOnMyIdeas: ['inApp'],
  newConnections: ['inApp'],
  achievementUnlocks: ['inApp'],
  directMessages: ['inApp'],
  messageReactions: ['inApp'],
  doNotDisturb: DEFAULT_DND,
};

interface Props {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  setPage: (p: Page) => void;
}

const CATEGORIES: { key: keyof Omit<NotificationSettingsType, 'doNotDisturb'>; label: string; description: string }[] = [
  { key: 'collaborationRequests', label: 'Collaboration requests', description: 'When someone wants to join your idea.' },
  { key: 'collaborationUpdates', label: 'Collaboration updates', description: 'When your request is approved or recorded.' },
  { key: 'commentsOnMyIdeas', label: 'Comments on your ideas', description: 'New comments and replies on your posts.' },
  { key: 'feedbackOnMyIdeas', label: 'Feedback on your ideas', description: 'Reviews and ratings from the community.' },
  { key: 'newConnections', label: 'New connections', description: 'When another user connects with you.' },
  { key: 'achievementUnlocks', label: 'Achievements unlocked', description: 'Celebrate your wins.' },
  { key: 'directMessages', label: 'Direct messages', description: 'New 1-on-1 and group messages.' },
  { key: 'messageReactions', label: 'Message reactions', description: 'Reactions on your messages.' },
];

export const NotificationSettings: React.FC<Props> = ({ currentUser, setCurrentUser, setPage }) => {
  const [settings, setSettings] = useState<NotificationSettingsType>(
    () => currentUser.notificationSettings ?? { ...DEFAULT_NOTIFICATION_SETTINGS }
  );
  const [isSaving, setIsSaving] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  useEffect(() => {
    const userSettings = currentUser.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;
    if (JSON.stringify(settings) !== JSON.stringify(userSettings)) setSettings(userSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.notificationSettings]);

  const handleChannelChange = (
    category: keyof Omit<NotificationSettingsType, 'doNotDisturb'>,
    channel: NotificationChannel,
    checked: boolean
  ) => {
    setSettings((prev) => {
      const cur = prev[category] ?? [];
      const next = checked ? [...cur, channel] : cur.filter((c) => c !== channel);
      return { ...prev, [category]: next };
    });
  };

  const handleDnd = (key: keyof typeof DEFAULT_DND, value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      doNotDisturb: { ...(prev.doNotDisturb ?? DEFAULT_DND), [key]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateNotificationSettings(settings);
      if (updated) {
        if (isMounted.current) {
          setCurrentUser(updated);
          setSettings(updated.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS);
          toast.success('Settings saved');
        }
      } else throw new Error('No data returned');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save');
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  };

  const dndEnabled = settings.doNotDisturb?.enabled ?? false;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="container max-w-3xl flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setPage('notifications')} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Notification settings</h1>
          </div>
          <Button variant="gradient" leftIcon={<Save className="h-4 w-4" />} loading={isSaving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </header>

      <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="container max-w-3xl py-6 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Channel preferences</CardTitle>
            <CardDescription>Choose how you want to be notified for each event.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Event</span>
              <span className="text-center">In-app</span>
              <span className="text-center">Email</span>
            </div>
            {CATEGORIES.map(({ key, label, description }) => (
              <div key={key} className="py-4 grid sm:grid-cols-[1fr_80px_80px] gap-4 items-center">
                <div>
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex sm:justify-center items-center gap-2">
                  <span className="text-xs text-muted-foreground sm:hidden">In-app</span>
                  <Switch
                    checked={(settings[key] ?? []).includes('inApp')}
                    onCheckedChange={(c) => handleChannelChange(key, 'inApp', c)}
                  />
                </div>
                <div className="flex sm:justify-center items-center gap-2">
                  <span className="text-xs text-muted-foreground sm:hidden">Email</span>
                  <Switch
                    checked={(settings[key] ?? []).includes('email')}
                    onCheckedChange={(c) => handleChannelChange(key, 'email', c)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellOff className="h-4 w-4" /> Do not disturb</CardTitle>
            <CardDescription>Temporarily mute all notifications during specific hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable quiet hours</Label>
              <Switch checked={dndEnabled} onCheckedChange={(c) => handleDnd('enabled', c)} />
            </div>
            {dndEnabled && (
              <>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="start">Start</Label>
                    <input
                      id="start"
                      type="time"
                      value={settings.doNotDisturb?.startTime ?? DEFAULT_DND.startTime}
                      onChange={(e) => handleDnd('startTime', e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end">End</Label>
                    <input
                      id="end"
                      type="time"
                      value={settings.doNotDisturb?.endTime ?? DEFAULT_DND.endTime}
                      onChange={(e) => handleDnd('endTime', e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                    />
                  </div>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3 w-3" /> You'll still see notifications in the bell icon — only push/email is muted.
            </p>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
};
