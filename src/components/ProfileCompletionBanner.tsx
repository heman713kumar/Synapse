import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Page, User } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../utils/cn';

interface Props {
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
  /** Hides at this completion percent or above */
  hideAt?: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  goto?: () => void;
}

/**
 * Profile completion meter — sticky-but-dismissible card encouraging the user
 * to fill out their profile. Hides at 80%+ completion or when explicitly
 * dismissed. Dismissal is sticky in localStorage so we don't nag.
 */
export const ProfileCompletionBanner: React.FC<Props> = ({ currentUser, setPage, hideAt = 80 }) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>('synapse-profile-banner-dismissed', false);

  const checklist = useMemo<ChecklistItem[]>(() => {
    if (!currentUser) return [];
    const u = currentUser;
    const hasAvatar = !!u.avatarUrl && !u.avatarUrl.includes('default');
    const hasBio = (u.bio?.trim().length ?? 0) >= 20;
    const hasSkills = Array.isArray(u.skills) && u.skills.length > 0;
    const hasInterests = Array.isArray(u.interests) && u.interests.length > 0;
    const hasHeadline = (u.headline?.trim().length ?? 0) > 0;
    const hasLinks = !!(u.linkedInUrl || u.githubUrl || u.portfolioUrl || u.websiteUrl || u.twitterUrl);

    const goSettings = () => setPage('settings');
    return [
      { key: 'avatar',    label: 'Add a profile photo',              done: hasAvatar,    goto: goSettings },
      { key: 'bio',       label: 'Write a bio (20+ characters)',     done: hasBio,       goto: goSettings },
      { key: 'headline',  label: 'Add a one-line headline',           done: hasHeadline,  goto: goSettings },
      { key: 'skills',    label: 'List at least one skill',           done: hasSkills,    goto: goSettings },
      { key: 'interests', label: 'Pick interests we can match on',    done: hasInterests, goto: goSettings },
      { key: 'links',     label: 'Link one external profile',         done: hasLinks,     goto: goSettings },
    ];
  }, [currentUser, setPage]);

  const completion = useMemo(() => {
    if (checklist.length === 0) return 0;
    const done = checklist.filter((c) => c.done).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  if (!currentUser) return null;
  if (dismissed) return null;
  if (completion >= hideAt) return null;

  const nextTodo = checklist.find((c) => !c.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-accent/3 to-transparent overflow-hidden">
        <CardContent className="p-4 relative">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">Finish setting up your profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Profiles that are 80%+ complete get 3x more collaboration requests.
              </p>

              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums">{completion}%</span>
              </div>

              {/* Checklist (compact) */}
              <ul className="mt-3 space-y-1">
                {checklist.map((c) => (
                  <li key={c.key} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full border shrink-0',
                      c.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background',
                    )}>
                      {c.done && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className={cn(c.done && 'line-through text-muted-foreground')}>{c.label}</span>
                  </li>
                ))}
              </ul>

              {nextTodo?.goto && (
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  onClick={nextTodo.goto}
                  className="mt-3"
                >
                  {nextTodo.label}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
