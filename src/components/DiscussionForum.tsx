import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea, User, ForumMessage, Page } from '../types';
import api from '../services/backendApiService';
import {
  Send, UserPlus, UserMinus, Pin, Trash2, ArrowLeft, Users, Crown, MoreVertical,
  MessageSquare,
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { Tooltip } from './ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/DropdownMenu';
import { toast } from './ui/Toaster';
import { smartTime, userName, timeAgo } from '../utils/format';

interface DiscussionForumProps {
  ideaId: string;
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

const MemberList: React.FC<{
  idea: Idea;
  members: User[];
  currentUser: User;
  onAddMember: (id: string) => void;
  onRemoveMember: (id: string, name: string) => void;
  setPage: (page: Page, id?: string) => void;
}> = ({ idea, members, currentUser, onAddMember, onRemoveMember, setPage }) => {
  const [addUserId, setAddUserId] = useState('');
  const isOwner = currentUser.userId === idea.ownerId;

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex flex-col flex-1 min-h-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Members <Badge variant="ghost" size="sm">{members.length}</Badge>
        </h3>
        <ul className="space-y-1 overflow-y-auto scrollbar-thin pr-1 flex-1 -mr-1">
          {members.map((m) => (
            <li key={m.userId} className="group flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-secondary/50 transition-colors">
              <button onClick={() => setPage('profile', m.userId)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <Avatar src={m.avatarUrl} name={userName(m)} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userName(m)}</p>
                  {m.userId === idea.ownerId && (
                    <span className="text-[10px] text-primary flex items-center gap-0.5"><Crown className="h-2.5 w-2.5" /> Owner</span>
                  )}
                </div>
              </button>
              {isOwner && m.userId !== currentUser.userId && (
                <Tooltip content="Remove">
                  <button
                    onClick={() => onRemoveMember(m.userId, userName(m))}
                    className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
        {isOwner && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex gap-2">
              <Input
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                placeholder="User ID"
                className="text-sm h-8"
              />
              <Button
                size="icon-sm"
                onClick={() => { if (addUserId.trim()) { onAddMember(addUserId.trim()); setAddUserId(''); } }}
                disabled={!addUserId.trim()}
                aria-label="Add member"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MessageRow: React.FC<{
  msg: ForumMessage;
  sender?: User;
  currentUser: User;
  isOwner: boolean;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  setPage: (p: Page, id?: string) => void;
}> = ({ msg, sender, currentUser, isOwner, onPin, onDelete, setPage }) => {
  const canDelete = isOwner || msg.senderId === currentUser.userId;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group flex gap-3 p-3 hover:bg-secondary/40 rounded-lg transition-colors">
      <button onClick={() => sender && setPage('profile', sender.userId)} className="shrink-0 rounded-full focus-ring">
        <Avatar src={sender?.avatarUrl} name={userName(sender)} size="sm" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <button onClick={() => sender && setPage('profile', sender.userId)} className="text-sm font-semibold hover:text-primary transition-colors">
            {userName(sender)}
          </button>
          <span className="text-xs text-muted-foreground">{smartTime(msg.createdAt)}</span>
          {msg.isPinned && <Badge variant="warning" size="sm"><Pin className="h-2.5 w-2.5" /> Pinned</Badge>}
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
      </div>
      {(isOwner || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary self-start transition-opacity">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem onClick={() => onPin(msg.messageId)}>
                <Pin className="h-4 w-4" /> {msg.isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem destructive onClick={() => onDelete(msg.messageId)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
};

export const DiscussionForum: React.FC<DiscussionForumProps> = ({ ideaId, currentUser, setPage }) => {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOwner = !!idea && idea.ownerId === currentUser.userId;

  const fetchAll = useCallback(async () => {
    try {
      const [ideaData, msgData] = await Promise.all([
        api.getIdeaById(ideaId),
        api.getForumMessages(ideaId),
      ]);
      setIdea(ideaData);
      setMessages(msgData || []);
      const memberIds = ideaData.forumMembers || [];
      if (memberIds.length > 0) {
        const memberDetails = await Promise.all(memberIds.map((id) => api.getUserById(id)));
        const valid = memberDetails.filter((u): u is User => u !== null);
        setMembers(valid);
        const map: Record<string, User> = {};
        valid.forEach((u) => { map[u.userId] = u; });
        setParticipants(map);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load forum');
    } finally {
      setIsLoading(false);
    }
  }, [ideaId]);

  useEffect(() => { setIsLoading(true); fetchAll(); }, [fetchAll]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage.trim();
    setSending(true);
    try {
      const sent = await api.postForumMessage(ideaId, text);
      setMessages((p) => [...p, sent]);
      setNewMessage('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to send');
    } finally { setSending(false); }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await api.addForumMember(ideaId, userId);
      toast.success('Member added');
      fetchAll();
    } catch (e: any) { toast.error(e?.message ?? 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    try {
      await api.removeForumMember(ideaId, userId);
      toast.success(`Removed ${name}`);
      fetchAll();
    } catch (e: any) { toast.error(e?.message ?? 'Failed to remove'); }
  };

  const handlePin = async (messageId: string) => {
    try {
      await api.pinForumMessage(messageId);
      setMessages((p) => p.map((m) => m.messageId === messageId ? { ...m, isPinned: !m.isPinned } : m));
    } catch (e: any) { toast.error(e?.message ?? 'Failed to pin'); }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await api.deleteForumMessage(messageId);
      setMessages((p) => p.filter((m) => m.messageId !== messageId));
      toast.success('Message deleted');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to delete'); }
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!idea) {
    return (
      <div className="h-screen flex items-center justify-center">
        <EmptyState title="Forum not found" action={{ label: 'Back to feed', onClick: () => setPage('feed') }} />
      </div>
    );
  }

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const regularMessages = messages.filter((m) => !m.isPinned);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong border-b border-border sticky top-0 z-30">
        <div className="container max-w-6xl flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => setPage('ideaDetail', ideaId)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Forum</p>
              <h1 className="text-base font-semibold truncate">{idea.title}</h1>
            </div>
          </div>
          <Badge variant="soft" size="sm" className="shrink-0">
            <Users className="h-3 w-3" /> {members.length}
          </Badge>
        </div>
      </header>

      <div className="container max-w-6xl py-4 px-4">
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          {/* Messages */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 flex flex-col h-[calc(100vh-180px)]">
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
                <AnimatePresence>
                  {pinnedMessages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-[10px] uppercase tracking-wider text-warning font-semibold px-2 py-1">
                        Pinned ({pinnedMessages.length})
                      </p>
                      <div className="space-y-1 mb-3">
                        {pinnedMessages.map((m) => (
                          <MessageRow
                            key={m.messageId}
                            msg={m}
                            sender={participants[m.senderId]}
                            currentUser={currentUser}
                            isOwner={isOwner}
                            onPin={handlePin}
                            onDelete={handleDelete}
                            setPage={setPage}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-8 w-8" />}
                    title="No discussion yet"
                    description="Start the conversation — share an update, ask a question, or rally collaborators."
                    size="sm"
                  />
                ) : (
                  <div className="space-y-1">
                    {regularMessages.map((m) => (
                      <MessageRow
                        key={m.messageId}
                        msg={m}
                        sender={participants[m.senderId]}
                        currentUser={currentUser}
                        isOwner={isOwner}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        setPage={setPage}
                      />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-border p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-end">
                  <Avatar src={currentUser.avatarUrl} name={userName(currentUser)} size="sm" />
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Share an update or ask a question…"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-ring max-h-32 scrollbar-thin"
                  />
                  <Button type="submit" variant="gradient" size="icon" disabled={!newMessage.trim() || sending} loading={sending}>
                    {!sending && <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Member list */}
          <div className="hidden lg:block">
            <MemberList
              idea={idea}
              members={members}
              currentUser={currentUser}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              setPage={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Suppress unused warning
export const __timeAgo = timeAgo;
