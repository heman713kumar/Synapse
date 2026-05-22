import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, Save, ArrowRight, Sparkles, Lightbulb } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Spinner } from './ui/Spinner';
import { toast } from './ui/Toaster';
import { useDebounce } from '../hooks/useDebounce';

interface SearchProps {
  onClose?: () => void;
}

const AdvancedSearch: React.FC<SearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  // Filters
  const [category, setCategory] = useState('');
  const [minLikes, setMinLikes] = useState('');
  const [minComments, setMinComments] = useState('');
  const [status, setStatus] = useState('published');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    if (debouncedQuery.length >= 2 && !searched) {
      api.getSearchSuggestions(debouncedQuery).then(setSuggestions).catch(() => {});
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, searched]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSuggestions([]);
    try {
      const filters = {
        category: category || undefined,
        minLikes: minLikes ? parseInt(minLikes) : undefined,
        minComments: minComments ? parseInt(minComments) : undefined,
        status,
        sortBy,
      };
      const data = await api.searchIdeas(query, filters);
      setResults(data || []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    const name = prompt('Name this search:');
    if (!name) return;
    try {
      const filters = { category, minLikes, minComments, status, sortBy };
      await api.createSavedSearch(name, query, filters);
      toast.success(`Saved "${name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save');
    }
  };

  const clearFilters = () => {
    setCategory(''); setMinLikes(''); setMinComments(''); setStatus('published'); setSortBy('created_at');
  };

  const activeFilters = [category, minLikes, minComments].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b border-border sticky top-0 z-30">
        <div className="container max-w-4xl flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Search className="h-5 w-5" /> Advanced search
          </h1>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="container max-w-4xl py-6 px-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Input
              autoFocus
              placeholder="Search ideas, tags, descriptions…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
              leftIcon={<Search className="h-4 w-4" />}
              rightIcon={query && (
                <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              className="text-base h-12"
            />

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && !searched && (
                <motion.ul
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
                >
                  {suggestions.slice(0, 6).map((s) => (
                    <li
                      key={s}
                      onClick={() => { setQuery(s); handleSearch(); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-secondary"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      {s}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="gradient" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />} disabled={!query.trim()}>
              Search
            </Button>
            <Button type="button" variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setShowFilters((v) => !v)}>
              Filters {activeFilters > 0 && <Badge variant="default" size="sm" className="ml-1">{activeFilters}</Badge>}
            </Button>
            {query && (
              <Button type="button" variant="ghost" leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveSearch}>
                Save search
              </Button>
            )}
          </div>

          {/* Filters drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card>
                  <CardContent className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Input placeholder="e.g. AI, fintech" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Min likes</Label>
                      <Input type="number" min="0" value={minLikes} onChange={(e) => setMinLikes(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Min comments</Label>
                      <Input type="number" min="0" value={minComments} onChange={(e) => setMinComments(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring">
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sort by</Label>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring">
                        <option value="created_at">Newest</option>
                        <option value="likes">Most liked</option>
                        <option value="comments">Most discussed</option>
                        <option value="trending">Trending</option>
                      </select>
                    </div>
                    {activeFilters > 0 && (
                      <div className="col-span-full flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Searching…</p>
            </div>
          ) : searched && results.length === 0 ? (
            <EmptyState
              icon={<Lightbulb className="h-8 w-8" />}
              title="No results"
              description={`We couldn't find anything matching "${query}". Try different keywords.`}
            />
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">{results.length} result{results.length === 1 ? '' : 's'}</p>
              <div className="space-y-3">
                {results.map((r) => (
                  <Card key={r.id || r.ideaId} interactive>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg">{r.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.summary || r.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{r.likes_count ?? r.likesCount ?? 0} likes</span>
                        <span>·</span>
                        <span>{r.comments_count ?? r.commentsCount ?? 0} comments</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Sparkles className="h-8 w-8" />}
              title="Find anything on Synapse"
              description="Search ideas by keyword, filter by likes and comments, save searches for later."
            />
          )}
        </div>
      </motion.main>
    </div>
  );
};

export default AdvancedSearch;
