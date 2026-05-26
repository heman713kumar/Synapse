import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookmarkPlus, Search, Trash2, Bell, BellOff, Plus } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from './ui/Toaster';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    sector?: string;
    stage?: string;
    skills?: string[];
  };
  notify: boolean;
  createdAt: string;
}

/**
 * Saved Searches — bookmark a search query + filters, optionally subscribe.
 *
 * Pure client-side for now (localStorage). When /api/saved-searches ships,
 * the notify flag will trigger a daily email digest of new matches.
 */
export const SavedSearches: React.FC<Props> = ({ setPage }) => {
  const [searches, setSearches] = useLocalStorage<SavedSearch[]>('synapse-saved-searches', []);
  const [creating, setCreating] = useState(false);

  const remove = useCallback((id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    toast.success('Removed');
  }, [setSearches]);

  const toggleNotify = useCallback((id: string) => {
    setSearches((prev) => prev.map((s) => s.id === id ? { ...s, notify: !s.notify } : s));
  }, [setSearches]);

  const run = useCallback((s: SavedSearch) => {
    sessionStorage.setItem('synapse-search-prefill', JSON.stringify({ query: s.query, ...s.filters }));
    setPage('search');
  }, [setPage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-3xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookmarkPlus className="h-5 w-5" />
            </span>
            Saved Searches
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Re-run common searches with one click. Enable notifications for a daily digest.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>New search</Button>
      </header>

      {creating && (
        <NewSearchCard
          onCancel={() => setCreating(false)}
          onCreate={(s) => {
            setSearches((prev) => [s, ...prev]);
            setCreating(false);
            toast.success('Search saved');
          }}
        />
      )}

      {searches.length === 0 && !creating ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="No saved searches yet"
          description="Save a search to re-run it later or get notified when new ideas match."
          action={{ label: 'Create your first', onClick: () => setCreating(true), icon: <Plus className="h-4 w-4" /> }}
        />
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <Card key={s.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <button onClick={() => run(s)} className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                    {s.notify && <Bell className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2 font-mono">{s.query || '(no query)'}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.filters.sector && <Badge variant="ghost" size="sm">Sector: {s.filters.sector}</Badge>}
                    {s.filters.stage && <Badge variant="ghost" size="sm">Stage: {s.filters.stage}</Badge>}
                    {s.filters.skills?.slice(0, 3).map((sk) => <Badge key={sk} variant="ghost" size="sm">{sk}</Badge>)}
                  </div>
                </button>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleNotify(s.id)}
                    className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground"
                    title={s.notify ? 'Disable notifications' : 'Enable notifications'}
                  >
                    {s.notify ? <Bell className="h-3.5 w-3.5 text-primary" /> : <BellOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${s.name}"?`)) remove(s.id); }}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const NewSearchCard: React.FC<{ onCancel: () => void; onCreate: (s: SavedSearch) => void }> = ({ onCancel, onCreate }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [skills, setSkills] = useState('');
  const [notify, setNotify] = useState(false);

  const submit = () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    const s: SavedSearch = {
      id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      query: query.trim(),
      filters: {
        sector: sector.trim() || undefined,
        stage: stage.trim() || undefined,
        skills: skills.trim() ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      },
      notify,
      createdAt: new Date().toISOString(),
    };
    onCreate(s);
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block space-y-1">
      <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );

  return (
    <Card className="mb-4 border-primary/40">
      <CardContent className="p-4 space-y-3">
        <Field label="Name"><Input placeholder="e.g. AI infra builders looking for ML eng" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Search query"><Input placeholder="keywords" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search className="h-4 w-4" />} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sector"><Input placeholder="e.g. fintech" value={sector} onChange={(e) => setSector(e.target.value)} /></Field>
          <Field label="Stage"><Input placeholder="e.g. team-building" value={stage} onChange={(e) => setStage(e.target.value)} /></Field>
        </div>
        <Field label="Skills (comma separated)"><Input placeholder="react, ml, design" value={skills} onChange={(e) => setSkills(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="rounded" />
          <Bell className="h-3.5 w-3.5 text-primary" />
          Send me a daily email when new matches appear
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit} leftIcon={<BookmarkPlus className="h-4 w-4" />}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};
