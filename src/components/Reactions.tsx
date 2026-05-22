import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';
import { ReactionEmoji, ReactionSummary } from '../types';

const EMOJIS: { emoji: ReactionEmoji; label: string }[] = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '🚀', label: 'Launch' },
  { emoji: '👀', label: 'Watching' },
  { emoji: '🎉', label: 'Celebrate' },
];

export interface ReactionsProps {
  reactions?: ReactionSummary[];
  onReact?: (emoji: ReactionEmoji) => void;
  size?: 'sm' | 'md';
  className?: string;
  /** Layout: inline shows existing reactions + picker; picker-only shows just the smile trigger */
  layout?: 'inline' | 'picker-only';
}

export function Reactions({ reactions = [], onReact, size = 'md', className, layout = 'inline' }: ReactionsProps) {
  const [open, setOpen] = React.useState(false);

  const handleReact = (emoji: ReactionEmoji) => {
    onReact?.(emoji);
    setOpen(false);
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {layout === 'inline' &&
        reactions
          .filter((r) => r.count > 0)
          .map((r) => (
            <Tooltip key={r.emoji} content={`${r.count} ${r.count === 1 ? 'reaction' : 'reactions'}`}>
              <button
                type="button"
                onClick={() => handleReact(r.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border transition-all',
                  'active:scale-95',
                  size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
                  r.hasReacted
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
                )}
              >
                <span className={size === 'sm' ? 'text-sm' : 'text-base'}>{r.emoji}</span>
                <span className="font-semibold tabular-nums">{r.count}</span>
              </button>
            </Tooltip>
          ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-secondary hover:text-foreground',
              size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
            )}
            aria-label="Add reaction"
          >
            <Smile className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1"
            >
              {EMOJIS.map((e, i) => (
                <motion.button
                  key={e.emoji}
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.02, type: 'spring', stiffness: 500, damping: 25 }}
                  whileHover={{ scale: 1.4, y: -4 }}
                  whileTap={{ scale: 1.1 }}
                  onClick={() => handleReact(e.emoji)}
                  className="text-2xl p-1 rounded-md transition-colors hover:bg-secondary"
                  title={e.label}
                >
                  {e.emoji}
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </div>
  );
}
