import React, { useState } from 'react';
import { User, Page, ThemeMode } from '../types';
import {
  ArrowLeft, User as UserIcon, Bell, Lock, Palette, Shield, Plug, Trash2,
  Moon, Sun, Monitor, Mail, Globe, Check, AlertTriangle, KeyRound
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Switch } from './ui/Switch';
import { Avatar } from './ui/Avatar';
import { Separator } from './ui/Separator';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { useTheme } from '../hooks/useTheme';
import { userName } from '../utils/format';
import api from '../services/backendApiService';
import { cn } from '../utils/cn';
import { celebrate, playSound, getEffectsPrefs, setEffectsPrefs } from '../utils/effects';
import { TwoFactorSetup } from './TwoFactorSetup';
import { LinkedInImportModal } from './LinkedInImportModal';
import { DataExportModal } from './DataExportModal';
import { AccountDeletionFlow } from './AccountDeletionFlow';
import { Briefcase as BriefcaseIcon } from 'lucide-react';
import { useA11y } from '../hooks/useA11y';

interface SettingsProps {
  currentUser: User;
  setCurrentUser: (u: User | null) => void;
  setPage: (p: Page, id?: string) => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, setCurrentUser, setPage, onLogout }) => {
  const { mode, setThemeMode } = useTheme();
  const [saving, setSaving] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { prefs: a11yPrefs, setPrefs: setA11yPrefs } = useA11y();
  const [profile, setProfile] = useState({
    displayName: currentUser.displayName ?? currentUser.name ?? '',
    bio: currentUser.bio ?? '',
    location: currentUser.location ?? '',
    headline: currentUser.headline ?? '',
    websiteUrl: currentUser.websiteUrl ?? '',
    linkedInUrl: currentUser.linkedInUrl ?? '',
    twitterUrl: currentUser.twitterUrl ?? '',
    githubUrl: currentUser.githubUrl ?? '',
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateUser(profile);
      setCurrentUser({ ...currentUser, ...updated });
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => setShowDelete(true);

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border bg-card/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => setPage('feed')} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-8">
        <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col lg:flex-row gap-8">
          <TabsList variant="pills" className="flex-row lg:flex-col h-auto justify-start lg:w-56 shrink-0 overflow-x-auto lg:overflow-visible">
            <TabsTrigger variant="pills" value="profile" className="justify-start gap-2 lg:w-full">
              <UserIcon className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger variant="pills" value="appearance" className="justify-start gap-2 lg:w-full">
              <Palette className="h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger variant="pills" value="notifications" className="justify-start gap-2 lg:w-full">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger variant="pills" value="privacy" className="justify-start gap-2 lg:w-full">
              <Lock className="h-4 w-4" /> Privacy
            </TabsTrigger>
            <TabsTrigger variant="pills" value="security" className="justify-start gap-2 lg:w-full">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger variant="pills" value="integrations" className="justify-start gap-2 lg:w-full">
              <Plug className="h-4 w-4" /> Integrations
            </TabsTrigger>
            <TabsTrigger variant="pills" value="danger" className="justify-start gap-2 lg:w-full text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:border-destructive">
              <Trash2 className="h-4 w-4" /> Danger zone
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0 space-y-6">
            {/* PROFILE */}
            <TabsContent value="profile" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>How others see you across Synapse.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Avatar src={currentUser.avatarUrl} name={userName(currentUser)} size="xl" />
                    <div className="space-y-1">
                      <Button variant="outline" size="sm">Change photo</Button>
                      <p className="text-xs text-muted-foreground">PNG or JPG, max 5MB</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Display name" required>
                      <Input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
                    </Field>
                    <Field label="Headline" hint="Short tagline shown under your name">
                      <Input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Product designer, builder of things" />
                    </Field>
                    <Field label="Location">
                      <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} leftIcon={<Globe className="h-4 w-4" />} placeholder="San Francisco, CA" />
                    </Field>
                    <Field label="Website">
                      <Input value={profile.websiteUrl} onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })} placeholder="https://" />
                    </Field>
                  </div>
                  <Field label="Bio" hint={`${profile.bio.length}/240`}>
                    <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={240} rows={4} placeholder="Tell the community about yourself" />
                  </Field>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Social links</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input placeholder="LinkedIn URL" value={profile.linkedInUrl} onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })} />
                      <Input placeholder="Twitter / X URL" value={profile.twitterUrl} onChange={(e) => setProfile({ ...profile, twitterUrl: e.target.value })} />
                      <Input placeholder="GitHub URL" value={profile.githubUrl} onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" leftIcon={<BriefcaseIcon className="h-4 w-4" />} onClick={() => setShowLinkedIn(true)}>
                      Import from LinkedIn
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setPage('profile', currentUser.userId)}>View profile</Button>
                      <Button variant="gradient" loading={saving} onClick={handleSaveProfile}>Save changes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* APPEARANCE */}
            <TabsContent value="appearance" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how Synapse looks on this device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setThemeMode(opt.value); toast.success(`Theme set to ${opt.label}`); }}
                          className={cn(
                            'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                            mode === opt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary">
                            {opt.icon}
                          </div>
                          <span className="text-sm font-medium">{opt.label}</span>
                          {mode === opt.value && (
                            <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <EffectsToggleSection />
                  <Separator />
                  <div>
                    <Label>Accessibility</Label>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">High contrast</p>
                          <p className="text-xs text-muted-foreground">Stronger borders and text contrast</p>
                        </div>
                        <Switch checked={a11yPrefs.highContrast} onCheckedChange={(c) => setA11yPrefs({ ...a11yPrefs, highContrast: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">Reduce motion</p>
                          <p className="text-xs text-muted-foreground">Disable animations and transitions</p>
                        </div>
                        <Switch checked={a11yPrefs.reducedMotion} onCheckedChange={(c) => setA11yPrefs({ ...a11yPrefs, reducedMotion: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">Larger text</p>
                          <p className="text-xs text-muted-foreground">Bumps base font size to 18px</p>
                        </div>
                        <Switch checked={a11yPrefs.largeText} onCheckedChange={(c) => setA11yPrefs({ ...a11yPrefs, largeText: c })} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">Dyslexia-friendly font</p>
                          <p className="text-xs text-muted-foreground">Easier-to-read typeface with wider tracking</p>
                        </div>
                        <Switch checked={a11yPrefs.dyslexiaFont} onCheckedChange={(c) => setA11yPrefs({ ...a11yPrefs, dyslexiaFont: c })} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATIONS */}
            <TabsContent value="notifications" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose what you'd like to hear about.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {[
                    { id: 'collab', label: 'Collaboration requests', desc: 'When someone wants to join your idea' },
                    { id: 'comments', label: 'Comments on your ideas', desc: 'New comments and replies' },
                    { id: 'feedback', label: 'Feedback received', desc: 'When someone reviews your idea' },
                    { id: 'connections', label: 'New connections', desc: 'When someone connects with you' },
                    { id: 'messages', label: 'Direct messages', desc: 'Chat messages and reactions' },
                    { id: 'mentions', label: 'Mentions', desc: 'When someone @mentions you' },
                    { id: 'achievements', label: 'Achievements unlocked', desc: 'Celebrate your wins' },
                    { id: 'weekly', label: 'Weekly digest email', desc: 'Top ideas matching your interests' },
                  ].map((row) => (
                    <NotifRow key={row.id} {...row} />
                  ))}
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setPage('notificationSettings')}>Advanced channel settings →</Button>
              </div>
            </TabsContent>

            {/* PRIVACY */}
            <TabsContent value="privacy" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy</CardTitle>
                  <CardDescription>Control what others can see and do.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  <NotifRow id="discoverable" label="Show me in search" desc="Let people find your profile via search" defaultChecked />
                  <NotifRow id="public_ideas" label="Make new ideas public by default" desc="You can override per-idea" defaultChecked />
                  <NotifRow id="show_email" label="Show email on profile" desc="Connections only by default" />
                  <NotifRow id="allow_dms" label="Allow DMs from anyone" desc="Otherwise only connections can DM" defaultChecked />
                  <NotifRow id="show_activity" label="Show activity status" desc="Display when you're active" defaultChecked />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Data export</CardTitle>
                  <CardDescription>Download a copy of all your Synapse data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => setShowExport(true)}>Download my data</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY */}
            <TabsContent value="security" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email & Password</CardTitle>
                  <CardDescription>Manage how you sign in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Email">
                    <Input value={currentUser.email} disabled leftIcon={<Mail className="h-4 w-4" />} />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="outline" leftIcon={<KeyRound className="h-4 w-4" />}>Change password</Button>
                    <Button variant="ghost">Resend verification</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Two-factor authentication
                    <Badge variant="soft" size="sm">Recommended</Badge>
                  </CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="gradient" onClick={() => setShow2FA(true)}>Enable 2FA</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active sessions</CardTitle>
                  <CardDescription>Devices currently signed in to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                    <div>
                      <p className="text-sm font-medium">This device</p>
                      <p className="text-xs text-muted-foreground">{navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INTEGRATIONS */}
            <TabsContent value="integrations" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect Synapse with the tools you already use.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3">
                  {[
                    { name: 'GitHub', desc: 'Link repositories to ideas', emoji: '🐙' },
                    { name: 'Slack', desc: 'Get notifications in Slack', emoji: '💬' },
                    { name: 'Discord', desc: 'Discussion forum sync', emoji: '🎮' },
                    { name: 'Calendar', desc: 'Schedule collab calls', emoji: '📅' },
                    { name: 'Notion', desc: 'Export ideas to Notion', emoji: '📝' },
                    { name: 'Linear', desc: 'Sync Kanban with Linear', emoji: '📊' },
                  ].map((int) => (
                    <div key={int.name} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{int.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{int.name}</p>
                          <p className="text-xs text-muted-foreground">{int.desc}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DANGER */}
            <TabsContent value="danger" className="mt-0 space-y-6">
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Danger zone
                  </CardTitle>
                  <CardDescription>Irreversible and destructive actions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium">Deactivate account</p>
                      <p className="text-sm text-muted-foreground">Temporarily hide your profile and content.</p>
                    </div>
                    <Button variant="outline">Deactivate</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium">Delete account</p>
                      <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>Delete account</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Sign out</p>
                      <p className="text-sm text-muted-foreground">End this session.</p>
                    </div>
                    <Button variant="outline" onClick={onLogout}>Sign out</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <TwoFactorSetup open={show2FA} onOpenChange={setShow2FA} user={{ email: currentUser.email, displayName: currentUser.displayName, username: currentUser.username }} />

      <LinkedInImportModal
        open={showLinkedIn}
        onOpenChange={setShowLinkedIn}
        onApply={(data) => {
          setProfile((p) => ({
            ...p,
            headline: data.headline ?? p.headline,
            bio: data.bio ?? p.bio,
            location: data.location ?? p.location,
          }));
        }}
      />

      <DataExportModal open={showExport} onOpenChange={setShowExport} user={currentUser} />

      <AccountDeletionFlow
        open={showDelete}
        onOpenChange={setShowDelete}
        user={currentUser}
        onConfirm={() => { onLogout(); }}
      />
    </div>
  );
};

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label required={required}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function NotifRow({ id, label, desc, defaultChecked }: { id: string; label: string; desc: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="space-y-0.5 pr-4">
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

function EffectsToggleSection() {
  const [confettiOn, setConfettiOn] = useState(() => getEffectsPrefs().confetti);
  const [soundsOn, setSoundsOn] = useState(() => getEffectsPrefs().sounds);

  return (
    <div>
      <Label>Effects</Label>
      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium">Confetti celebrations 🎉</p>
            <p className="text-xs text-muted-foreground">Burst on level-ups, first idea, and achievements</p>
          </div>
          <Switch checked={confettiOn} onCheckedChange={(c) => { setConfettiOn(c); setEffectsPrefs({ confetti: c }); if (c) celebrate('small'); }} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium">Sound effects 🔊</p>
            <p className="text-xs text-muted-foreground">Subtle chimes on clicks, messages, and milestones</p>
          </div>
          <Switch checked={soundsOn} onCheckedChange={(c) => { setSoundsOn(c); setEffectsPrefs({ sounds: c }); if (c) playSound('click'); }} />
        </div>
      </div>
    </div>
  );
}
