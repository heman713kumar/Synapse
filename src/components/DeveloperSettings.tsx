import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Webhook, Copy, Check, Plus, Trash2, Code2, BookOpen, ExternalLink } from 'lucide-react';
import { Page } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Switch } from './ui/Switch';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { timeAgo } from '../utils/format';

interface Props {
  setPage: (page: Page) => void;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string | null;
  scopes: string[];
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created: string;
}

function genKey() {
  return `sk_live_${Array.from({ length: 32 }, () => Math.random().toString(36).slice(2, 3)).join('')}`;
}

const EVENTS = ['idea.created', 'idea.updated', 'comment.created', 'collab.requested', 'collab.approved', 'message.sent', 'achievement.unlocked'];

export const DeveloperSettings: React.FC<Props> = ({ setPage }) => {
  const [keys, setKeys] = useLocalStorage<ApiKey[]>('synapse-api-keys', []);
  const [hooks, setHooks] = useLocalStorage<WebhookEndpoint[]>('synapse-webhooks', []);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newHookUrl, setNewHookUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createKey = () => {
    if (!newKeyName.trim()) { toast.error('Name your key'); return; }
    const full = genKey();
    const k: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: full.slice(0, 12),
      created: new Date().toISOString(),
      lastUsed: null,
      scopes: ['ideas:read', 'profile:read'],
    };
    setKeys((p) => [k, ...p]);
    setNewKey(full);
    setNewKeyName('');
    toast.success('Key created — copy it now, you won\'t see it again');
  };

  const createHook = () => {
    if (!/^https?:\/\//.test(newHookUrl)) { toast.error('Must be a valid URL'); return; }
    const w: WebhookEndpoint = {
      id: `wh_${Date.now()}`,
      url: newHookUrl.trim(),
      events: ['idea.created', 'comment.created'],
      enabled: true,
      created: new Date().toISOString(),
    };
    setHooks((p) => [w, ...p]);
    setNewHookUrl('');
    toast.success('Webhook added');
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-4xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('settings')} className="mb-4">Back to settings</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Developer</h1>
            <Badge variant="gradient" size="sm">Pro</Badge>
          </div>
          <p className="text-sm text-muted-foreground">API keys, webhooks, and integrations to build on Synapse.</p>
        </header>

        <Tabs defaultValue="keys">
          <TabsList variant="underline" className="mb-5">
            <TabsTrigger variant="underline" value="keys" className="gap-2"><Key className="h-4 w-4" /> API keys</TabsTrigger>
            <TabsTrigger variant="underline" value="webhooks" className="gap-2"><Webhook className="h-4 w-4" /> Webhooks</TabsTrigger>
            <TabsTrigger variant="underline" value="docs" className="gap-2"><BookOpen className="h-4 w-4" /> Docs</TabsTrigger>
          </TabsList>

          {/* KEYS */}
          <TabsContent value="keys" className="space-y-5 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Create a new API key</CardTitle>
                <CardDescription>Keys give programs access on your behalf. Treat them like passwords.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="My production server" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                  <Button variant="gradient" onClick={createKey} leftIcon={<Plus className="h-4 w-4" />}>Generate</Button>
                </div>

                {newKey && (
                  <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
                    <p className="text-xs font-semibold text-warning mb-1">⚠ Copy this key now — it's only shown once</p>
                    <div className="flex gap-2">
                      <Input readOnly value={newKey} className="font-mono text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />
                      <Button variant="outline" size="icon" onClick={() => copy(newKey, 'newkey')}>
                        {copiedId === 'newkey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKey(null)}>Dismiss</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active keys</CardTitle>
                <CardDescription>{keys.length} key{keys.length === 1 ? '' : 's'}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {keys.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">No keys yet.</p>
                )}
                {keys.map((k) => (
                  <div key={k.id} className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center">
                      <Key className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{k.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{k.prefix}••••••</p>
                      <p className="text-[10px] text-muted-foreground">Created {timeAgo(k.created)} · {k.lastUsed ? `last used ${timeAgo(k.lastUsed)}` : 'never used'}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setKeys((p) => p.filter((x) => x.id !== k.id)); toast.success('Key revoked'); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEBHOOKS */}
          <TabsContent value="webhooks" className="space-y-5 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Add webhook endpoint</CardTitle>
                <CardDescription>Receive POSTs when events happen in your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="https://your-server.com/webhooks/synapse" value={newHookUrl} onChange={(e) => setNewHookUrl(e.target.value)} />
                  <Button variant="gradient" onClick={createHook} leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Synapse signs payloads with HMAC-SHA256 using your signing secret.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>{hooks.length} endpoint{hooks.length === 1 ? '' : 's'}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {hooks.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No endpoints yet.</p>}
                {hooks.map((w) => (
                  <div key={w.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm truncate">{w.url}</p>
                        <p className="text-[10px] text-muted-foreground">Created {timeAgo(w.created)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={w.enabled}
                          onCheckedChange={(c) => setHooks((p) => p.map((h) => h.id === w.id ? { ...h, enabled: c } : h))}
                        />
                        <Button variant="ghost" size="icon-sm" onClick={() => { setHooks((p) => p.filter((x) => x.id !== w.id)); toast.success('Webhook removed'); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {w.events.map((e) => <Badge key={e} variant="soft" size="sm">{e}</Badge>)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {EVENTS.map((e) => <Badge key={e} variant="ghost" size="sm">{e}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCS */}
          <TabsContent value="docs" className="space-y-5 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Quick start</CardTitle>
                <CardDescription>Make your first API call in under a minute.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary/50 rounded-lg p-4 text-xs font-mono overflow-x-auto"><code>{`# Get your most recent ideas
curl https://api.synapse.app/v1/ideas \\
  -H "Authorization: Bearer sk_live_..."

# Subscribe to webhook
curl -X POST https://api.synapse.app/v1/webhooks \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://your-app.com/synapse", "events": ["idea.created"] }'`}</code></pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SDKs &amp; integrations</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: 'Node.js SDK', icon: '📦', status: 'beta' },
                  { name: 'Python SDK', icon: '🐍', status: 'soon' },
                  { name: 'Zapier', icon: '⚡', status: 'beta' },
                  { name: 'Make.com', icon: '🔗', status: 'soon' },
                  { name: 'Slack bot', icon: '💬', status: 'beta' },
                  { name: 'GitHub action', icon: '🐙', status: 'soon' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="flex items-center gap-2 text-sm font-medium"><span className="text-xl">{s.icon}</span> {s.name}</span>
                    <Badge variant={s.status === 'beta' ? 'soft' : 'ghost'} size="sm">{s.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button variant="outline" rightIcon={<ExternalLink className="h-4 w-4" />} onClick={() => toast('Full docs at docs.synapse.app coming soon', { icon: '📚' })}>
              View full API reference
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
