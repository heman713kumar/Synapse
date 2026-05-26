import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Sparkles, Users, Heart, MessageSquare, UserPlus } from 'lucide-react';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { SkeletonList } from './ui/Skeleton';
import { toast } from './ui/Toaster';
import { compactNumber, timeAgo, truncate } from '../utils/format';

// Accept BOTH snake_case (what some backend endpoints return) and camelCase
// (what the global Idea/User types use). Whichever the API delivers, the
// `pick*` helpers below normalize at the read site so the JSX stays clean.
interface IdeaData {
  id: string;
  ideaId?: string;             // some endpoints use ideaId instead of id
  title: string;
  description?: string;
  summary?: string;
  likes_count?: number;        likesCount?: number;
  comments_count?: number;     commentsCount?: number;
  created_at?: string;         createdAt?: string;
}

interface UserData {
  id: string;
  userId?: string;
  username: string;
  profile_picture?: string;    avatarUrl?: string;
  bio?: string;
  followers_count?: number;    followersCount?: number;
}

const pickLikes    = (i: IdeaData) => i.likes_count    ?? i.likesCount    ?? 0;
const pickComments = (i: IdeaData) => i.comments_count ?? i.commentsCount ?? 0;
const pickDate     = (i: IdeaData) => i.created_at     ?? i.createdAt     ?? '';
const pickAvatar   = (u: UserData) => u.profile_picture ?? u.avatarUrl    ?? '';
const pickFollowers= (u: UserData) => u.followers_count ?? u.followersCount ?? 0;

const TrendingAndRecommendations: React.FC = () => {
  const [trending, setTrending] = useState<IdeaData[]>([]);
  const [hotNow, setHotNow] = useState<IdeaData[]>([]);
  const [recommendations, setRecommendations] = useState<IdeaData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [t, h, r, u] = await Promise.all([
          api.getTrendingIdeas('today').catch(() => []),
          api.getHotRightNow().catch(() => []),
          api.getRecommendedIdeas().catch(() => []),
          api.getRecommendedUsers().catch(() => []),
        ]);
        setTrending(t || []);
        setHotNow(h || []);
        setRecommendations(r || []);
        setUsers(u || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const IdeaTile: React.FC<{ idea: IdeaData; rank?: number }> = ({ idea, rank }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card interactive className="h-full relative">
        {rank !== undefined && rank < 3 && (
          <Badge variant="gradient" size="sm" className="absolute -top-2 -left-2 z-10 shadow-glow-sm">
            #{rank + 1}
          </Badge>
        )}
        <CardContent className="p-5">
          <h3 className="font-semibold leading-snug">{idea.title}</h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{truncate(idea.description || idea.summary || '', 140)}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {compactNumber(pickLikes(idea))}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {compactNumber(pickComments(idea))}</span>
            <span className="ml-auto">{timeAgo(pickDate(idea))}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const UserTile: React.FC<{ user: UserData }> = ({ user }) => (
    <Card interactive className="h-full">
      <CardContent className="p-5 flex items-start gap-3">
        <Avatar src={pickAvatar(user)} name={user.username} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{user.username}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{compactNumber(pickFollowers(user))} followers</p>
        </div>
        <Button size="sm" variant="outline" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => toast.success(`Following ${user.username}`)}>
          Follow
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Discover</h1>
          </div>
          <p className="text-sm text-muted-foreground">What's trending, hot, and matched to you.</p>
        </header>

        <Tabs defaultValue="trending">
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="trending" className="gap-2"><TrendingUp className="h-4 w-4" /> Trending</TabsTrigger>
            <TabsTrigger variant="pills" value="hot" className="gap-2"><Flame className="h-4 w-4" /> Hot now</TabsTrigger>
            <TabsTrigger variant="pills" value="recommendations" className="gap-2"><Sparkles className="h-4 w-4" /> For you</TabsTrigger>
            <TabsTrigger variant="pills" value="users" className="gap-2"><Users className="h-4 w-4" /> People</TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0">
            {loading ? <SkeletonList count={4} /> : trending.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {trending.map((i, idx) => <IdeaTile key={i.id} idea={i} rank={idx} />)}
              </div>
            ) : <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="Nothing trending today" description="Check back soon." />}
          </TabsContent>

          <TabsContent value="hot" className="mt-0">
            {loading ? <SkeletonList count={4} /> : hotNow.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {hotNow.map((i) => <IdeaTile key={i.id} idea={i} />)}
              </div>
            ) : <EmptyState icon={<Flame className="h-8 w-8" />} title="Nothing on fire" description="No high-velocity ideas in the past hour." />}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            {loading ? <SkeletonList count={4} /> : recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {recommendations.map((i) => <IdeaTile key={i.id} idea={i} />)}
              </div>
            ) : <EmptyState icon={<Sparkles className="h-8 w-8" />} title="No personalized picks yet" description="Add more skills and interests to your profile." />}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {loading ? <SkeletonList count={3} /> : users.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {users.map((u) => <UserTile key={u.id} user={u} />)}
              </div>
            ) : <EmptyState icon={<Users className="h-8 w-8" />} title="No suggestions yet" description="As you connect with people, we'll suggest more." />}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default TrendingAndRecommendations;
