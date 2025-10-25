import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Page, Conversation } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { EmptyState } from './EmptyState';
import { MessageSquareIcon } from './icons';

interface InboxProps {
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const ConversationItem: React.FC<{ conversation: Conversation; currentUser: User; setPage: (page: Page, id?: string) => void }> = ({ conversation, currentUser, setPage }) => {
    const [otherUser, setOtherUser] = useState<User | null>(null);

    useEffect(() => {
        if (!conversation.isGroup) {
            const otherUserId = conversation.participants.find(p => p !== currentUser.userId);
            if (otherUserId) {
                // api is now backendApiService
                api.getUserById(otherUserId).then(setOtherUser).catch(err => console.error("Failed to fetch user", err));
            }
        }
    }, [conversation, currentUser.userId]);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m`;
        return 'now';
    };

    const isUnread = (conversation.unreadCount[currentUser.userId] || 0) > 0;

    const displayName = conversation.isGroup ? conversation.groupName : otherUser?.name;
    const displayAvatar = conversation.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;

    if (!displayName) return null; // Still loading

    return (
        <li
            onClick={() => setPage('chat', conversation.conversationId)}
            className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-white/5 rounded-lg transition-colors duration-200"
        >
            <img className="h-12 w-12 rounded-full object-cover" src={displayAvatar} alt={displayName} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className={`text-lg font-semibold ${isUnread ? 'text-white' : 'text-gray-300'}`}>{displayName}</p>
                    <p className={`text-xs ${isUnread ? 'text-indigo-400' : 'text-gray-500'}`}>{timeAgo(conversation.lastUpdatedAt)}</p>
                </div>
                <p className={`text-sm truncate ${isUnread ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                    {conversation.lastMessage.senderId === currentUser.userId && "You: "}
                    {conversation.lastMessage.text}
                </p>
            </div>
            {isUnread && <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0"></div>}
        </li>
    );
};

const RequestItem: React.FC<{ conversation: Conversation; currentUser: User; onAccept: (id: string) => void; onDecline: (id: string) => void }> = ({ conversation, currentUser, onAccept, onDecline }) => {
    const [otherUser, setOtherUser] = useState<User | null>(null);

    useEffect(() => {
        const otherUserId = conversation.participants.find(p => p !== currentUser.userId);
        if (otherUserId) {
            // api is now backendApiService
            api.getUserById(otherUserId).then(setOtherUser).catch(err => console.error("Failed to fetch user", err));
        }
    }, [conversation, currentUser.userId]);

    if (!otherUser) return null;

    return (
        <li className="p-4 space-y-3">
            <div className="flex items-center space-x-4">
                <img className="h-12 w-12 rounded-full object-cover" src={otherUser.avatarUrl} alt={otherUser.name} />
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white">{otherUser.name}</p>
                    <p className="text-sm truncate text-gray-400 italic bg-black/20 p-2 rounded-md mt-1">
                        "{conversation.lastMessage.text}"
                    </p>
                </div>
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={() => onDecline(conversation.conversationId)} className="px-4 py-1.5 text-sm rounded-lg bg-gray-600 hover:bg-gray-500 text-white">Decline</button>
                <button onClick={() => onAccept(conversation.conversationId)} className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Accept</button>
            </div>
        </li>
    );
};


export const Inbox: React.FC<InboxProps> = ({ currentUser, setPage }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // FIX: Removed currentUser.userId. Backend gets this from token.
            const data = await api.getConversationsByUserId();
            setConversations(data.sort((a,b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()));
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            alert("Could not load messages.");
        } finally {
            setIsLoading(false);
        }
    }, []); // FIX: Dependency array is now empty
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { acceptedConversations, pendingRequests } = useMemo(() => {
        return {
            acceptedConversations: conversations.filter(c => c.status === 'accepted'),
            pendingRequests: conversations.filter(c => c.status === 'pending' && c.lastMessage.senderId !== currentUser.userId),
        }
    }, [conversations, currentUser.userId]);

    const handleAcceptRequest = async (conversationId: string) => {
        try {
            const success = await api.acceptMessageRequest(conversationId);
            if (success) {
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error("Failed to accept request:", error);
            alert("Failed to accept message request.");
        }
    };
    
    const handleDeclineRequest = async (conversationId: string) => {
        try {
            // Note: A real decline API might be needed. This just removes locally.
            // await api.declineMessageRequest(conversationId);
            setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
        } catch (error) {
             console.error("Failed to decline request:", error);
            alert("Failed to decline message request.");
        }
    };

    if (isLoading) return <div className="text-center p-8">Loading conversations...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

                <div className="border-b border-white/10 mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('inbox')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'inbox' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                            Inbox
                        </button>
                        <button onClick={() => setActiveTab('requests')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                            Requests {pendingRequests.length > 0 && <span className="ml-2 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                        </button>
                    </nav>
                </div>
                
                <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10">
                    <ul className="divide-y divide-white/10">
                        {activeTab === 'inbox' && (
                            acceptedConversations.length > 0 ? (
                                acceptedConversations.map(convo => (
                                    <ConversationItem key={convo.conversationId} conversation={convo} currentUser={currentUser} setPage={setPage} />
                                ))
                            ) : (
                                <div className="p-8">
                                    <EmptyState
                                        icon={MessageSquareIcon}
                                        title="Your Inbox is Empty"
                                        message="Start a conversation with other thinkers and doers to build your network."
                                        ctaText="Explore the Community"
                                        onCtaClick={() => setPage('explore')}
                                    />
                                </div>
                            )
                        )}
                        {activeTab === 'requests' && (
                            pendingRequests.length > 0 ? (
                                pendingRequests.map(convo => (
                                    <RequestItem key={convo.conversationId} conversation={convo} currentUser={currentUser} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    No pending message requests.
                                </div>
                            )
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};