import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, UserPlus, MessageSquare, Star } from 'lucide-react';
import { User, Idea, RecommendedCollaborator, Page } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Skeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { Tooltip } from './ui/Tooltip';
import { toast } from './ui/Toaster';
import { userName, truncate } from '../utils/format';

interface Props {
  idea: Idea;
  currentUser?: User | null;
  setPage: (page: Page, id?: string) => void;
  /** Compact or full layout */
  compact?: boolean;
}

/** Local fallback scoring when backend recommendation isn't available. */
function scoreUser(user: User, idea: Idea): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const userSkills = new Set((user.skills ?? []).map((s) => s.skillName));
  const userInterests = new Set(user.interests ?? []);

  (idea.requiredSkills ?? []).forEach((s) => {
    if (userSkills.has(s)) { score += 25; reasons.push(`Has ${s}`); }
  });
  (idea.tags ?? []).forEach((t) => {
    if (userInterests.has(t)) { score += 10; reasons.push(`Interested in ${t}`); }
  });
  if (idea.sector && userInterests.has(idea.sector)) {
    score += 15; reasons.push(`Works in ${idea.sector}`);
  }
  if (user.isVerified) score += 5;

  return { score: Math.min(100, score), reasons: reasons.slice(0, 3) };
}

export const SmartCollaboratorMatch: React.FC<Props> = ({ idea, currentUser, setPage, compact }) => {
  const [recommendations, setRecommendations] = useState<RecommendedCollaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getRecommendedCollaborators(idea.ideaId)
      .then((data) => {
        if (mounted) setRecommendations(data ?? []);
      })
      .catch(() => {
        // Fallback: fetch users by skill match
        if (!idea.requiredSkills?.length) {
          setRecommendations([]);
          return;
        }
        api.searchUsers({ skills: idea.requiredSkills })
          .then((users) => {
            if (!mounted) return;
            const scored = (users ?? [])
              .filter((u) => u.userId !== idea.ownerId && u.userId !== currentUser?.userId)
              .map((u) => {
                const s = scoreUser(u, idea);
                return { ...u, matchScore: s.score, reason: s.reasons.join(' · ') };
              })
              .sort((a, b) => b.matchScore - a.matchScore)
              .slice(0, compact ? 3 : 5);
            setRecommendations(scored);
          })
          .catch(() => setRecommendations([]));
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [idea.ideaId, idea.requiredSkills, idea.ownerId, currentUser?.userId, compact]);

  const list = useMemo(() => recommendations.slice(0, compact ? 3 : 5), [recommendations, compact]);

  const handleStartChat = async (uid: string) => {
    try {
      const c = await api.startConversation(uid);
      setPage('chat', c.conversationId || (c as any).id);
    } catch {
      toast.error("Couldn't start chat");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (list.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            size="sm"
            icon={<Sparkles className="h-6 w-6" />}
            title="No matches yet"
            description="Add required skills to attract the right collaborators."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Smart matches</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Suggested by skills, interests, and sector.</p>
          </div>
        </div>

        <div className="divide-y divide-border -mx-2">
          {list.map((rec, i) => (
            <motion.div
              key={rec.userId}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-2 py-3 first:pt-0 last:pb-0 flex items-start gap-3 group"
            >
              <button onClick={() => setPage('profile', rec.userId)} className="rounded-full focus-ring shrink-0">
                <Avatar src={rec.avatarUrl} name={userName(rec)} size="md" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setPage('profile', rec.userId)} className="font-semibold text-sm truncate hover:text-primary transition-colors">
                    {userName(rec)}
                  </button>
                  <Tooltip content={`${rec.matchScore}% match`}>
                    <Badge variant={rec.matchScore >= 70 ? 'gradient' : 'soft'} size="sm">
                      <Star className="h-2.5 w-2.5 fill-current" /> {rec.matchScore}%
                    </Badge>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground truncate">{truncate(rec.reason ?? rec.headline ?? rec.bio ?? '', 80)}</p>
                <Progress value={rec.matchScore} gradient className="h-1 mt-1.5" />

                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="ghost" leftIcon={<MessageSquare className="h-3 w-3" />} onClick={() => handleStartChat(rec.userId)}>
                    Message
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<UserPlus className="h-3 w-3" />} onClick={() => api.sendConnectionRequest(rec.userId).then(() => toast.success('Request sent')).catch(() => toast.error('Failed'))}>
                    Connect
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
