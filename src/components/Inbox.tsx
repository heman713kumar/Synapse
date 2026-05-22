import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Page, Conversation } from '../types';
import api from '../services/backendApiService';
import { MessageSquare, Inbox as InboxIcon, Search, Check, X } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { toast } from './ui/Toaster';
import { smartTime, userName } from '../utils/format';
import { cn } from '../utils/cn';
import { useDebounce } from '../hooks/useDebounce';
import { triageMessage } from '../utils/inboxTriage';
import { Tooltip } from './ui/Tooltip';

interface InboxProps {
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

const ConversationItem: React.FC<{
  conversation: Conversation;
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}> = ({ conversation, currentUser, setPage }) => {
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const otherUserId = useMemo(() => {
    if (conversation.isGroup || !conversation.participants) return null;
    return conversation.participants.find((p) => p !== currentUser.userId);
  }, [conversation.isGroup, conversation.participants, currentUser.userId]);

  useEffect(() => {
    setIsLoadingUser(true);
    if (otherUserId) {
      api.getUserById(otherUserId)
        .then((user) => { if (isMountedRef.current) setOtherUser(user); })
        .catch(() => {})
        .finally(() => { if (isMountedRef.current) setIsLoadingUser(false); });
    } else {
      setIsLoadingUser(false);
    }
  }, [otherUserId]);

  const isUnread = (conversation.unreadCount?.[currentUser.userId] || 0) > 0;
  const displayName = conversation.isGroup ? (conversation.groupName || 'Group') : userName(otherUser);
  const displayAvatar = conversation.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;
  const lastUpdateTime = conversation.lastUpdatedAt || conversation.lastMessage?.createdAt || '';
  const lastMessageText = conversation.lastMessage?.text || conversation.lastMessage?.content || 'No messages yet';
  const lastMessageSenderId = conversation.lastMessage?.senderId || '';
  const unreadCount = conversation.unreadCount?.[currentUser.userId] || 0;
  const triage = triageMessage(lastMessageText);

  if (isLoadingUser && !conversation.isGroup) {
    return (
      <li className="flex items-center p-4 gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => setPage('chat', conversation.conversationId)}
        className={cn(
          'group w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
          'hover:bg-secondary/50 focus-ring',
          isUnread && 'bg-primary/5'
        )}
      >
        <Avatar src={displayAvatar} name={displayName} size="md" status="online" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={cn('text-sm truncate', isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                {displayName}
              </p>
              {triage.label !== 'message' && (
                <Tooltip content={`Triage: ${triage.text}`}>
                  <span className={cn('shrink-0 inline-flex items-center gap-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 text-white bg-gradient-to-r', triage.color)}>
                    <span aria-hidden>{triage.emoji}</span> {triage.text}
                  </span>
                </Tooltip>
              )}
            </div>
            <span className={cn('text-[11px] shrink-0 tabular-nums', isUnread ? 'text-primary font-semibold' : 'text-muted-foreground')}>
              {smartTime(lastUpdateTime)}
            </span>
          </div>
          <p className={cn('text-xs truncate mt-0.5', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
            {lastMessageSenderId === currentUser.userId && <span className="opacity-70">You: </span>}
            {lastMessageText}
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default" size="sm" className="shrink-0">{unreadCount > 9 ? '9+' : unreadCount}</Badge>
        )}
      </button>
    </li>
  );
};

const RequestItem: React.FC<{
  conversation: Conversation;
  currentUser: User;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}> = ({ conversation, currentUser, onAccept, onDecline }) => {
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const otherUserId = useMemo(() => conversation.participants?.find((p) => p !== currentUser.userId), [conversation.participants, currentUser.userId]);

  useEffect(() => {
    setLoading(true);
    if (otherUserId) {
      api.getUserById(otherUserId)
        .then((u) => isMounted.current && setOtherUser(u))
        .catch(() => {})
        .finally(() => isMounted.current && setLoading(false));
    } else { setLoading(false); }
  }, [otherUserId]);

  if (loading) return <li className="p-4"><Skeleton className="h-20 w-full" /></li>;
  if (!otherUser) return null;

  const msgText = conversation.lastMessage?.text || conversation.lastMessage?.content || '';

  return (
    <li className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar src={otherUser.avatarUrl} name={userName(otherUser)} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{userName(otherUser)}</p>
          {otherUser.headline && <p className="text-xs text-muted-foreground">{otherUser.headline}</p>}
          {msgText && (
            <div className="mt-2 rounded-lg bg-secondary/50 p-3 text-sm italic">"{msgText}"</div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => onDecline(conversation.conversationId)} leftIcon={<X className="h-3.5 w-3.5" />}>
          Decline
        </Button>
        <Button size="sm" variant="gradient" onClick={() => onAccept(conversation.conversationId)} leftIcon={<Check className="h-3.5 w-3.5" />}>
          Accept
        </Button>
      </div>
    </li>
  );
};

export const Inbox: React.FC<InboxProps> = ({ currentUser, setPage }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getConversationsByUserId();
      if (!isMountedRef.current) return;
      const sorted = (data || []).sort((a, b) => {
        const aT = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
        const bT = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
        return bT - aT;
      });
      setConversations(sorted);
    } catch (e: any) {
      if (isMountedRef.current) setError(`Could not load messages: ${e.message || 'Please try again.'}`);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { setIsLoading(true); fetchData(); }, [fetchData]);

  const { acceptedConversations, pendingRequests } = useMemo(() => {
    const accepted = conversations.filter((c) => c.status === 'accepted' || !c.status);
    const pending = conversations.filter((c) => c.status === 'pending' && c.lastMessage?.senderId !== currentUser.userId);
    const filtered = debouncedSearch
      ? accepted.filter((c) => {
          const name = c.isGroup ? c.groupName : c.displayName || c.other_display_name || c.username;
          return name?.toLowerCase().includes(debouncedSearch.toLowerCase());
        })
      : accepted;
    return { acceptedConversations: filtered, pendingRequests: pending };
  }, [conversations, currentUser.userId, debouncedSearch]);

  const handleAcceptRequest = async (id: string) => {
    try {
      await api.acceptMessageRequest(id);
      toast.success('Request accepted');
      fetchData();
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.conversationId !== id));
    toast.success('Request declined');
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-10 flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your messages…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl py-10">
        <EmptyState title="Couldn't load messages" description={error} action={{ label: 'Retry', onClick: fetchData }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-2xl py-6 px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Conversations with collaborators and connections.</p>
        </header>

        <Input
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="mb-4"
        />

        <Tabs defaultValue="inbox">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="inbox" className="gap-2">
              <InboxIcon className="h-4 w-4" /> Inbox
              {acceptedConversations.length > 0 && (
                <Badge variant="ghost" size="sm">{acceptedConversations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger variant="underline" value="requests" className="gap-2">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="default" size="sm">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-2">
            <div className="surface overflow-hidden">
              {acceptedConversations.length > 0 ? (
                <ul className="divide-y divide-border">
                  {acceptedConversations.map((c) => (
                    <ConversationItem key={c.conversationId} conversation={c} currentUser={currentUser} setPage={setPage} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8" />}
                  title={debouncedSearch ? 'No conversations match' : 'Your inbox is empty'}
                  description={debouncedSearch ? 'Try a different search.' : 'Start a conversation with collaborators to build your network.'}
                  action={!debouncedSearch ? { label: 'Find collaborators', onClick: () => setPage('explore') } : undefined}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-2">
            <div className="surface overflow-hidden">
              {pendingRequests.length > 0 ? (
                <ul className="divide-y divide-border">
                  {pendingRequests.map((c) => (
                    <RequestItem key={c.conversationId} conversation={c} currentUser={currentUser} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />
                  ))}
                </ul>
              ) : (
                <EmptyState title="No pending requests" description="You're all caught up." />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
