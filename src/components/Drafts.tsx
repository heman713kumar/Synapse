import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Pencil, Trash2, FilePlus2 } from 'lucide-react';
import { Page } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { ConfirmationModal } from './ConfirmationModal';
import { toast } from './ui/Toaster';

interface DraftEntry {
  key: string;          // full localStorage key, e.g. "synapse-draft-new-idea"
  shortKey: string;     // the part after "synapse-draft-"
  title: string;
  summary: string;
  size: number;         // bytes — proxy for "how much content is in it"
}

interface DraftsProps {
  setPage: (page: Page, id?: string) => void;
}

const DRAFT_PREFIX = 'synapse-draft-';

/**
 * Surface all drafts the user has accumulated in localStorage.
 *
 * Drafts are saved by hooks/useDraft.ts under keys like `synapse-draft-new-idea`.
 * Until this page existed they were a black box — typed once, persisted forever
 * with no way to find or delete them other than DevTools. This scans the
 * localStorage namespace, shows a summary card per draft, and lets the user
 * continue editing or throw them away.
 */
export const Drafts: React.FC<DraftsProps> = ({ setPage }) => {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  // Read localStorage once on mount and whenever a deletion happens.
  const refresh = () => {
    const out: DraftEntry[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(DRAFT_PREFIX)) continue;
        const raw = localStorage.getItem(key) || '';
        let parsed: any = null;
        try { parsed = JSON.parse(raw); } catch { /* ignore non-JSON drafts */ }
        const title =
          parsed?.title?.trim() ||
          parsed?.heading?.trim() ||
          '(Untitled draft)';
        const summary =
          parsed?.summary?.trim() ||
          parsed?.description?.trim() ||
          parsed?.body?.trim() ||
          '';
        out.push({
          key,
          shortKey: key.slice(DRAFT_PREFIX.length),
          title,
          summary,
          size: raw.length,
        });
      }
    } catch { /* localStorage unavailable in some contexts; show empty */ }
    // Largest first — biggest unsaved investment shows on top.
    out.sort((a, b) => b.size - a.size);
    setDrafts(out);
  };

  useEffect(() => { refresh(); }, []);

  const totalSize = useMemo(
    () => drafts.reduce((sum, d) => sum + d.size, 0),
    [drafts],
  );

  const handleContinue = (draft: DraftEntry) => {
    // The NewIdeaForm picks up the draft via useDraft('new-idea').
    // Only that specific draft has a continue-editing flow today; for other
    // draft keys, route to /newIdea anyway and surface a toast.
    if (draft.shortKey === 'new-idea') {
      setPage('newIdea');
    } else {
      toast.info(`No editor for draft "${draft.shortKey}" yet — opening New Idea.`);
      setPage('newIdea');
    }
  };

  const handleDelete = () => {
    if (!confirmKey) return;
    try {
      localStorage.removeItem(confirmKey);
      toast.success('Draft deleted');
    } catch {
      toast.error('Could not delete draft');
    }
    setConfirmKey(null);
    refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-3xl py-6 md:py-10 px-4"
    >
      <header className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            My Drafts
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {drafts.length} draft{drafts.length === 1 ? '' : 's'} saved locally
            {totalSize > 0 && <> · {(totalSize / 1024).toFixed(1)} KB</>}
          </p>
        </div>
        <Button
          variant="gradient"
          leftIcon={<FilePlus2 className="h-4 w-4" />}
          onClick={() => setPage('newIdea')}
        >
          New idea
        </Button>
      </header>

      {drafts.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No drafts yet"
          description="Drafts are saved automatically as you type a new idea. Start one and it'll appear here even if you close the tab."
          action={{ label: 'Start a new idea', onClick: () => setPage('newIdea') }}
        />
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <Card key={d.key}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{d.title}</h3>
                  {d.summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {d.summary}
                    </p>
                  )}
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-2">
                    {d.shortKey} · {d.size} bytes
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => handleContinue(d)}
                  >
                    Continue
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => setConfirmKey(d.key)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmKey}
        onClose={() => setConfirmKey(null)}
        onConfirm={handleDelete}
        title="Delete this draft?"
        message="This will permanently remove the draft from your browser. There's no undo."
        confirmText="Delete"
        destructive
      />
    </motion.div>
  );
};
