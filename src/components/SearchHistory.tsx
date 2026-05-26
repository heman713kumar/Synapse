import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Search, Trash2, X } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from './ui/Toaster';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface SearchEntry {
  query: string;
  at: string;
  resultsCount?: number;
}

/**
 * Search History — recent queries, click to re-run.
 *
 * Source of truth: the same 'synapse-search-history' key Search.tsx writes to
 * (it appends an entry on every submit). Reads/clears here keep that in sync.
 */
export const SearchHistory: React.FC<Props> = ({ setPage }) => {
  const [history, setHistory] = useLocalStorage<SearchEntry[]>('synapse-search-history', []);

  const rerun = useCallback((query: string) => {
    sessionStorage.setItem('synapse-search-prefill', JSON.stringify({ query }));
    setPage('search');
  }, [setPage]);

  const removeOne = useCallback((idx: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== idx));
  }, [setHistory]);

  const clearAll = useCallback(() => {
    if (history.length === 0) return;
    if (!confirm('Clear your entire search history?')) return;
    setHistory([]);
    toast.success('History cleared');
  }, [history.length, setHistory]);

  // Group by day for friendlier reading
  const groups = history.reduce<Record<string, { entry: SearchEntry; idx: number }[]>>((acc, entry, idx) => {
    const day = new Date(entry.at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    (acc[day] ??= []).push({ entry, idx });
    return acc;
  }, {});

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
              <History className="h-5 w-5" />
            </span>
            Search History
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Click any query to run it again. History is stored only on this device.</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} onClick={clearAll}>Clear all</Button>
        )}
      </header>

      {history.length === 0 ? (
        <EmptyState
          icon={<History className="h-10 w-10" />}
          title="No searches yet"
          description="Your recent searches will show up here."
          action={{ label: 'Search now', onClick: () => setPage('search'), icon: <Search className="h-4 w-4" /> }}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([day, items]) => (
            <section key={day}>
              <h2 className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-2">{day}</h2>
              <Card>
                <CardContent className="p-0 divide-y divide-border/40">
                  {items.map(({ entry, idx }) => (
                    <div key={`${entry.at}-${idx}`} className="flex items-center gap-2 p-3 hover:bg-secondary/30 transition-colors">
                      <button
                        onClick={() => rerun(entry.query)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left"
                      >
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{entry.query || <em className="text-muted-foreground">empty query</em>}</span>
                        {typeof entry.resultsCount === 'number' && (
                          <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{entry.resultsCount} result{entry.resultsCount === 1 ? '' : 's'}</span>
                        )}
                        <span className="text-[11px] text-muted-foreground shrink-0">{new Date(entry.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </button>
                      <button
                        onClick={() => removeOne(idx)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-destructive"
                        title="Remove"
                        aria-label="Remove from history"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
};
