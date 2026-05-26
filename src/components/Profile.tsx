import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Idea, Page, UserAchievement, SkillEndorsement } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { ReportModal } from './ReportModal';
import { ACHIEVEMENTS } from '../constants';
import {
  MessageSquare, MoreVertical, Flag, Trophy, Lightbulb,
  Plus, MapPin, Globe, Briefcase, Code2, AtSign, UserPlus, UserCheck, Sparkles, CheckCircle2,
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Progress } from './ui/Progress';
import { Tooltip } from './ui/Tooltip';
import { Skeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/DropdownMenu';
import { toast } from './ui/Toaster';
import { userName, initials, compactNumber } from '../utils/format';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { StreakBadge } from './StreakBadge';
import { ProfileQRModal } from './ProfileQRModal';
import { QrCode } from 'lucide-react';
import { cn } from '../utils/cn';
import { NotFound } from './NotFound';

interface ProfileProps {
  userId: string;
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
}

function calcCompletion(u: User): number {
  const checks = [
    !!u.displayName || !!u.name,
    !!u.avatarUrl,
    !!u.bio && u.bio.length > 20,
    !!u.headline,
    !!u.location,
    (u.skills?.length ?? 0) > 0,
    (u.interests?.length ?? 0) > 0,
    !!u.linkedInUrl || !!u.websiteUrl || !!u.githubUrl,
    !!u.coverImageUrl,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export const Profile: React.FC<ProfileProps> = ({ userId, currentUser, setPage }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [collabIdeas, setCollabIdeas] = useState<Idea[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwn = currentUser?.userId === userId;
  const completion = useMemo(() => (user ? calcCompletion(user) : 0), [user]);
  const { track: trackView } = useRecentlyViewed();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const u = await api.getUserById(userId);
        if (!mounted) return;
        setUser(u);
        if (u) {
          trackView({ id: u.userId, type: 'user', title: userName(u), subtitle: u.headline, avatarUrl: u.avatarUrl });
          api.getIdeasByOwnerId(u.userId).then((d) => mounted && setIdeas(d || [])).catch(() => {});
          api.getIdeasByCollaboratorId(u.userId).then((d) => mounted && setCollabIdeas(d || [])).catch(() => {});
          api.getUserAchievements(u.userId).then((a) => mounted && setAchievements(a || [])).catch(() => {});
        }
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userId]);

  const handleConnect = async () => {
    if (!user) return;
    try {
      await api.sendConnectionRequest(user.userId);
      setIsFollowing(true);
      toast.success(`Connection request sent to ${userName(user)}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send request');
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    try {
      const convo = await api.startConversation(user.userId);
      setPage('chat', convo.conversationId || (convo as any).id);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to start chat');
    }
  };

  if (loading) {
    return (
      <div className="container max-w-5xl py-8 px-4 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <NotFound setPage={setPage} message="This profile was deleted or never existed." />;
  }

  const name = userName(user);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="container max-w-5xl pb-12">
        {/* COVER */}
        <div className="relative h-48 md:h-64 -mx-4 md:mx-0 md:rounded-b-3xl overflow-hidden mb-16 md:mb-20">
          {user.coverImageUrl ? (
            <img src={user.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 relative">
              <div className="absolute inset-0 bg-mesh opacity-40 mix-blend-overlay" />
              <div className="absolute inset-0 bg-dots opacity-20 mix-blend-overlay" />
            </div>
          )}
          {/* Avatar overlay */}
          <div className="absolute -bottom-12 md:-bottom-14 left-4 md:left-8 ring-4 ring-background rounded-full">
            <Avatar src={user.avatarUrl} name={name} size="2xl" />
          </div>
          {isOwn && (
            <div className="absolute top-4 right-4">
              <Button variant="glass" size="sm" onClick={() => setPage('settings')}>Edit profile</Button>
            </div>
          )}
        </div>

        <div className="px-4 md:px-8">
          {/* Identity row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-space-grotesk">{name}</h1>
                {user.isVerified && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {user.isPremium && <Badge variant="gradient" size="sm">Premium</Badge>}
                {user.userType && <Badge variant="soft" size="sm" className="capitalize">{user.userType}</Badge>}
              </div>
              {user.headline && <p className="text-base text-foreground/80">{user.headline}</p>}
              {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {user.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {user.location}</span>}
                {user.websiteUrl && <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Globe className="h-3.5 w-3.5" /> Website</a>}
                {user.linkedInUrl && <a href={user.linkedInUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Briefcase className="h-3.5 w-3.5" /> LinkedIn</a>}
                {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Code2 className="h-3.5 w-3.5" /> GitHub</a>}
                {user.twitterUrl && <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><AtSign className="h-3.5 w-3.5" /> Twitter</a>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {!isOwn && currentUser && (
                <>
                  <Button
                    variant={isFollowing ? 'outline' : 'gradient'}
                    leftIcon={isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    onClick={handleConnect}
                  >
                    {isFollowing ? 'Connected' : 'Connect'}
                  </Button>
                  <Button variant="outline" leftIcon={<MessageSquare className="h-4 w-4" />} onClick={handleMessage}>
                    Message
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem destructive onClick={() => setShowReport(true)}>
                        <Flag className="h-4 w-4" /> Report user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <Tooltip content="Share profile QR">
                <Button variant="ghost" size="icon" onClick={() => setShowQR(true)} aria-label="Show QR code">
                  <QrCode className="h-4 w-4" />
                </Button>
              </Tooltip>
              {isOwn && (
                <Button variant="outline" onClick={() => setPage('settings')}>Edit profile</Button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Ideas" value={ideas.length} icon={<Lightbulb className="h-4 w-4" />} onClick={() => {}} />
            <Stat label="Collaborations" value={collabIdeas.length} icon={<Sparkles className="h-4 w-4" />} onClick={() => {}} />
            <Stat label="Connections" value={user.connections?.length ?? 0} icon={<UserPlus className="h-4 w-4" />} onClick={() => isOwn && setPage('connections')} />
            <Stat label="Achievements" value={achievements.filter((a) => a.unlockedAt || a.unlocked_at).length} icon={<Trophy className="h-4 w-4" />} />
          </div>

          {/* Streak (own only) */}
          {isOwn && (
            <div className="mt-6">
              <StreakBadge variant="full" />
            </div>
          )}

          {/* Profile completion (own only) */}
          {isOwn && completion < 100 && (
            <Card className="mt-6 border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">Complete your profile</p>
                    <p className="text-xs text-muted-foreground">A complete profile gets 3× more collaboration requests</p>
                  </div>
                  <span className="text-2xl font-bold text-gradient">{completion}%</span>
                </div>
                <Progress value={completion} gradient className="h-2 mb-3" />
                <Button variant="ghost" size="sm" onClick={() => setPage('settings')}>Finish setup →</Button>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {user.bio && (
            <Card className="mt-6">
              <CardContent className="p-5">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="ideas" className="mt-6">
            <TabsList variant="underline" className="mb-4">
              <TabsTrigger variant="underline" value="ideas">
                Ideas {ideas.length > 0 && <Badge variant="ghost" size="sm" className="ml-2">{ideas.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger variant="underline" value="collabs">
                Collaborations {collabIdeas.length > 0 && <Badge variant="ghost" size="sm" className="ml-2">{collabIdeas.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger variant="underline" value="skills">Skills</TabsTrigger>
              <TabsTrigger variant="underline" value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="ideas" className="space-y-4">
              {ideas.length > 0 ? (
                ideas.map((i) => <IdeaCard key={i.ideaId} idea={i} setPage={setPage} />)
              ) : (
                <EmptyState
                  icon={<Lightbulb className="h-8 w-8" />}
                  title={isOwn ? "You haven't shared an idea yet" : `${name} hasn't shared an idea yet`}
                  action={isOwn ? { label: 'Share your first idea', onClick: () => setPage('newIdea'), icon: <Plus className="h-4 w-4" /> } : undefined}
                />
              )}
            </TabsContent>

            <TabsContent value="collabs" className="space-y-4">
              {collabIdeas.length > 0 ? (
                collabIdeas.map((i) => <IdeaCard key={i.ideaId} idea={i} setPage={setPage} />)
              ) : (
                <EmptyState icon={<Sparkles className="h-8 w-8" />} title="No collaborations yet" />
              )}
            </TabsContent>

            <TabsContent value="skills">
              {(user.skills?.length ?? 0) > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {user.skills!.map((skill) => (
                    <SkillTile
                      key={skill.skillName}
                      skill={skill}
                      currentUser={currentUser}
                      isOwn={isOwn}
                      onEndorse={async () => {
                        if (!currentUser) return;
                        try {
                          await api.endorseSkill(user.userId, skill.skillName);
                          toast.success(`Endorsed ${skill.skillName}`);
                        } catch (e: any) {
                          toast.error(e?.message ?? 'Failed to endorse');
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No skills listed"
                  description={isOwn ? 'Add skills so others can find you.' : ''}
                  action={isOwn ? { label: 'Add skills', onClick: () => setPage('settings') } : undefined}
                />
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.values(ACHIEVEMENTS).map((ach) => {
                  if (!ach) return null;
                  const unlocked = achievements.find(
                    (a) => (a.achievementId === ach.id || a.achievement_id === ach.id) && !!(a.unlockedAt || a.unlocked_at)
                  );
                  return <AchievementTile key={ach.id} achievement={ach} unlocked={!!unlocked} />;
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showReport && currentUser && user && (
        <ReportModal
          contentType="user"
          contentId={user.userId}
          contentTitle={name}
          currentUser={currentUser}
          onClose={() => setShowReport(false)}
          onSubmit={(reason, details) => {
            api.submitReport({ contentType: 'user', contentId: user.userId, reason, details })
              .then(() => { setShowReport(false); toast.success('Report submitted'); })
              .catch((e) => toast.error(e?.message ?? 'Failed to submit report'));
          }}
        />
      )}

      {user && <ProfileQRModal open={showQR} onOpenChange={setShowQR} user={user} />}
    </motion.div>
  );
};

function Stat({ label, value, icon, onClick }: { label: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'surface p-4 text-left transition-all',
        onClick && 'hover:border-primary/40 cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
        {icon}{label}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{compactNumber(value)}</p>
    </Comp>
  );
}

function SkillTile({
  skill,
  currentUser,
  isOwn,
  onEndorse,
}: {
  skill: SkillEndorsement;
  currentUser: User | null;
  isOwn: boolean;
  onEndorse: () => void;
}) {
  const endorsers = skill.endorsers || [];
  const hasEndorsed = !!currentUser && endorsers.includes(currentUser.userId);

  return (
    <div className="surface p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-sm">{skill.skillName}</p>
        <p className="text-xs text-muted-foreground">
          {endorsers.length > 0 ? `${endorsers.length} endorsement${endorsers.length === 1 ? '' : 's'}` : 'No endorsements yet'}
        </p>
      </div>
      {!isOwn && currentUser && (
        <Tooltip content={hasEndorsed ? 'Retract endorsement' : 'Endorse'}>
          <Button
            variant={hasEndorsed ? 'gradient' : 'outline'}
            size="icon-sm"
            onClick={onEndorse}
            aria-label="Endorse skill"
          >
            <Plus className={cn('h-4 w-4 transition-transform', hasEndorsed && 'rotate-45')} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

function AchievementTile({ achievement, unlocked }: { achievement: any; unlocked: boolean }) {
  return (
    <Tooltip content={achievement.description}>
      <div
        className={cn(
          'surface p-4 text-center transition-all',
          unlocked ? 'border-primary/40' : 'opacity-50 grayscale'
        )}
      >
        <div
          className={cn(
            'mx-auto h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-2',
            unlocked
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-glow-sm'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {unlocked ? '🏆' : '🔒'}
        </div>
        <p className="text-xs font-semibold truncate">{achievement.name}</p>
        {unlocked && <p className="text-[10px] text-success mt-0.5">Unlocked</p>}
      </div>
    </Tooltip>
  );
}

// Silence eslint for unused initials/import patterns kept for future
export const __initialsRef = initials;
