// C:\Users\hemant\Downloads\synapse\src\components\Inbox.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Page, Conversation } from '../types';
import api from '../services/backendApiService';
import { EmptyState } from './EmptyState';
import { MessageSquareIcon, LoaderIcon } from './icons'; // Added LoaderIcon
import { timeAgo } from '../utils/timeAgo'; // Assuming you have this utility

interface InboxProps {
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const ConversationItem: React.FC<{ conversation: Conversation; currentUser: User; setPage: (page: Page, id?: string) => void }> = ({ conversation, currentUser, setPage }) => {
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Memoize otherUserId to prevent unnecessary fetches
    const otherUserId = useMemo(() => {
        if (conversation.isGroup || !conversation.participants) return null;
        return conversation.participants.find(p => p !== currentUser.userId);
    }, [conversation.isGroup, conversation.participants, currentUser.userId]);

    useEffect(() => {
        setIsLoadingUser(true);
        if (otherUserId) {
            api.getUserById(otherUserId)
               .then(setOtherUser)
               .catch(err => console.error("Failed to fetch user", err))
               .finally(() => setIsLoadingUser(false));
        } else if (!conversation.isGroup) {
            // Handle case where other user ID couldn't be determined (should be rare)
            console.warn("Could not determine other user ID for conversation:", conversation.conversationId);
            setIsLoadingUser(false);
        } else {
             setIsLoadingUser(false); // No user to load for group chats
        }
    }, [otherUserId, conversation.conversationId]); // Depend on memoized ID

    // --- (FIXED) Safely access unreadCount ---
    const isUnread = (conversation.unreadCount?.[currentUser.userId] || 0) > 0;

    // --- (FIXED) Use displayName ---
    const displayName = conversation.isGroup ? conversation.groupName : otherUser?.displayName || 'Loading...';
    const displayAvatar = conversation.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;

    // --- (FIXED) Safely access lastUpdatedAt ---
    const lastUpdateTime = conversation.lastUpdatedAt || conversation.lastMessage?.createdAt || ''; // Fallback to message time

    // --- (FIXED) Safely access lastMessage ---
    const lastMessageText = conversation.lastMessage?.text || 'No messages yet';
    const lastMessageSenderId = conversation.lastMessage?.senderId || '';

    // Don't render if still loading the essential user info for a 1-on-1 chat
    if (isLoadingUser && !conversation.isGroup) {
         return <li className="flex items-center p-4 space-x-4 animate-pulse"><div className="h-12 w-12 rounded-full bg-gray-700"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div><div className="h-3 bg-gray-700 rounded w-3/4"></div></div></li>;
    }

    return (
        <li
            // Use conversationId directly
            onClick={() => setPage('chat', conversation.conversationId)}
            className="flex items-center p-4 space-x-4 cursor-pointer hover:bg-white/5 rounded-lg transition-colors duration-200"
        >
            <img className="h-12 w-12 rounded-full object-cover bg-gray-700" src={displayAvatar || '/default-avatar.png'} alt={displayName} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className={`text-lg font-semibold truncate ${isUnread ? 'text-white' : 'text-gray-300'}`}>{displayName}</p>
                     {/* --- (FIXED) Pass valid date string or empty string --- */}
                    <p className={`text-xs flex-shrink-0 ml-2 ${isUnread ? 'text-indigo-400' : 'text-gray-500'}`}>{timeAgo(lastUpdateTime)}</p>
                </div>
                <p className={`text-sm truncate ${isUnread ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                    {/* --- (FIXED) Check senderId safely --- */}
                    {lastMessageSenderId === currentUser.userId && "You: "}
                    {lastMessageText}
                </p>
            </div>
            {isUnread && <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0 ml-2"></div>}
        </li>
    );
};

const RequestItem: React.FC<{ conversation: Conversation; currentUser: User; onAccept: (id: string) => void; onDecline: (id: string) => void }> = ({ conversation, currentUser, onAccept, onDecline }) => {
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Memoize otherUserId
    const otherUserId = useMemo(() => {
        return conversation.participants?.find(p => p !== currentUser.userId);
    }, [conversation.participants, currentUser.userId]);

    useEffect(() => {
        setIsLoadingUser(true);
        if (otherUserId) {
            api.getUserById(otherUserId)
               .then(setOtherUser)
               .catch(err => console.error("Failed to fetch user for request", err))
               .finally(() => setIsLoadingUser(false));
        } else {
             console.warn("Could not determine other user ID for request:", conversation.conversationId);
             setIsLoadingUser(false);
        }
    }, [otherUserId, conversation.conversationId]);

    // --- (FIXED) Safely access lastMessage ---
    const lastMessageText = conversation.lastMessage?.text || 'No message content';

    if (isLoadingUser) {
        return <li className="p-4 space-y-3 animate-pulse"><div className="flex items-center space-x-4"><div className="h-12 w-12 rounded-full bg-gray-700"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-700 rounded w-1/2"></div><div className="h-3 bg-gray-700 rounded w-3/4"></div></div></div><div className="flex justify-end space-x-2"><div className="h-8 w-20 bg-gray-600 rounded-lg"></div><div className="h-8 w-20 bg-indigo-600 rounded-lg"></div></div></li>;
    }

    if (!otherUser) return null; // Don't render if user couldn't be loaded

    return (
        <li className="p-4 space-y-3">
            <div className="flex items-center space-x-4">
                 {/* --- (FIXED) Use displayName --- */}
                <img className="h-12 w-12 rounded-full object-cover bg-gray-700" src={otherUser.avatarUrl || '/default-avatar.png'} alt={otherUser.displayName || 'User'} />
                <div className="flex-1 min-w-0">
                     {/* --- (FIXED) Use displayName --- */}
                    <p className="text-lg font-semibold text-white truncate">{otherUser.displayName || 'User'}</p>
                    <p className="text-sm truncate text-gray-400 italic bg-black/20 p-2 rounded-md mt-1">
                         {/* --- (FIXED) Use safe text --- */}
                        "{lastMessageText}"
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
    const [error, setError] = useState<string | null>(null); // Added error state
    const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');

    const fetchData = useCallback(async () => {
        // Don't reset loading to true on refetch unless necessary
        setError(null); // Clear previous errors
        try {
            const data = await api.getConversationsByUserId();
            // --- (FIXED) Sort safely, handle missing dates ---
            setConversations((data || []).sort((a, b) => {
                 const timeA = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
                 const timeB = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
                 // Handle potential NaN from invalid dates
                 if (isNaN(timeA) && isNaN(timeB)) return 0;
                 if (isNaN(timeA)) return 1; // Put invalid dates last
                 if (isNaN(timeB)) return -1;
                 return timeB - timeA;
            }));
        } catch (error: any) {
            console.error("Failed to fetch conversations:", error);
            setError(`Could not load messages: ${error.message || 'Please try again.'}`); // Set specific error
        } finally {
            setIsLoading(false); // Always set loading false after attempt
        }
    }, []);

    useEffect(() => {
        setIsLoading(true); // Set loading true on initial mount
        fetchData();
    }, [fetchData]);

    const { acceptedConversations, pendingRequests } = useMemo(() => {
        return {
            acceptedConversations: conversations.filter(c => c.status === 'accepted' || !c.status), // Accept if status is missing too
            // --- (FIXED) Safely check lastMessage and senderId ---
            pendingRequests: conversations.filter(c => c.status === 'pending' && c.lastMessage?.senderId !== currentUser.userId),
        }
    }, [conversations, currentUser.userId]);

    const handleAcceptRequest = async (conversationId: string) => {
        try {
            // Use the response from acceptMessageRequest if needed
            await api.acceptMessageRequest(conversationId);
            fetchData(); // Refresh list after accepting
        } catch (error) {
            console.error("Failed to accept request:", error);
            alert("Failed to accept message request.");
        }
    };

    const handleDeclineRequest = async (conversationId: string) => {
        try {
            // TODO: Implement a real decline API call
            // await api.declineMessageRequest(conversationId);
            // Optimistic UI update: Remove locally
            setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
             console.log(`Declined request (locally): ${conversationId}`);
        } catch (error) {
             console.error("Failed to decline request:", error);
            alert("Failed to decline message request.");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400"/></div>;
    // Show error message if fetch failed
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;


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
                                        ctaText="Explore Users" // Changed CTA
                                        onCtaClick={() => setPage('explore')} // Changed navigation
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