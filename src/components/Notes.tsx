import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, NotebookPen, Plus, Search, Trash2, Pin, PinOff, Tag as TagIcon, X } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../utils/cn';
import { toast } from './ui/Toaster';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#e0e7ff', '#fed7aa'];

const noteColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return COLORS[Math.abs(hash) % COLORS.length];
};

/**
 * Personal Notes / Journal — localStorage-backed.
 *
 * Notes never leave the device. Useful for jotting half-formed ideas before
 * they're ready to post publicly, meeting notes from collaborator calls, etc.
 * No backend dependency on purpose — keep it offline-first and private.
 */
export const Notes: React.FC<Props> = ({ setPage }) => {
  const [notes, setNotes] = useLocalStorage<Note[]>('synapse-notes', []);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (activeTag && !n.tags.includes(activeTag)) return false;
        if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, query, activeTag]);

  const createNew = useCallback(() => {
    const now = new Date().toISOString();
    const blank: Note = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      body: '',
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setEditing(blank);
  }, []);

  const save = useCallback((n: Note) => {
    const updated = { ...n, updatedAt: new Date().toISOString() };
    setNotes((prev) => {
      const i = prev.findIndex((x) => x.id === n.id);
      if (i === -1) return [updated, ...prev];
      const copy = [...prev];
      copy[i] = updated;
      return copy;
    });
    setEditing(null);
    toast.success('Saved');
  }, [setNotes]);

  const remove = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, [setNotes]);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }, [setNotes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-5xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <NotebookPen className="h-5 w-5" />
            </span>
            Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Private journal — never leaves your device.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={createNew}>New note</Button>
      </header>

      {/* Search + tag filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input
          placeholder="Search notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="flex-1"
        />
        {allTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin md:max-w-md">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                'shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium border',
                activeTag === null ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40',
              )}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={cn(
                  'shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium border inline-flex items-center gap-1',
                  activeTag === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40',
                )}
              >
                <TagIcon className="h-3 w-3" />
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-10 w-10" />}
          title={notes.length === 0 ? 'No notes yet' : 'No matches'}
          description={notes.length === 0 ? 'Jot down half-formed ideas before posting them publicly.' : 'Try different keywords or clear the tag filter.'}
          action={notes.length === 0 ? { label: 'Create your first note', onClick: createNew, icon: <Plus className="h-4 w-4" /> } : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setEditing(n)}
              className="text-left rounded-xl p-4 border border-border/40 hover:border-primary/40 transition-all shadow-sm hover:shadow-md relative group"
              style={{ backgroundColor: noteColor(n.id) }}
            >
              {n.pinned && (
                <Pin className="absolute top-2 right-2 h-3.5 w-3.5 text-amber-700/80" />
              )}
              <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 pr-5">{n.title || 'Untitled'}</h3>
              <p className="text-xs text-gray-700/90 line-clamp-5 whitespace-pre-wrap leading-relaxed">{n.body || 'No content.'}</p>
              {n.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-black/5">
                  {n.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 text-gray-800">#{t}</span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-700/60 mt-2">{new Date(n.updatedAt).toLocaleDateString()}</p>
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); togglePin(n.id); } }}
                  className="p-1.5 rounded-md hover:bg-black/10 text-gray-700"
                  title={n.pinned ? 'Unpin' : 'Pin'}
                >
                  {n.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete this note?')) remove(n.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); remove(n.id); } }}
                  className="p-1.5 rounded-md hover:bg-red-100 text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <NoteEditor
            note={editing}
            onClose={() => setEditing(null)}
            onSave={save}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const NoteEditor: React.FC<{
  note: Note;
  onClose: () => void;
  onSave: (n: Note) => void;
}> = ({ note, onClose, onSave }) => {
  const [draft, setDraft] = useState<Note>(note);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onSave(draft); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft, onClose, onSave]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!t || draft.tags.includes(t)) return;
    setDraft({ ...draft, tags: [...draft.tags, t] });
    setTagInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Note title"
            className="flex-1 bg-transparent text-lg font-bold focus:outline-none"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder="Start writing… (Ctrl+S to save, Esc to close)"
          className="flex-1 min-h-[280px] p-4 bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
        />

        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.tags.map((t) => (
              <Badge key={t} variant="ghost" size="sm" className="inline-flex items-center gap-1">
                #{t}
                <button
                  onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}
                  className="hover:text-destructive"
                  aria-label={`Remove tag ${t}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add tag…"
              className="bg-transparent text-xs focus:outline-none border-b border-transparent focus:border-border w-24"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-secondary/20">
          <Button variant="ghost" size="sm" leftIcon={draft.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />} onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}>
            {draft.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(draft)} disabled={!draft.title.trim() && !draft.body.trim()}>Save</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
