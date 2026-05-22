import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AchievementPost, User, Page } from '../types';
import api from '../services/backendApiService';
import { ACHIEVEMENTS } from '../constants';
import { Trophy, Sparkles } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Skeleton } from './ui/Skeleton';
import { timeAgo, userName } from '../utils/format';

interface AchievementPostCardProps {
  post: AchievementPost;
  setPage: (page: Page, id?: string) => void;
}

export const AchievementPostCard: React.FC<AchievementPostCardProps> = ({ post, setPage }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const achievement = post?.achievementId ? ACHIEVEMENTS[post.achievementId] : null;

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        if (post?.userId) {
          const userData = await api.getUserById(post.userId);
          if (mounted) setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user for achievement post:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, [post?.userId]);

  if (isLoading || !user) {
    return (
      <div className="surface p-5 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-1/2 mt-1" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="surface surface-hover p-5 relative overflow-hidden"
    >
      {/* Subtle celebratory glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <button onClick={() => setPage('profile', user.userId)} className="rounded-full focus-ring shrink-0">
          <Avatar src={user.avatarUrl} name={userName(user)} size="md" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            <button onClick={() => setPage('profile', user.userId)} className="font-semibold text-foreground hover:text-primary transition-colors">
              {userName(user)}
            </button>
            {' unlocked an achievement'}
            <span className="ml-1.5 text-xs">· {timeAgo(post.createdAt)}</span>
          </p>

          <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-glow-sm shrink-0">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold truncate">{achievement?.name ?? post.title ?? 'Achievement'}</h3>
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </div>
              {(achievement?.description || post.description) && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{achievement?.description ?? post.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
