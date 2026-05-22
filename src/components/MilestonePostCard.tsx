import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MilestonePost, User, Page, Idea } from '../types';
import api from '../services/backendApiService';
import { Rocket, ArrowRight } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Skeleton } from './ui/Skeleton';
import { timeAgo, userName } from '../utils/format';

interface MilestonePostCardProps {
  post: MilestonePost;
  setPage: (page: Page, id?: string) => void;
}

export const MilestonePostCard: React.FC<MilestonePostCardProps> = ({ post, setPage }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!post.ideaId) { setIsLoading(false); return; }
        const ideaData = await api.getIdeaById(post.ideaId);
        if (mounted) setIdea(ideaData);
        const ownerId = ideaData?.ownerId ?? post.userId;
        if (ownerId) {
          const userData = await api.getUserById(ownerId);
          if (mounted) setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch milestone post data:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [post.ideaId, post.userId]);

  if (isLoading) {
    return (
      <div className="surface p-5 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-1/2 mt-1" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || !idea) return null;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="surface surface-hover p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5 pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <button onClick={() => setPage('profile', user.userId)} className="rounded-full focus-ring shrink-0">
          <Avatar src={user.avatarUrl} name={userName(user)} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">
            <button onClick={() => setPage('profile', user.userId)} className="font-semibold text-foreground hover:text-primary transition-colors">
              {userName(user)}
            </button>
            {"'s "}
            <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="font-semibold text-primary hover:underline">
              {idea.title}
            </button>
            {' hit a milestone'}
            <span className="ml-1.5 text-xs">· {timeAgo(post.createdAt)}</span>
          </p>

          <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 p-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center text-white shadow-glow-sm shrink-0">
              <Rocket className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-cyan-600 dark:text-cyan-400">Milestone reached</p>
              <h3 className="font-bold text-base truncate mt-0.5">{post.milestoneTitle || post.title || 'Untitled milestone'}</h3>
              {post.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.description}</p>
              )}
              <button
                onClick={() => setPage('ideaDetail', idea.ideaId)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                View project progress <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
