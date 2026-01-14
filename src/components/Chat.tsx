// C:\Users\hemant\Downloads\synapse\src\components\Chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Message, Conversation, Page } from '../types';
import api from '../services/backendApiService';
import { SendIcon, PaperclipIcon, SmileIcon, XIcon, LoaderIcon } from './icons';
import { timeAgo } from '../utils/timeAgo';

interface ChatProps {
    conversationId: string;
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

const MessageBubble: React.FC<{
    message: Message;
    sender: User | undefined;
    currentUser: User | null; // Pass currentUser down
    isCurrentUser: boolean;
    participants: Record<string, User>;
    // REMOVED onReply prop below
}> = ({ message, sender, currentUser, isCurrentUser, participants }) => { // REMOVED onReply from destructuring

    // Placeholder: Implement logic to find the original message from a message list if needed
    const findOriginalMessageById = (_id: string | undefined): Message | undefined => { // Renamed id to _id
        // Assuming messages are available in a higher scope or passed down
        // return messages.find(m => m.messageId === _id);
        return undefined; // Placeholder
    };

    const originalMessage = message.replyToMessageId ? findOriginalMessageById(message.replyToMessageId) : undefined;
    const originalSender = originalMessage ? participants[originalMessage.senderId] : undefined;

    return (
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-4 group`}>
            <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs md:max-w-md lg:max-w-lg`}>
                 {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                {!isCurrentUser && <img src={sender?.avatarUrl || '/Synapse/default-avatar.png'} alt={sender?.displayName || 'User'} className="w-8 h-8 rounded-full self-start mr-2 flex-shrink-0 object-cover" />}
                <div className={`relative px-4 py-3 rounded-lg shadow ${isCurrentUser ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none' : 'bg-[#252532] text-gray-200 rounded-bl-none'}`}>
                     {/* --- (FIXED) Use displayName --- */}
                    {!isCurrentUser && <span className="text-xs text-indigo-300 mb-1 font-semibold block">{sender?.displayName || 'User'}</span>}

                    {/* Reply Context */}
                    {originalMessage && (
                        <div className="mb-2 p-2 border-l-2 border-indigo-400/50 bg-black/20 rounded">
                             {/* --- (FIXED) Use displayName --- */}
                            <p className="text-xs font-semibold text-indigo-300">
                                {originalMessage.senderId === currentUser?.userId ? 'You replied to yourself' : `You replied to ${originalSender?.displayName || 'User'}`}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{originalMessage.text || 'Media content'}</p>
                        </div>
                    )}

                    {/* Message Content */}
                    {message.text && <p className="text-sm break-words">{message.text}</p>}
                    {message.media && (
                        <div className="mt-2">
                            {message.media.type === 'image' ? (
                                <img src={message.media.url} alt="Uploaded content" className="max-w-full h-auto rounded-md" />
                            ) : (
                                <a href={message.media.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center space-x-1">
                                    <PaperclipIcon className="w-4 h-4"/>
                                    <span>{message.media.fileName}</span>
                                </a>
                            )}
                        </div>
                    )}
                     <span className={`text-xs mt-1 block ${isCurrentUser ? 'text-indigo-200/80 text-right' : 'text-gray-500 text-left'}`}>
                         {timeAgo(message.createdAt)}
                     </span>
                </div>
                 {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                 {isCurrentUser && <img src={sender?.avatarUrl || '/Synapse/default-avatar.png'} alt={sender?.displayName || 'User'} className="w-8 h-8 rounded-full self-start ml-2 flex-shrink-0 object-cover" />}
            </div>
            {/* <button onClick={() => onReply(message)} className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 ml-10">Reply</button> */}
        </div>
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchChatData = useCallback(async () => {
        setError(null);
        try {
            // Fetch conversation and messages concurrently
            const [convData, messageData] = await Promise.all([
                 api.getConversationById(conversationId),
                 api.getMessagesByConversationId(conversationId)
            ]);

            setConversation(convData);
            setMessages(messageData || []);

            if (convData?.participants) {
                // Fetch participant details only if not already fetched or need update
                const missingParticipantIds = convData.participants.filter(id => !participants[id]);
                if (missingParticipantIds.length > 0) {
                    const participantDetails = await Promise.all(
                        missingParticipantIds.map(id => api.getUserById(id))
                    );
                    setParticipants(prev => {
                        const newParticipants = {...prev};
                        participantDetails.forEach(user => {
                            if (user) newParticipants[user.userId] = user;
                        });
                        return newParticipants;
                    });
                }

                // Mark messages as read if necessary
                const unreadCount = convData.unreadCount?.[currentUser.userId];
                if(typeof unreadCount === 'number' && unreadCount > 0) {
                     await api.markMessagesRead(conversationId);
                     // Optionally update conversation state locally
                     setConversation(prev => prev ? {...prev, unreadCount: {...prev.unreadCount, [currentUser.userId]: 0}} : null);
                }
            } else if (convData) {
                 console.warn("Conversation data is missing participants:", convData);
                 // Handle case where participants might be missing?
            } else {
                 throw new Error("Conversation not found.");
            }

        } catch (err: any) {
            console.error("Failed to fetch chat data:", err);
            setError("Could not load chat. Please try again later.");
        } finally {
             setIsLoading(false);
        }
    }, [conversationId, currentUser.userId, participants]); // Include participants in dependency array

    useEffect(() => {
        setIsLoading(true);
        fetchChatData();
        // TODO: Implement WebSocket for real-time updates / polling
         // const intervalId = setInterval(fetchChatData, 5000); // Example polling
         // return () => clearInterval(intervalId);
    }, [fetchChatData]); // Use fetchChatData directly

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !conversation) return;

        try {
            const sentMessage = await api.sendMessage({
                conversationId: conversation.conversationId,
                text: newMessage,
                replyToMessageId: replyingTo?.messageId,
            });
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            setReplyingTo(null);
            // Update conversation locally for immediate feedback
            setConversation(prev => prev ? {...prev, lastMessage: sentMessage, lastUpdatedAt: sentMessage.createdAt} : null);
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message.");
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400"/></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">{error}</div>;
    }

    if (!conversation) {
        return <div className="text-center p-8 text-gray-400">Conversation not found or access denied.</div>;
    }

    const otherParticipantIds = (conversation.participants || []).filter(id => id !== currentUser.userId);
    const otherUser = otherParticipantIds.length === 1 ? participants[otherParticipantIds[0]] : null;
     // --- (FIXED) Use displayName ---
    const chatTitle = conversation.isGroup ? conversation.groupName : otherUser?.displayName || 'Chat';
    const chatAvatar = conversation.isGroup ? conversation.groupAvatar : otherUser?.avatarUrl;

    return (
        // --- THIS DIV WAS UNCLOSED ---
        <div className="w-full h-screen flex flex-col bg-[#0A0A0F]">
            <header className="p-4 bg-[#1A1A24]/90 backdrop-blur-sm border-b border-white/10 flex justify-between items-center z-20 flex-shrink-0">
                <button onClick={() => setPage('inbox')} className="bg-[#252532] px-4 py-2 rounded-lg text-sm hover:bg-[#374151]">&larr; Back to Inbox</button>
                <div className="flex items-center space-x-3">
                    {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                    <img src={chatAvatar || '/Synapse/default-avatar.png'} alt={chatTitle} className="w-10 h-10 rounded-full object-cover" />
                    <h1 className="text-lg font-bold text-white">{chatTitle}</h1>
                </div>
                <div className="w-24"></div> {/* Spacer */}
            </header>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                 {messages.length === 0 && (
                    <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
                 )}
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.messageId || msg.id}
                        message={msg}
                        sender={participants[msg.senderId || msg.sender_id!]} // Handle potential snake_case
                        currentUser={currentUser} // Pass currentUser
                        isCurrentUser={(msg.senderId || msg.sender_id) === currentUser.userId}
                        participants={participants}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* --- THIS DIV WAS UNCLOSED --- */}
            <div className="p-4 border-t border-white/10 bg-[#101018]">
                {replyingTo && (
                    // --- THIS DIV WAS UNCLOSED ---
                    <div className="mb-2 p-2 bg-[#252532] rounded-md border-l-4 border-indigo-500 flex justify-between items-center text-sm">
                        {/* --- THIS DIV WAS UNCLOSED --- */}
                        <div>
                             {/* --- (FIXED) Use displayName --- */}
                             {/* --- THIS <p> tag and className were unclosed --- */}
                            <p className="font-semibold text-gray-300">
                                Replying to {participants[replyingTo.senderId]?.displayName || 'User'}
                            </p>
                            <p className="text-gray-400 truncate">{replyingTo.text || 'Media content'}</p>
                        {/* --- ADDED CLOSING </div> TAG --- */}
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-white/10">
                            <XIcon className="w-4 h-4 text-gray-400"/>
                        </button>
                    {/* --- ADDED CLOSING </div> TAG --- */}
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <button type="button" className="p-2 text-gray-400 hover:text-white"><PaperclipIcon className="w-5 h-5"/></button>
                    <button type="button" className="p-2 text-gray-400 hover:text-white"><SmileIcon className="w-5 h-5"/></button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-[#252532] border-2 border-[#374151] rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50">
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </form>
            {/* --- ADDED CLOSING </div> TAG --- */}
            </div>
        {/* --- ADDED CLOSING </div> TAG --- */}
        </div>
    );
};
// --- ADDED MISSING CLOSING BRACE AND SEMICOLON ---
// }; // This seemed extra from previous copy-paste? Let's remove it.