import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Page, Message, Conversation } from '../types';
import { api } from '../services/mockApiService';
import { SendIcon, PaperclipIcon, SmileIcon, XIcon, ShieldIcon, MessageSquareIcon } from './icons';

interface ChatProps {
    conversationId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🤔'];

const MessageBubble: React.FC<{
    message: Message;
    isCurrentUser: boolean;
    sender?: User;
    originalMessage?: Message;
    onReply: (message: Message) => void;
    onReact: (messageId: string, emoji: string) => void;
}> = ({ message, isCurrentUser, sender, originalMessage, onReply, onReact }) => {
    const [showReactions, setShowReactions] = useState(false);
    const hasReacted = (emoji: string) => message.reactions?.some(r => r.userId === sender?.userId && r.emoji === emoji);

    return (
        <div className={`group flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUser && <img src={sender?.avatarUrl} alt={sender?.name} className="w-8 h-8 rounded-full self-start" />}
            <div className="flex flex-col" style={{ maxWidth: '70%' }}>
                {!isCurrentUser && <span className="text-xs text-gray-400 mb-1 ml-3">{sender?.name}</span>}
                <div className={`relative px-4 py-3 rounded-2xl ${isCurrentUser ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-lg' : 'bg-[#252532] text-gray-200 rounded-bl-lg'}`}>
                    {originalMessage && (
                        <div className="border-l-2 border-indigo-300/50 pl-2 mb-2 opacity-80">
                            <p className="text-xs font-semibold">{originalMessage.senderId === sender?.userId ? 'You replied to yourself' : `You replied to ${sender?.name}`}</p>
                            <p className="text-sm truncate">{originalMessage.text}</p>
                        </div>
                    )}
                    {message.media?.type === 'image' && (
                        <img src={message.media.url} alt={message.media.fileName} className="rounded-lg mb-2 max-w-xs" />
                    )}
                    {message.text && <p className="break-words">{message.text}</p>}
                    
                    <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={isCurrentUser ? {left: '-3rem'} : {right: '-3rem'}}>
                        <div className="flex items-center space-x-1 bg-[#1A1A24] p-1 rounded-full shadow-lg border border-white/10">
                           <button onClick={() => setShowReactions(!showReactions)} className="p-1 hover:bg-white/10 rounded-full"><SmileIcon className="w-4 h-4 text-gray-400"/></button>
                           <button onClick={() => onReply(message)} className="p-1 hover:bg-white/10 rounded-full"><MessageSquareIcon className="w-4 h-4 text-gray-400"/></button>
                        </div>
                    </div>
                     {showReactions && (
                        <div className="absolute bottom-full mb-1 flex space-x-1 bg-[#252532] p-1 rounded-full shadow-lg border border-white/10">
                            {EMOJI_REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => { onReact(message.messageId, emoji); setShowReactions(false); }} className={`p-1 text-lg rounded-full hover:scale-125 transition-transform ${hasReacted(emoji) ? 'bg-indigo-500/50' : ''}`}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {message.reactions && message.reactions.length > 0 && (
                    <div className="flex space-x-1 mt-1 px-2">
                        {message.reactions.map((r, i) => <span key={i} className="text-xs bg-black/30 px-1.5 py-0.5 rounded-full">{r.emoji}</span>)}
                    </div>
                )}
            </div>
            {isCurrentUser && <img src={sender?.avatarUrl} alt={sender?.name} className="w-8 h-8 rounded-full self-start" />}
        </div>
    );
};


export const Chat: React.FC<ChatProps> = ({ conversationId, currentUser, setPage }) => {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [participants, setParticipants] = useState<Record<string, User>>({});
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const fetchData = React.useCallback(async () => {
        const convos = await api.getConversationsByUserId(currentUser.userId);
        const currentConvo = convos.find(c => c.conversationId === conversationId);
        if (currentConvo) {
            setConversation(currentConvo);
            const users = await Promise.all(currentConvo.participants.map(id => api.getUserById(id)));
            const userMap: Record<string, User> = {};
            users.forEach(u => { if(u) userMap[u.userId] = u; });
            setParticipants(userMap);
        }
        const messageData = await api.getMessagesByConversationId(conversationId);
        setMessages(messageData);
    }, [conversationId, currentUser.userId]);

    useEffect(() => {
        setIsLoading(true);
        fetchData().finally(() => setIsLoading(false));
    }, [fetchData]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent, media?: Message['media']) => {
        e.preventDefault();
        if ((!newMessage.trim() && !media) || !conversation) return;
        const sentMessage = await api.sendMessage(conversation.conversationId, currentUser.userId, newMessage, {
            replyToMessageId: replyingTo?.messageId,
            media
        });
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        setReplyingTo(null);
    };

    const handleReact = async (messageId: string, emoji: string) => {
        const updatedMessage = await api.addReactionToMessage(messageId, currentUser.userId, emoji);
        if(updatedMessage) {
            setMessages(prev => prev.map(m => m.messageId === messageId ? updatedMessage : m));
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mock upload and send
            const isImage = file.type.startsWith('image/');
            const media: Message['media'] = {
                url: URL.createObjectURL(file), // Use local URL for preview
                type: isImage ? 'image' : 'file',
                fileName: file.name
            };
            handleSendMessage(new Event('submit') as any, media);
        }
    };

    const otherUser = useMemo(() => {
        if (!conversation || conversation.isGroup) return null;
        const otherId = conversation.participants.find(p => p !== currentUser.userId);
        return otherId ? participants[otherId] : null;
    }, [conversation, participants, currentUser.userId]);
    
    const displayName = conversation?.isGroup ? conversation.groupName : otherUser?.name;
    const displayAvatar = conversation?.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;

    if (isLoading) return <div className="flex items-center justify-center h-screen">Loading chat...</div>;
    if (!conversation) return <div className="text-center p-8">Could not load conversation.</div>;

    return (
        <div className="container mx-auto max-w-3xl h-[calc(100vh-4rem)] flex flex-col bg-[#101018] rounded-t-xl border border-white/10">
            <header className="p-4 bg-[#1A1A24]/80 backdrop-blur-lg border-b border-white/10 flex items-center space-x-4 sticky top-16 z-10 rounded-t-xl">
                <button onClick={() => setPage('inbox')} className="text-indigo-400">&larr; Back</button>
                {displayAvatar && <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-full" />}
                <div>
                    <h1 className="text-xl font-bold text-white">{displayName}</h1>
                    <p className="text-xs text-green-400 flex items-center space-x-1"><ShieldIcon className="w-3 h-3"/><span>End-to-end Encrypted</span></p>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg) => {
                    const originalMessage = msg.replyToMessageId ? messages.find(m => m.messageId === msg.replyToMessageId) : undefined;
                    return (
                        <MessageBubble
                            key={msg.messageId}
                            message={msg}
                            isCurrentUser={msg.senderId === currentUser.userId}
                            sender={participants[msg.senderId]}
                            originalMessage={originalMessage}
                            onReply={setReplyingTo}
                            onReact={handleReact}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-[#1A1A24]/80 backdrop-blur-lg border-t border-white/10">
                {replyingTo && (
                    <div className="bg-black/20 p-2 rounded-t-lg flex justify-between items-center text-sm">
                        <div className="border-l-2 border-indigo-400 pl-2">
                            <p className="font-semibold text-indigo-400">Replying to {participants[replyingTo.senderId]?.name}</p>
                            <p className="text-gray-300 truncate">{replyingTo.text}</p>
                        </div>
                        <button onClick={() => setReplyingTo(null)}><XIcon className="w-5 h-5"/></button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} hidden />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white"><PaperclipIcon className="w-5 h-5"/></button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#252532] border-2 border-[#374151] rounded-full py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!newMessage.trim()}>
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
        </div>
    );
};