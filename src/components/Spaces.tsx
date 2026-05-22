import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Users, ArrowLeft, Search, Plus, TrendingUp } from 'lucide-react';
import { Page } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string;
  members: number;
  emoji: string;
  color: string;
  trending?: boolean;
}

const SEED_SPACES: Space[] = [
  { id: 'climate', name: 'Climate Tech', slug: 'climate-tech', description: 'Carbon capture, renewables, climate adaptation, ESG.', members: 12480, emoji: '🌱', color: 'from-emerald-500 to-teal-500', trending: true },
  { id: 'ai', name: 'AI / ML', slug: 'ai-ml', description: 'Foundation models, agents, applied ML, research ideas.', members: 28110, emoji: '🤖', color: 'from-indigo-500 to-violet-500', trending: true },
  { id: 'founders', name: 'Solo Founders', slug: 'solo-founders', description: 'Bootstrappers, indie hackers, one-person companies.', members: 9870, emoji: '🚀', color: 'from-amber-500 to-orange-500' },
  { id: 'web3', name: 'Web3 / Crypto', slug: 'web3', description: 'On-chain ideas, DeFi, DAOs, NFTs that actually matter.', members: 5421, emoji: '⛓️', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'health', name: 'Healthtech', slug: 'healthtech', description: 'Patient experience, diagnostics, biotech, mental health.', members: 7320, emoji: '🩺', color: 'from-rose-500 to-red-500' },
  { id: 'edu', name: 'Edtech', slug: 'edtech', description: 'Learning platforms, AI tutors, credential systems.', members: 4080, emoji: '📚', color: 'from-sky-500 to-blue-500' },
  { id: 'design', name: 'Design Systems', slug: 'design-systems', description: 'Tokens, components, motion, accessibility.', members: 3215, emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: 'devtools', name: 'Developer Tools', slug: 'devtools', description: 'CLI, IDE, productivity, DX wins.', members: 6190, emoji: '🛠️', color: 'from-slate-500 to-zinc-700' },
  { id: 'social', name: 'Social Impact', slug: 'social-impact', description: 'Nonprofits, government tech, mutual aid, civic tools.', members: 2750, emoji: '🤝', color: 'from-cyan-500 to-teal-600' },
  { id: 'creator', name: 'Creator Economy', slug: 'creator', description: 'Newsletters, podcasts, micro-content, monetization.', members: 4912, emoji: '🎬', color: 'from-purple-500 to-fuchsia-500' },
  { id: 'space', name: 'Space & Aerospace', slug: 'space', description: 'Rockets, satellites, space data, planetary.', members: 1380, emoji: '🛰️', color: 'from-violet-500 to-indigo-500' },
  { id: 'food', name: 'Future of Food', slug: 'food', description: 'Alt-protein, agtech, food waste, restaurants.', members: 2104, emoji: '🥗', color: 'from-lime-500 to-green-500' },
];

export const Spaces: React.FC<Props> = ({ setPage }) => {
  const [query, setQuery] = useState('');
  const [joined, setJoined] = useLocalStorage<string[]>('synapse-joined-spaces', []);

  const filtered = useMemo(() => {
    if (!query) return SEED_SPACES;
    const q = query.toLowerCase();
    return SEED_SPACES.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  const trending = SEED_SPACES.filter((s) => s.trending);

  const toggleJoin = (id: string, name: string) => {
    setJoined((prev) => {
      const isJoined = prev.includes(id);
      toast.success(isJoined ? `Left ${name}` : `Joined ${name}`);
      return isJoined ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Spaces</h1>
            <Badge variant="gradient" size="sm">New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Join sector-focused communities to get a curated feed and find collaborators.</p>
        </header>

        <Input placeholder="Search spaces…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="mb-5" />

        {/* Trending */}
        {!query && trending.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trending now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trending.map((s) => (
                <SpaceCard key={s.id} space={s} joined={joined.includes(s.id)} onToggle={() => toggleJoin(s.id, s.name)} large />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SpaceCard key={s.id} space={s} joined={joined.includes(s.id)} onToggle={() => toggleJoin(s.id, s.name)} />
          ))}
        </div>

        <Card className="mt-6 border-dashed">
          <CardContent className="p-5 text-center">
            <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-2">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Create your own space</h3>
            <p className="text-xs text-muted-foreground mt-1">Premium feature — coming soon</p>
            <Button variant="outline" size="sm" className="mt-3">Request early access</Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

function SpaceCard({ space, joined, onToggle, large }: { space: Space; joined: boolean; onToggle: () => void; large?: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card interactive className={cn('h-full', large && 'border-primary/30')}>
        <CardContent className={cn('p-5', large && 'p-6')}>
          <div className="flex items-start justify-between mb-3">
            <div className={cn('h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-md', space.color)}>
              {space.emoji}
            </div>
            <Button size="sm" variant={joined ? 'outline' : 'gradient'} onClick={onToggle}>
              {joined ? 'Joined' : 'Join'}
            </Button>
          </div>
          <h3 className="font-semibold">{space.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.4em]">{space.description}</p>
          <p className="text-[11px] text-muted-foreground mt-3 inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {compactNumber(space.members)} members
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
