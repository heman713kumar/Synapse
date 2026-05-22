import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUp, MessageSquare, Map, Plus, Search } from 'lucide-react';
import { Page } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Textarea } from './ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Label } from './ui/Label';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compactNumber, timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Props { setPage: (page: Page) => void; }

type Status = 'idea' | 'planned' | 'in_progress' | 'shipped';

interface Item {
  id: string;
  title: string;
  description: string;
  status: Status;
  category: string;
  upvotes: number;
  comments: number;
  createdAt: string;
  author?: { name: string; avatar?: string };
}

const ITEMS: Item[] = [
  { id: 'r1', title: 'Real-time live cursors in DiscussionForum', description: 'See other members\' cursors moving in the forum, Figma-style.', status: 'planned', category: 'Forum', upvotes: 312, comments: 28, createdAt: daysAgo(3), author: { name: 'Lena J.' } },
  { id: 'r2', title: 'Voice messages in Chat', description: 'Record 60-sec voice memos right inside the conversation.', status: 'in_progress', category: 'Chat', upvotes: 287, comments: 19, createdAt: daysAgo(8) },
  { id: 'r3', title: 'iOS + Android apps via Capacitor', description: 'Wrap our PWA for the app stores. Push notifications included.', status: 'planned', category: 'Platform', upvotes: 421, comments: 54 ,createdAt: daysAgo(12), author: { name: 'Alex Y.' } },
  { id: 'r4', title: 'GitHub repo embeds in idea descriptions', description: 'Paste a GitHub URL → renders a rich repo card.', status: 'shipped', category: 'Editor', upvotes: 195, comments: 8, createdAt: daysAgo(20) },
  { id: 'r5', title: 'Auto-thread summary for long forums', description: 'AI TL;DR + action items for threads over 20 messages.', status: 'idea', category: 'AI', upvotes: 158, comments: 12, createdAt: daysAgo(2) },
  { id: 'r6', title: 'Slash commands in chat (/poll, /event)', description: 'Quick-insert polls, events, and embeds.', status: 'in_progress', category: 'Chat', upvotes: 89, comments: 6, createdAt: daysAgo(5), author: { name: 'Yusuf O.' } },
  { id: 'r7', title: 'Smart "next steps" nudges on stalled ideas', description: 'AI suggests what to do when an idea hasn\'t moved in 7+ days.', status: 'idea', category: 'AI', upvotes: 73, comments: 4, createdAt: daysAgo(1) },
  { id: 'r8', title: 'Public idea pages with OG meta + SSR', description: 'Beautiful preview cards on Twitter/LinkedIn when you share.', status: 'planned', category: 'Growth', upvotes: 245, comments: 18, createdAt: daysAgo(7) },
  { id: 'r9', title: 'Custom emoji reactions', description: 'Upload your own emoji for personalized reactions.', status: 'idea', category: 'Reactions', upvotes: 41, comments: 3, createdAt: daysAgo(4) },
];

function daysAgo(d: number) { return new Date(Date.now() - d * 86400_000).toISOString(); }

const STATUS_META: Record<Status, { label: string; color: string }> = {
  idea: { label: 'Under consideration', color: 'from-slate-400 to-slate-600' },
  planned: { label: 'Planned', color: 'from-amber-500 to-orange-500' },
  in_progress: { label: 'In progress', color: 'from-indigo-500 to-violet-500' },
  shipped: { label: 'Shipped', color: 'from-emerald-500 to-teal-500' },
};

export const Roadmap: React.FC<Props> = ({ setPage }) => {
  const [tab, setTab] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [voted, setVoted] = useLocalStorage<string[]>('synapse-roadmap-voted', []);
  const [showSuggest, setShowSuggest] = useState(false);

  const filtered = useMemo(() => {
    return ITEMS
      .filter((i) => tab === 'all' || i.status === tab)
      .filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (b.upvotes + (voted.includes(b.id) ? 1 : 0)) - (a.upvotes + (voted.includes(a.id) ? 1 : 0)));
  }, [tab, query, voted]);

  const toggleVote = (id: string) => {
    setVoted((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-4xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Map className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Roadmap</h1>
            </div>
            <p className="text-sm text-muted-foreground">Vote on what we ship next. Your votes directly shape our priorities.</p>
          </div>
          <Button variant="gradient" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowSuggest(true)}>
            Suggest a feature
          </Button>
        </header>

        <Input placeholder="Search ideas…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="mb-5" />

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="all">All ({ITEMS.length})</TabsTrigger>
            {(['idea', 'planned', 'in_progress', 'shipped'] as Status[]).map((s) => (
              <TabsTrigger key={s} variant="pills" value={s}>
                {STATUS_META[s].label} ({ITEMS.filter((i) => i.status === s).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="space-y-3 mt-0">
            {filtered.map((item) => {
              const hasVoted = voted.includes(item.id);
              const meta = STATUS_META[item.status];
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card interactive>
                    <CardContent className="p-4 flex items-start gap-3">
                      <button
                        onClick={() => toggleVote(item.id)}
                        className={cn(
                          'flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 transition-all shrink-0 min-w-[64px]',
                          hasVoted
                            ? 'bg-gradient-to-b from-primary to-accent text-white border-primary shadow-glow-sm'
                            : 'border-border hover:border-primary/40'
                        )}
                        aria-label={hasVoted ? 'Remove vote' : 'Upvote'}
                      >
                        <ArrowUp className={cn('h-4 w-4', hasVoted && 'fill-current')} />
                        <span className="text-xs font-bold tabular-nums">{compactNumber(item.upvotes + (hasVoted ? 1 : 0))}</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className="font-semibold leading-snug">{item.title}</h3>
                          <span className={cn('inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 text-white bg-gradient-to-r', meta.color)}>
                            {meta.label}
                          </span>
                          <Badge variant="ghost" size="sm">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {item.author && (
                            <span className="inline-flex items-center gap-1.5"><Avatar src={item.author.avatar} name={item.author.name} size="xs" /> {item.author.name}</span>
                          )}
                          <span>·</span>
                          <span>{timeAgo(item.createdAt)}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {item.comments}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Suggest feature modal */}
      <Dialog open={showSuggest} onOpenChange={setShowSuggest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest a feature</DialogTitle>
            <DialogDescription>If others upvote it, we'll consider building it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input placeholder="One line: what would this feature do?" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} placeholder="Why is this useful? Who benefits? Any examples?" /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring">
                {['Editor', 'Chat', 'Forum', 'Search', 'Mobile', 'AI', 'Growth', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSuggest(false)}>Cancel</Button>
            <Button variant="gradient" onClick={() => { toast.success('Submitted! We\'ll review within 48h.'); setShowSuggest(false); }}>Submit suggestion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
