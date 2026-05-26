import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Message, Conversation, Page } from '../types';
import api from '../services/backendApiService';
import { Send, Paperclip, Smile, X, ArrowLeft, MoreVertical, Phone, Video, Reply } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { Tooltip } from './ui/Tooltip';
import { toast } from './ui/Toaster';
import { Reactions } from './Reactions';
import { smartTime, userName } from '../utils/format';
import { cn } from '../utils/cn';
import { NotFound } from './NotFound';

interface ChatProps {
  conversationId: string;
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

const MessageBubble: React.FC<{
  message: Message;
  sender: User | undefined;
  currentUser: User;
  isCurrentUser: boolean;
  participants: Record<string, User>;
  showAvatar: boolean;
  showTime: boolean;
  onReply: (m: Message) => void;
  allMessages: Message[];
}> = ({ message, sender, currentUser: _currentUser, isCurrentUser, participants, showAvatar, showTime, onReply, allMessages }) => {
  const originalMessage = message.replyToMessageId
    ? allMessages.find((m) => (m.messageId || m.id) === message.replyToMessageId)
    : undefined;
  const originalSender = originalMessage ? participants[originalMessage.senderId || (originalMessage as any).sender_id] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn('flex group', isCurrentUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('flex items-end gap-2 max-w-[80%] sm:max-w-md', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}>
        {!isCurrentUser && (
          <div className="w-8 shrink-0">
            {showAvatar && <Avatar src={sender?.avatarUrl} name={userName(sender)} size="sm" />}
          </div>
        )}
        <div className={cn('flex flex-col gap-0.5', isCurrentUser ? 'items-end' : 'items-start')}>
          {showAvatar && !isCurrentUser && sender && (
            <span className="text-[11px] text-muted-foreground ml-2 font-medium">{userName(sender)}</span>
          )}
          <div className="relative">
            <div
              className={cn(
                'px-4 py-2 rounded-2xl text-sm break-words shadow-sm relative',
                isCurrentUser
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md'
                  : 'bg-secondary text-foreground rounded-bl-md'
              )}
            >
              {originalMessage && (
                <div className={cn(
                  'mb-1.5 -mt-0.5 px-2 py-1.5 rounded-lg border-l-2 text-xs',
                  isCurrentUser ? 'bg-white/10 border-white/60 text-white/90' : 'bg-background/60 border-primary text-foreground/80'
                )}>
                  <p className="font-semibold opacity-80">
                    {originalSender ? userName(originalSender) : 'You'}
                  </p>
                  <p className="truncate opacity-80">{originalMessage.text || originalMessage.content || 'Media'}</p>
                </div>
              )}
              {message.text && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
              {!message.text && message.content && <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>}
              {message.media && (
                <div className="mt-2">
                  {message.media.type === 'image' ? (
                    <img src={message.media.url} alt="" className="max-w-full h-auto rounded-lg" />
                  ) : (
                    <a href={message.media.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline">
                      <Paperclip className="h-3 w-3" />{message.media.fileName}
                    </a>
                  )}
                </div>
              )}
            </div>
            {/* Hover actions */}
            <div className={cn(
              'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-popover border border-border rounded-full shadow-md p-0.5',
              isCurrentUser ? 'right-full mr-2' : 'left-full ml-2'
            )}>
              <Reactions size="sm" layout="picker-only" onReact={(e) => toast(`Reacted ${e}`)} />
              <Tooltip content="Reply">
                <button
                  onClick={() => onReply(message)}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
          {showTime && (
            <span className={cn('text-[10px] text-muted-foreground px-2', isCurrentUser ? 'text-right' : 'text-left')}>
              {smartTime(message.createdAt || message.created_at)}
              {isCurrentUser && message.isRead && <span className="ml-1 text-primary">✓✓</span>}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const Chat: React.FC<ChatProps> = ({ conversationId, currentUser, setPage }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchChatData = useCallback(async () => {
    setError(null);
    try {
      const [convData, messageData] = await Promise.all([
        api.getConversationById(conversationId),
        api.getMessagesByConversationId(conversationId),
      ]);
      setConversation(convData);
      setMessages(messageData || []);
      if (convData?.participants) {
        const details = await Promise.all(convData.participants.map((id) => api.getUserById(id)));
        const map: Record<string, User> = {};
        details.forEach((u) => { if (u) map[u.userId] = u; });
        setParticipants(map);
        const unread = convData.unreadCount?.[currentUser.userId];
        if (typeof unread === 'number' && unread > 0) {
          api.markMessagesRead(conversationId).catch(() => {});
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load chat. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUser.userId]);

  useEffect(() => { setIsLoading(true); fetchChatData(); }, [fetchChatData]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !conversation || sending) return;
    const text = newMessage.trim();
    setSending(true);
    // Optimistic
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      messageId: tempId,
      conversationId: conversation.conversationId,
      senderId: currentUser.userId,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
      replyToMessageId: replyingTo?.messageId,
    };
    setMessages((p) => [...p, optimistic]);
    setNewMessage('');
    setReplyingTo(null);
    try {
      const sent = await api.sendMessage({
        conversationId: conversation.conversationId,
        text,
        replyToMessageId: replyingTo?.messageId,
      });
      setMessages((p) => p.map((m) => (m.messageId === tempId ? sent : m)));
    } catch {
      toast.error('Failed to send message');
      setMessages((p) => p.filter((m) => m.messageId !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading chat…</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <NotFound
        setPage={setPage}
        message={error ? `Could not load chat: ${error}` : 'This conversation was deleted or you no longer have access.'}
      />
    );
  }

  const otherIds = (conversation.participants || []).filter((id) => id !== currentUser.userId);
  const otherUser = otherIds.length === 1 ? participants[otherIds[0]] : null;
  const chatTitle = conversation.isGroup ? (conversation.groupName || 'Group chat') : userName(otherUser);
  const chatAvatar = conversation.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass-strong border-b border-border px-3 md:px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={() => setPage('inbox')} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={() => otherUser && setPage('profile', otherUser.userId)}
            className="flex items-center gap-3 min-w-0 hover:bg-secondary rounded-lg px-2 py-1 transition-colors"
          >
            <Avatar src={chatAvatar} name={chatTitle} size="sm" status="online" />
            <div className="min-w-0 text-left">
              <p className="font-semibold text-sm truncate">{chatTitle}</p>
              <p className="text-[11px] text-muted-foreground truncate">{otherUser?.headline ?? 'Online'}</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Voice call (coming soon)">
            <Button variant="ghost" size="icon-sm" onClick={() => toast('Voice calls coming soon', { icon: '📞' })}>
              <Phone className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Video call (coming soon)">
            <Button variant="ghost" size="icon-sm" onClick={() => toast('Video calls coming soon', { icon: '📹' })}>
              <Video className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.length === 0 ? (
            <EmptyState
              title="Say hello 👋"
              description="No messages yet — be the first to start the conversation."
              size="sm"
            />
          ) : (
            messages.map((m, i) => {
              const senderId = m.senderId || (m as any).sender_id;
              const isMine = senderId === currentUser.userId;
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const prevSender = prev ? (prev.senderId || (prev as any).sender_id) : null;
              const nextSender = next ? (next.senderId || (next as any).sender_id) : null;
              const showAvatar = !isMine && prevSender !== senderId;
              const showTime = !next || nextSender !== senderId ||
                (new Date(next.createdAt || next.created_at || 0).getTime() - new Date(m.createdAt || m.created_at || 0).getTime() > 5 * 60 * 1000);
              return (
                <MessageBubble
                  key={m.messageId || m.id || `msg-${i}`}
                  message={m}
                  sender={participants[senderId]}
                  currentUser={currentUser}
                  isCurrentUser={isMine}
                  participants={participants}
                  showAvatar={showAvatar || !prev}
                  showTime={showTime}
                  onReply={setReplyingTo}
                  allMessages={messages}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card/40 backdrop-blur p-3 md:p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 rounded-lg border-l-4 border-primary bg-secondary/60 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-primary">Replying to {userName(participants[replyingTo.senderId])}</p>
                    <p className="truncate text-muted-foreground">{replyingTo.text || replyingTo.content || 'Media'}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <Tooltip content="Attach file">
              <Button variant="ghost" size="icon" type="button" onClick={() => toast('File upload coming soon', { icon: '📎' })}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </Tooltip>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-2.5 pr-10 text-sm focus-ring max-h-32 scrollbar-thin"
              />
              <Button variant="ghost" size="icon-sm" type="button" className="absolute right-1.5 bottom-1.5" onClick={() => toast('Emoji picker coming soon', { icon: '😊' })}>
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              variant="gradient"
              size="icon"
              disabled={!newMessage.trim() || sending}
              loading={sending}
              aria-label="Send"
            >
              {!sending && <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
