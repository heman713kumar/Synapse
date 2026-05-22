import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, GitCompare, Heart, MessageSquare, Users, Sparkles, Check, Minus } from 'lucide-react';
import { Page, Idea, User } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { Spinner } from './ui/Spinner';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';
import { userName, timeAgo, compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

export const CompareIdeas: React.FC<Props> = ({ setPage }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useLocalStorage<string[]>('synapse-compare-ideas', []);
  const [ideas, setIdeas] = useState<Record<string, Idea>>({});
  const [owners, setOwners] = useState<Record<string, User>>({});
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [loading, setLoading] = useState(true);

  // Load picker list
  useEffect(() => {
    let mounted = true;
    api.getAllIdeas().then((d) => { if (mounted) setAllIdeas(d || []); }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Load detailed ideas for the selected ones
  useEffect(() => {
    selectedIds.forEach((id) => {
      if (!ideas[id]) {
        api.getIdeaById(id).then((idea) => {
          setIdeas((p) => ({ ...p, [id]: idea }));
          if (idea.ownerId) {
            api.getUserById(idea.ownerId).then((u) => { if (u) setOwners((p) => ({ ...p, [u.userId]: u })); }).catch(() => {});
          }
        }).catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  const add = (id: string) => {
    if (selectedIds.length >= 3) {
      return;
    }
    if (selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
    setPickerOpen(false);
  };

  const remove = (id: string) => setSelectedIds(selectedIds.filter((x) => x !== id));

  const filtered = allIdeas.filter((i) => !debounced || i.title.toLowerCase().includes(debounced.toLowerCase()));

  const selectedIdeas = selectedIds.map((id) => ideas[id]).filter(Boolean);

  // Auto-derive comparison rows from common fields
  const rows = [
    { label: 'Owner',         get: (i: Idea) => userName(owners[i.ownerId]) },
    { label: 'Sector',        get: (i: Idea) => i.sector ?? '—' },
    { label: 'Region',        get: (i: Idea) => i.region ?? '—' },
    { label: 'Stage',         get: (i: Idea) => (i.progressStage ?? 'idea-stage').replace('-', ' ') },
    { label: 'Likes',         get: (i: Idea) => compactNumber(i.likesCount ?? 0), numeric: true },
    { label: 'Comments',      get: (i: Idea) => compactNumber(i.commentsCount ?? 0), numeric: true },
    { label: 'Collaborators', get: (i: Idea) => `${i.collaborators?.length ?? 0}`, numeric: true },
    { label: 'Posted',        get: (i: Idea) => timeAgo(i.createdAt) },
    { label: 'Tags',          get: (i: Idea) => (i.tags ?? []).slice(0, 5).join(', ') || '—' },
    { label: 'Required skills', get: (i: Idea) => (i.requiredSkills ?? []).slice(0, 5).join(', ') || '—' },
    { label: 'Public',        get: (i: Idea) => i.isPublic ? '✓' : '—' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-6xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Compare ideas</h1>
            <Badge variant="gradient" size="sm">New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Pick up to 3 ideas to compare side-by-side.</p>
        </header>

        {/* Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((slot) => {
            const id = selectedIds[slot];
            const idea = id ? ideas[id] : null;
            if (!id) {
              return (
                <button
                  key={slot}
                  onClick={() => setPickerOpen(true)}
                  className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 p-6 flex flex-col items-center justify-center min-h-[200px] transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center mb-2">
                    <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground">Add idea {slot + 1}</p>
                </button>
              );
            }
            if (!idea) {
              return (
                <div key={slot} className="surface p-5 min-h-[200px]">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              );
            }
            const owner = owners[idea.ownerId];
            return (
              <Card key={id} interactive className="relative">
                <button onClick={() => remove(id)} className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </button>
                <CardContent className="p-5">
                  <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="text-left w-full">
                    <h3 className="font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">{idea.title}</h3>
                  </button>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.summary}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar src={owner?.avatarUrl} name={userName(owner)} size="xs" />
                    <span className="text-xs">{userName(owner)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {compactNumber(idea.likesCount ?? 0)}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {compactNumber(idea.commentsCount ?? 0)}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {idea.collaborators?.length ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedIdeas.length < 2 ? (
          <EmptyState
            icon={<GitCompare className="h-8 w-8" />}
            title="Pick at least 2 ideas to compare"
            description="See sectors, stages, traction, and required skills side by side."
          />
        ) : (
          <>
            {/* Comparison table */}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/40">
                    <tr>
                      <th className="text-left text-[10px] uppercase font-semibold tracking-wider text-muted-foreground px-4 py-3">Attribute</th>
                      {selectedIdeas.map((i) => (
                        <th key={i.ideaId} className="text-left text-[10px] uppercase font-semibold tracking-wider text-muted-foreground px-4 py-3 truncate max-w-[200px]">
                          {i.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => {
                      const values = selectedIdeas.map((i) => row.get(i));
                      // Highlight the best (largest) for numeric rows
                      let bestIdx = -1;
                      if (row.numeric) {
                        const nums = values.map((v) => parseInt(v.replace(/[^\d]/g, '')) || 0);
                        bestIdx = nums.indexOf(Math.max(...nums));
                        if (nums.every((n) => n === nums[0])) bestIdx = -1; // no winner if tied
                      }
                      return (
                        <tr key={row.label}>
                          <td className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{row.label}</td>
                          {values.map((v, i) => (
                            <td key={i} className={cn('px-4 py-3 align-top', bestIdx === i && 'bg-success/5')}>
                              <div className="flex items-center gap-1.5">
                                {bestIdx === i && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
                                <span className="text-foreground">{v || <Minus className="h-3 w-3 text-muted-foreground" />}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => setSelectedIds([])}>Clear all</Button>
              <Button variant="gradient" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => setPickerOpen(true)} disabled={selectedIds.length >= 3}>
                Add another
              </Button>
            </div>
          </>
        )}

        {/* Picker modal */}
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="surface w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold mb-2">Add an idea to compare</h2>
                <Input autoFocus placeholder="Search ideas…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {loading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No ideas match.</p>
                ) : (
                  filtered.slice(0, 30).map((i) => (
                    <button
                      key={i.ideaId}
                      onClick={() => add(i.ideaId)}
                      disabled={selectedIds.includes(i.ideaId)}
                      className="w-full text-left p-3 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-sm font-semibold truncate">{i.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.summary}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-border flex justify-end">
                <Button variant="ghost" onClick={() => setPickerOpen(false)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
