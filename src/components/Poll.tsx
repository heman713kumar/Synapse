import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, Users, Clock } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  /** ISO datetime — when the poll closes. null = open forever. */
  closesAt?: string | null;
  multipleChoice?: boolean;
}

interface Props {
  poll: PollData;
  /** Persist votes locally for demo. In production swap with API call. */
  storageKey?: string;
  /** Compact = no card chrome */
  compact?: boolean;
}

export const Poll: React.FC<Props> = ({ poll, storageKey, compact }) => {
  const key = storageKey ?? `synapse-poll-${poll.id}`;
  const [state, setState] = useLocalStorage<{ voted: string[]; tally: Record<string, number> }>(
    key,
    {
      voted: [],
      tally: Object.fromEntries(poll.options.map((o) => [o.id, o.votes])),
    }
  );

  const total = useMemo(() => Object.values(state.tally).reduce((a, b) => a + b, 0), [state.tally]);
  const isClosed = !!poll.closesAt && new Date(poll.closesAt).getTime() < Date.now();
  const hasVoted = state.voted.length > 0 && !poll.multipleChoice;

  const vote = (id: string) => {
    if (isClosed) return;
    if (hasVoted) return;
    setState((prev) => {
      const wasVoted = prev.voted.includes(id);
      const nextTally = { ...prev.tally };
      if (wasVoted && poll.multipleChoice) nextTally[id] = Math.max(0, nextTally[id] - 1);
      else nextTally[id] = (nextTally[id] ?? 0) + 1;
      const nextVoted = poll.multipleChoice
        ? wasVoted ? prev.voted.filter((v) => v !== id) : [...prev.voted, id]
        : [id];
      return { voted: nextVoted, tally: nextTally };
    });
  };

  const timeLeft = poll.closesAt ? formatTimeLeft(poll.closesAt) : null;

  const body = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="h-4 w-4 text-primary shrink-0" />
          <p className="font-semibold leading-snug">{poll.question}</p>
        </div>
        {poll.multipleChoice && <Badge variant="ghost" size="sm">Pick multiple</Badge>}
      </div>

      <ul className="space-y-2">
        {poll.options.map((opt) => {
          const count = state.tally[opt.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const myVote = state.voted.includes(opt.id);
          const showResults = hasVoted || isClosed;
          return (
            <li key={opt.id}>
              <button
                onClick={() => vote(opt.id)}
                disabled={isClosed || (hasVoted && !poll.multipleChoice && !myVote)}
                className={cn(
                  'group w-full text-left rounded-lg border px-3 py-2 transition-all relative overflow-hidden',
                  myVote ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  (isClosed || hasVoted) && 'cursor-default'
                )}
              >
                {/* Result bar */}
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('absolute inset-y-0 left-0 -z-10', myVote ? 'bg-primary/15' : 'bg-secondary/60')}
                  />
                )}
                <div className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    {myVote && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {showResults && (
                    <span className="text-xs font-semibold tabular-nums shrink-0">{pct}% · {compactNumber(count)}</span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {compactNumber(total)} {total === 1 ? 'vote' : 'votes'}</span>
        {timeLeft && (
          <span className={cn('inline-flex items-center gap-1', isClosed && 'text-destructive')}>
            <Clock className="h-3 w-3" /> {isClosed ? 'Closed' : timeLeft}
          </span>
        )}
        {hasVoted && !isClosed && !poll.multipleChoice && (
          <Button variant="ghost" size="sm" onClick={() => setState((p) => ({ ...p, voted: [] }))}>Change vote</Button>
        )}
      </div>
    </div>
  );

  if (compact) return body;
  return <Card><CardContent className="p-4">{body}</CardContent></Card>;
};

function formatTimeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Closed';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m left`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d left`;
}
