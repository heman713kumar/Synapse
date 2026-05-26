import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Idea, User, Page, Comment, AchievementId } from '../types';
import api from '../services/backendApiService';
import { PROGRESS_STAGES } from '../constants';
import {
  ArrowLeft, MessageSquare, Heart, Bookmark, Share2, BarChart3,
  Layout, KanbanSquare, Sparkles, Flag, Send, Edit3, ExternalLink, MapPin, Briefcase, Copy as CopyIcon,
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Textarea } from './ui/Textarea';
import { Tooltip } from './ui/Tooltip';
import { Skeleton, SkeletonText } from './ui/Skeleton';
import { Reactions } from './Reactions';
import { toast } from './ui/Toaster';
import { ReportModal } from './ReportModal';
import { SmartCollaboratorMatch } from './SmartCollaboratorMatch';
import { ShareDialog } from './ShareDialog';
import { PitchDeckModal } from './PitchDeckModal';
import { NotFound } from './NotFound';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { timeAgo, userName, compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface IdeaDetailProps {
  ideaId: string;
  currentUser: User | null;
  isGuest: boolean;
  setPage: (page: Page, id?: string) => void;
  onAchievementsUnlock: (ids: AchievementId[]) => void;
  onGuestAction: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  'idea-stage': 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
  'team-building': 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
  'in-development': 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  launched: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
};

export const IdeaDetail: React.FC<IdeaDetailProps> = ({
  ideaId, currentUser, isGuest, setPage, onAchievementsUnlock: _onAchievementsUnlock, onGuestAction,
}) => {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const { track: trackView } = useRecentlyViewed();

  const requireAuth = useCallback(() => {
    if (isGuest || !currentUser) {
      onGuestAction();
      return false;
    }
    return true;
  }, [isGuest, currentUser, onGuestAction]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const ideaData = await api.getIdeaById(ideaId);
        if (!mounted) return;
        setIdea(ideaData);
        setLikeCount(ideaData.likesCount ?? 0);
        trackView({ id: ideaData.ideaId, type: 'idea', title: ideaData.title, subtitle: ideaData.summary });
        if (ideaData.ownerId) {
          api.getUserById(ideaData.ownerId).then((u) => mounted && setOwner(u)).catch(() => {});
        }
        api.getCommentsByIdeaId(ideaId).then((c) => mounted && setComments(c || [])).catch(() => {});
      } catch (e: any) {
        console.error('Failed to load idea:', e);
        toast.error(e?.message ?? 'Failed to load idea');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [ideaId]);

  const handleLike = () => {
    if (!requireAuth()) return;
    setLiked((p) => {
      setLikeCount((c) => (p ? c - 1 : c + 1));
      return !p;
    });
    api.castVote(ideaId, liked ? 'down' : 'up').catch(() => {});
  };

  const handleBookmark = () => {
    if (!requireAuth()) return;
    setBookmarked((b) => {
      toast.success(b ? 'Removed from bookmarks' : 'Saved to bookmarks');
      return !b;
    });
  };

  const handleShare = () => setShowShare(true);

  const handlePostComment = async () => {
    if (!requireAuth() || !newComment.trim()) return;
    setPosting(true);
    try {
      const c = await api.postComment(ideaId, newComment.trim());
      setComments((prev) => [c, ...prev]);
      setNewComment('');
      toast.success('Comment posted');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleRequestCollab = () => {
    if (!requireAuth()) return;
    api
      .submitCollaborationRequest({
        ideaId,
        skills: currentUser?.skills?.map((s) => s.skillName).join(', ') ?? '',
        contribution: 'I would love to help with this idea.',
        motivation: 'Interested in your problem space.',
      })
      .then(() => toast.success('Collaboration request sent!'))
      .catch((e) => toast.error(e?.message ?? 'Failed to send request'));
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-3/4 mb-4" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (!idea) {
    return <NotFound setPage={setPage} message="This idea was deleted, set to private, or never existed." />;
  }

  const isOwner = currentUser?.userId === idea.ownerId;
  const canAccessForum = isOwner || (!!currentUser && (idea.forumMembers || []).includes(currentUser.userId));
  const stageBadgeClass = idea.progressStage ? STAGE_COLORS[idea.progressStage] : STAGE_COLORS['idea-stage'];
  const stageName = PROGRESS_STAGES.find((s) => s.id === idea.progressStage)?.name ?? 'Idea Stage';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="container max-w-5xl py-6 px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')}>
            Back
          </Button>
          <div className="flex items-center gap-1">
            <Tooltip content="Share"><Button variant="ghost" size="icon-sm" onClick={handleShare}><Share2 className="h-4 w-4" /></Button></Tooltip>
            <Tooltip content={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
              <Button variant="ghost" size="icon-sm" onClick={handleBookmark}>
                <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current text-primary')} />
              </Button>
            </Tooltip>
            {!isOwner && (
              <Tooltip content="Report"><Button variant="ghost" size="icon-sm" onClick={() => setShowReport(true)}><Flag className="h-4 w-4" /></Button></Tooltip>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => owner && setPage('profile', owner.userId)} className="rounded-full focus-ring" disabled={!owner}>
                    <Avatar src={owner?.avatarUrl} name={userName(owner)} size="md" />
                  </button>
                  <div>
                    <button onClick={() => owner && setPage('profile', owner.userId)} className="text-sm font-semibold hover:text-primary transition-colors">
                      {userName(owner)}
                    </button>
                    <p className="text-xs text-muted-foreground">{timeAgo(idea.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={cn('inline-flex items-center text-[11px] font-semibold rounded-full border px-2 py-0.5', stageBadgeClass)}>
                      {stageName}
                    </span>
                    {isOwner && (
                      <Button variant="outline" size="sm" leftIcon={<Edit3 className="h-3.5 w-3.5" />}>Edit</Button>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-space-grotesk leading-tight">{idea.title}</h1>
                {idea.summary && (
                  <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{idea.summary}</p>
                )}

                {(idea.tags?.length ?? 0) > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {idea.tags!.map((t) => <Badge key={t} variant="soft" size="sm">#{t}</Badge>)}
                  </div>
                )}

                {/* Meta row */}
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {idea.sector && <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {idea.sector}</span>}
                  {idea.region && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {idea.region}</span>}
                </div>

                {/* Stage tracker */}
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 uppercase font-semibold tracking-wider">
                    {PROGRESS_STAGES.map((s) => (
                      <span key={s.id} className={cn(s.id === (idea.progressStage || 'idea-stage') && 'text-primary')}>{s.name}</span>
                    ))}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((PROGRESS_STAGES.findIndex(s => s.id === (idea.progressStage || 'idea-stage')) + 1) / PROGRESS_STAGES.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Action bar */}
                <div className="mt-6 pt-5 border-t border-border flex items-center gap-2 flex-wrap">
                  <Button variant={liked ? 'default' : 'outline'} size="sm" onClick={handleLike} leftIcon={<Heart className={cn('h-4 w-4', liked && 'fill-current')} />}>
                    {compactNumber(likeCount)}
                  </Button>
                  <Reactions size="sm" layout="picker-only" onReact={(e) => toast(`Reacted with ${e}`)} />
                  {!isOwner && currentUser && (
                    <Button variant="gradient" size="sm" leftIcon={<Sparkles className="h-4 w-4" />} onClick={handleRequestCollab}>
                      Request to collaborate
                    </Button>
                  )}
                  <Button variant="outline" size="sm" leftIcon={<Sparkles className="h-4 w-4" />} onClick={() => setShowPitchDeck(true)}>
                    Pitch deck
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<CopyIcon className="h-4 w-4" />}
                    onClick={() => {
                      // Seed NewIdeaForm draft with this idea's content as a remix
                      const draft = {
                        title: `Remix of: ${idea.title}`,
                        summary: idea.summary ?? '',
                        description: `${idea.description ?? ''}\n\n— Originally inspired by "${idea.title}" by ${userName(owner)}`,
                        sector: idea.sector ?? '',
                        region: idea.region ?? '',
                        tags: [...(idea.tags ?? []), 'remix'].slice(0, 8),
                        requiredSkills: idea.requiredSkills ?? [],
                      };
                      try { localStorage.setItem('synapse-draft-new-idea', JSON.stringify(draft)); } catch {}
                      toast.success('Remix draft ready — open New idea');
                      setPage('newIdea');
                    }}
                  >
                    Remix
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description (full) */}
            {idea.description && idea.description !== idea.summary && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">About this idea</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                    {idea.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs: Comments / Activity */}
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="comments">
                  <TabsList variant="underline" className="px-4">
                    <TabsTrigger variant="underline" value="comments" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                      {comments.length > 0 && <Badge variant="soft" size="sm">{comments.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger variant="underline" value="activity">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comments" className="p-4 space-y-4 mt-0">
                    {/* Composer */}
                    {currentUser && !isGuest ? (
                      <div className="flex gap-3">
                        <Avatar src={currentUser.avatarUrl} name={userName(currentUser)} size="sm" />
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Add your thoughts…"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            autoResize
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={handlePostComment}
                              loading={posting}
                              disabled={!newComment.trim()}
                              rightIcon={<Send className="h-3.5 w-3.5" />}
                            >
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Button variant="outline" onClick={onGuestAction}>Sign in to comment</Button>
                      </div>
                    )}

                    {comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((c) => <CommentItem key={c.commentId || c.id} comment={c} setPage={setPage} />)}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">No comments yet. Be the first!</p>
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="p-6 mt-0">
                    <p className="text-sm text-muted-foreground text-center">Activity feed coming soon.</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Workspace</h3>
                <div className="grid gap-2">
                  <SidebarLink icon={<MessageSquare className="h-4 w-4" />} label="Discussion forum" onClick={() => canAccessForum ? setPage('forum', ideaId) : toast('Only members can access the forum', { icon: '🔒' })} disabled={!canAccessForum} />
                  <SidebarLink icon={<Layout className="h-4 w-4" />} label="Idea board" onClick={() => isOwner ? setPage('ideaBoard', ideaId) : toast('Only the owner can edit the board', { icon: '🔒' })} disabled={!isOwner} />
                  <SidebarLink icon={<KanbanSquare className="h-4 w-4" />} label="Kanban tasks" onClick={() => isOwner ? setPage('kanban', ideaId) : toast('Owner only', { icon: '🔒' })} disabled={!isOwner} />
                  <SidebarLink icon={<BarChart3 className="h-4 w-4" />} label="Analytics" onClick={() => isOwner ? setPage('analytics', ideaId) : toast('Owner only', { icon: '🔒' })} disabled={!isOwner} />
                </div>
              </CardContent>
            </Card>

            {(idea.requiredSkills?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Looking for</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.requiredSkills!.map((s) => <Badge key={s} variant="gradient" size="sm">{s}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Smart collaborator matches */}
            {!isOwner && (idea.requiredSkills?.length ?? 0) > 0 && (
              <SmartCollaboratorMatch idea={idea} currentUser={currentUser} setPage={setPage} compact />
            )}

            {(idea.collaborators?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Collaborators</h3>
                    <span className="text-xs text-muted-foreground">{idea.collaborators!.length}</span>
                  </div>
                  <div className="flex -space-x-2">
                    {idea.collaborators!.slice(0, 6).map((id) => <CollabAvatar key={id} userId={id} setPage={setPage} />)}
                  </div>
                </CardContent>
              </Card>
            )}

            {owner && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Idea by</h3>
                  <div className="flex items-center gap-3">
                    <Avatar src={owner.avatarUrl} name={userName(owner)} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{userName(owner)}</p>
                      {owner.headline && <p className="text-xs text-muted-foreground truncate">{owner.headline}</p>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" fullWidth className="mt-3" rightIcon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => setPage('profile', owner.userId)}>
                    View profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showReport && currentUser && (
        <ReportModal
          contentType="idea"
          contentId={ideaId}
          contentTitle={idea.title}
          currentUser={currentUser}
          onClose={() => setShowReport(false)}
          onSubmit={(reason, details) => {
            api.submitReport({ contentType: 'idea', contentId: ideaId, reason, details })
              .then(() => { setShowReport(false); toast.success('Report submitted'); })
              .catch((e) => toast.error(e?.message ?? 'Failed to submit report'));
          }}
        />
      )}

      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={idea.title}
        description={idea.summary}
        url={`${window.location.pathname}#/idea/${ideaId}`}
      />

      <PitchDeckModal open={showPitchDeck} onOpenChange={setShowPitchDeck} idea={idea} />
    </motion.div>
  );
};

function SidebarLink({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
        disabled
          ? 'text-muted-foreground/60 cursor-pointer hover:bg-secondary/40'
          : 'hover:bg-secondary text-foreground'
      )}
    >
      <span className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span>{label}</span>
      <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">→</span>
    </button>
  );
}

function CollabAvatar({ userId, setPage }: { userId: string; setPage: (p: Page, id?: string) => void }) {
  const [u, setU] = useState<User | null>(null);
  useEffect(() => { api.getUserById(userId).then(setU).catch(() => {}); }, [userId]);
  return (
    <Tooltip content={userName(u)}>
      <button onClick={() => u && setPage('profile', u.userId)} className="ring-2 ring-background rounded-full focus-ring">
        <Avatar src={u?.avatarUrl} name={userName(u)} size="sm" />
      </button>
    </Tooltip>
  );
}

function CommentItem({ comment, setPage }: { comment: Comment; setPage: (p: Page, id?: string) => void }) {
  const [author, setAuthor] = useState<User | null>(null);
  useEffect(() => { if (comment.userId) api.getUserById(comment.userId).then(setAuthor).catch(() => {}); }, [comment.userId]);

  return (
    <div className="flex gap-3 group">
      <button onClick={() => author && setPage('profile', author.userId)} className="shrink-0 rounded-full focus-ring">
        <Avatar src={author?.avatarUrl} name={userName(author)} size="sm" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <button onClick={() => author && setPage('profile', author.userId)} className="font-semibold text-sm hover:text-primary transition-colors">
            {userName(author)}
          </button>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt || comment.created_at)}</span>
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
      </div>
    </div>
  );
}
