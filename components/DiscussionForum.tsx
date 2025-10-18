import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Idea, User, ForumMessage, Page } from '../types';
import { api } from '../services/mockApiService';
import { SendIcon, UserPlusIcon, UserMinusIcon, PinIcon, TrashIcon, ChevronDownIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

interface DiscussionForumProps {
    ideaId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const MemberList: React.FC<{
    idea: Idea;
    members: User[];
    currentUser: User;
    onAddMember: (userId: string) => void;
    onRemoveMember: (userId: string, userName: string) => void;
    setPage: (page: Page, id?: string) => void;
}> = ({ idea, members, currentUser, onAddMember, onRemoveMember, setPage }) => {
    const [addUserId, setAddUserId] = useState('');
    const isOwner = currentUser.userId === idea.ownerId;

    const handleAdd = () => {
        if (addUserId.trim()) {
            onAddMember(addUserId.trim());
            setAddUserId('');
        }
    };

    return (
        <div className="bg-[#1A1A24]/60 p-4 rounded-lg border border-white/10 h-full flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Forum Members ({members.length})</h3>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <ul className="space-y-3 pr-2">
                    {members.map(member => (
                        <li key={member.userId} className="flex items-center justify-between group">
                            <button onClick={() => setPage('profile', member.userId)} className="flex items-center space-x-3 text-left">
                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                <div className="flex-1">
                                    <span className="text-gray-300 group-hover:text-indigo-400">{member.name}</span>
                                    {member.userId === idea.ownerId && <span className="block text-xs text-indigo-400">Owner</span>}
                                </div>
                            </button>
                            {isOwner && member.userId !== currentUser.userId && (
                                <button onClick={() => onRemoveMember(member.userId, member.name)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity">
                                    <UserMinusIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {isOwner && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="font-semibold text-white mb-2">Add Member</h4>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={addUserId}
                            onChange={(e) => setAddUserId(e.target.value)}
                            placeholder="Enter user ID (e.g. user-2)"
                            className="flex-1 bg-[#252532] border-2 border-[#374151] rounded-lg py-1 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={handleAdd} className="bg-indigo-600 p-2 rounded-lg hover:bg-indigo-700">
                           <UserPlusIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MessageCard: React.FC<{
    msg: ForumMessage;
    sender: User | undefined;
    isOwner: boolean;
    onPin: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ msg, sender, isOwner, onPin, onDelete }) => {
    return (
        <div className="group flex items-start gap-3 p-3 rounded-lg transition-colors">
            <img src={sender?.avatarUrl} alt={sender?.name} className="w-10 h-10 rounded-full mt-1 flex-shrink-0" />
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-2">
                        <span className="font-bold text-indigo-300">{sender?.name}</span>
                        <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    {isOwner && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                            <button onClick={() => onPin(msg.messageId)} className="text-gray-400 hover:text-indigo-400 p-1 rounded-full hover:bg-white/10" title={msg.isPinned ? 'Unpin message' : 'Pin message'}>
                                <PinIcon className={`w-4 h-4 ${msg.isPinned ? 'text-indigo-400 fill-current' : ''}`}/>
                            </button>
                            <button onClick={() => onDelete(msg.messageId)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white/10" title="Delete message">
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-gray-200 mt-1 break-words">{msg.text}</p>
            </div>
        </div>
    );
};


export const DiscussionForum: React.FC<DiscussionForumProps> = ({ ideaId, currentUser, setPage }) => {
    const [idea, setIdea] = useState<Idea | null>(null);
    const [messages, setMessages] = useState<ForumMessage[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPinnedVisible, setIsPinnedVisible] = useState(true);
    const [confirmationState, setConfirmationState] = useState<{
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
    } | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        const ideaData = await api.getIdeaById(ideaId);
        if (ideaData) {
            if (!ideaData.forumMembers.includes(currentUser.userId)) {
                alert("You don't have access to this forum.");
                setPage('feed');
                return;
            }
            setIdea(ideaData);
            const memberData = await Promise.all(ideaData.forumMembers.map(id => api.getUserById(id)));
            setMembers(memberData.filter((u): u is User => u !== null));
            const messageData = await api.getForumMessages(ideaId);
            setMessages(messageData);
        } else {
             setPage('feed');
        }
    }, [ideaId, currentUser.userId, setPage]);

    useEffect(() => {
        setIsLoading(true);
        fetchData().finally(() => setIsLoading(false));
    }, [fetchData]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !idea) return;
        const sentMessage = await api.postForumMessage(idea.ideaId, currentUser.userId, newMessage);
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
    };
    
    const handleAddMember = async (userId: string) => {
        const success = await api.addForumMember(ideaId, userId);
        if (success) {
            fetchData();
        } else {
            alert('Could not add member. User may not exist or is already in the forum.');
        }
    };

    const handleRemoveMember = (userId: string, userName: string) => {
        setConfirmationState({
            title: `Remove ${userName}?`,
            message: `Are you sure you want to remove ${userName} from the forum? This action cannot be undone.`,
            confirmText: 'Remove',
            onConfirm: async () => {
                const success = await api.removeForumMember(ideaId, userId);
                if (success) {
                    fetchData();
                } else {
                    alert('Could not remove member.');
                }
                setConfirmationState(null);
            },
        });
    };

    const handleDeleteMessage = (messageId: string) => {
        setConfirmationState({
            title: 'Delete Message?',
            message: 'Are you sure you want to delete this message? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                await api.deleteForumMessage(messageId);
                fetchData();
                setConfirmationState(null);
            },
        });
    };

    const handlePinMessage = async (messageId: string) => {
        await api.pinForumMessage(messageId);
        fetchData();
    };

    if (isLoading || !idea) return <div className="flex items-center justify-center h-screen">Loading forum...</div>;
    
    const isOwner = currentUser.userId === idea.ownerId;
    const pinnedMessages = messages.filter(m => m.isPinned);
    const regularMessages = messages.filter(m => !m.isPinned);


    return (
        <>
            <div className="w-full h-screen flex flex-col bg-[#0A0A0F]">
                <header className="p-4 bg-[#1A1A24]/90 backdrop-blur-sm border-b border-white/10 flex justify-between items-center z-20 flex-shrink-0">
                    <div>
                        <button onClick={() => setPage('ideaDetail', ideaId)} className="bg-[#252532] px-4 py-2 rounded-lg text-sm hover:bg-[#374151]">&larr; Back to Idea</button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white">Discussion Forum</h1>
                        <p className="text-sm text-gradient">{idea.title}</p>
                    </div>
                    <div className="w-36"></div>
                </header>
                <div className="flex-grow flex min-h-0">
                    <main className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                            {pinnedMessages.length > 0 && (
                                <div className="border border-indigo-500/30 rounded-lg mb-4 bg-indigo-900/10">
                                    <button onClick={() => setIsPinnedVisible(!isPinnedVisible)} className="w-full flex justify-between items-center p-3 bg-indigo-900/20 rounded-t-lg">
                                        <div className="flex items-center space-x-2">
                                            <PinIcon className="w-5 h-5 text-indigo-400"/>
                                            <h4 className="font-semibold text-indigo-300">Pinned Messages</h4>
                                        </div>
                                        <ChevronDownIcon className={`w-5 h-5 text-indigo-400 transition-transform ${isPinnedVisible ? '' : '-rotate-90'}`} />
                                    </button>
                                    {isPinnedVisible && (
                                        <div className="py-1 px-2">
                                            {pinnedMessages.map(msg => (
                                                <MessageCard
                                                    key={msg.messageId}
                                                    msg={msg}
                                                    sender={members.find(m => m.userId === msg.senderId)}
                                                    isOwner={isOwner}
                                                    onPin={handlePinMessage}
                                                    onDelete={handleDeleteMessage}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                {regularMessages.map((msg) => (
                                     <MessageCard
                                        key={msg.messageId}
                                        msg={msg}
                                        sender={members.find(m => m.userId === msg.senderId)}
                                        isOwner={isOwner}
                                        onPin={handlePinMessage}
                                        onDelete={handleDeleteMessage}
                                    />
                                ))}
                            </div>
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="mt-auto p-4 border-t border-white/10 bg-[#0A0A0F]">
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-[#252532] border-2 border-[#374151] rounded-full py-3 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!newMessage.trim()}>
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </main>
                    <aside className="w-80 p-4 flex-shrink-0 border-l border-white/10 hidden md:block">
                        <MemberList 
                            idea={idea}
                            members={members}
                            currentUser={currentUser}
                            onAddMember={handleAddMember}
                            onRemoveMember={handleRemoveMember}
                            setPage={setPage}
                        />
                    </aside>
                </div>
            </div>
            {confirmationState && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setConfirmationState(null)}
                    onConfirm={confirmationState.onConfirm}
                    title={confirmationState.title}
                    message={confirmationState.message}
                    confirmText={confirmationState.confirmText}
                />
            )}
        </>
    );
};
