import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Page } from '../types';
import api from '../services/backendApiService';
import { MessageSquare, Users, Search, X, UserPlus } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { userName, truncate } from '../utils/format';
import { useDebounce } from '../hooks/useDebounce';

interface ConnectionsProps {
  userId: string;
  setPage: (page: Page, id?: string) => void;
}

export const Connections: React.FC<ConnectionsProps> = ({ userId, setPage }) => {
  const [connections, setConnections] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userData = await api.getUserById(userId);
        if (!isMountedRef.current) return;
        if (userData?.connections && userData.connections.length > 0) {
          const details = await Promise.all(userData.connections.map((id) => api.getUserById(id)));
          if (!isMountedRef.current) return;
          setConnections(details.filter((u): u is User => u !== null));
        } else {
          setConnections([]);
        }
      } catch (err: any) {
        if (isMountedRef.current) setError(err?.message ?? 'Could not load connections.');
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return connections;
    const q = debouncedQuery.toLowerCase();
    return connections.filter(
      (u) =>
        userName(u).toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q) ||
        (u.headline || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
    );
  }, [connections, debouncedQuery]);

  const handleStartChat = async (otherUserId: string) => {
    try {
      const conversation = await api.startConversation(otherUserId);
      setPage('chat', conversation.conversationId || (conversation as any).id);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not start chat');
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading your connections…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-10">
        <EmptyState title="Couldn't load connections" description={error} action={{ label: 'Retry', onClick: () => window.location.reload() }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Connections</h1>
              <Badge variant="soft" size="sm">{connections.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Your network on Synapse.</p>
          </div>
          <Button variant="outline" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setPage('explore')}>
            Find more
          </Button>
        </header>

        {connections.length > 0 && (
          <Input
            placeholder="Search your connections…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={query && <button onClick={() => setQuery('')}><X className="h-4 w-4 hover:text-foreground" /></button>}
            className="mb-5"
          />
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={debouncedQuery ? 'No matches' : 'No connections yet'}
            description={debouncedQuery ? 'Try a different name or keyword.' : 'Connect with other thinkers, doers, and investors to grow your network.'}
            action={!debouncedQuery ? { label: 'Find people', onClick: () => setPage('explore') } : { label: 'Clear search', onClick: () => setQuery('') }}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
          >
            {filtered.map((u) => (
              <motion.div key={u.userId} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                <Card interactive className="h-full">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <button onClick={() => setPage('profile', u.userId)} className="rounded-full focus-ring">
                      <Avatar src={u.avatarUrl} name={userName(u)} size="lg" />
                    </button>
                    <h3 className="font-semibold mt-3 truncate w-full">{userName(u)}</h3>
                    {u.headline && <p className="text-xs text-muted-foreground truncate w-full">{u.headline}</p>}
                    {u.bio && (
                      <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 min-h-[2.4em]">{truncate(u.bio, 80)}</p>
                    )}
                    <div className="mt-4 w-full grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" leftIcon={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => handleStartChat(u.userId)}>
                        Message
                      </Button>
                      <Button size="sm" variant="gradient" onClick={() => setPage('profile', u.userId)}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
