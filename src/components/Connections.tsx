// C:\Users\hemant\Downloads\synapse\src\components\Connections.tsx
import React, { useState, useEffect } from 'react';
import { User, Page } from '../types';
import api from '../services/backendApiService';
// REMOVED UserMinusIcon import
import { MessageSquareIcon, LoaderIcon, UsersIcon } from './icons'; // Added UsersIcon
import { EmptyState } from './EmptyState'; // Added EmptyState

interface ConnectionsProps {
    userId: string; // The ID of the user whose connections we are viewing (usually currentUser)
    setPage: (page: Page, id?: string) => void;
}

export const Connections: React.FC<ConnectionsProps> = ({ userId, setPage }) => {
    const [connections, setConnections] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // REMOVED currentUserData state
    // const [currentUserData, setCurrentUserData] = useState<User | null>(null); // State for current user data

    useEffect(() => {
        const fetchConnections = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch the current user's full data first to get connection IDs
                 const userData = await api.getUserById(userId);
                 // REMOVED setCurrentUserData call
                 // setCurrentUserData(userData); // Store current user data

                 if (userData?.connections && userData.connections.length > 0) {
                     const connectionDetails = await Promise.all(
                         userData.connections.map(id => api.getUserById(id))
                     );
                     // Filter out any null users (e.g., if a user was deleted)
                     setConnections(connectionDetails.filter((u): u is User => u !== null));
                 } else {
                     setConnections([]); // No connections or user data missing connections
                 }

            } catch (err: any) {
                console.error('Failed to fetch connections:', err);
                setError('Could not load connections. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConnections();
    }, [userId]);

    // REMOVED unused handleRemoveConnection function
    // const handleRemoveConnection = (connectionId: string) => {
    //     // TODO: Implement API call `api.removeConnection(connectionId)`
    //     // Need to update currentUserData state after successful removal
    //     alert(`Remove connection functionality not yet implemented for user ${connectionId}.`);
    // };

    const handleStartChat = async (otherUserId: string) => {
         try {
            const conversation = await api.startConversation(otherUserId);
            // Use conversationId (or id as fallback from backend)
            setPage('chat', conversation.conversationId || (conversation as any).id);
        } catch (err) {
            console.error("Failed to start conversation:", err);
            alert("Could not start chat.");
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400"/></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">My Connections</h1>
                {connections.length === 0 ? (
                     <EmptyState
                        icon={UsersIcon}
                        title="No Connections Yet"
                        message="Connect with other users to collaborate and share ideas."
                        ctaText="Explore Users" // Assuming you might have an explore users page
                        onCtaClick={() => setPage('explore')} // Navigate to explore or feed
                     />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {connections.map(user => (
                            <div key={user.userId} className="bg-[#1A1A24] p-6 rounded-lg shadow border border-white/10 flex flex-col items-center text-center">
                                 {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                                <img src={user.avatarUrl || '/Synapse/default-avatar.png'} alt={user.displayName || user.username} className="w-20 h-20 rounded-full mb-4 object-cover" />
                                <div className="flex-1">
                                      {/* --- (FIXED) Use displayName --- */}
                                    <h2 className="text-xl font-bold text-white">{user.displayName || user.username}</h2>
                                    {user.username && <p className="text-sm text-gray-400 mb-2">@{user.username}</p>}
                                    <p className="text-sm text-gray-300 mb-4">{user.bio?.substring(0, 50)}{user.bio && user.bio.length > 50 ? '...' : ''}</p>
                                </div>
                                <div className="mt-auto w-full flex space-x-2">
                                     <button onClick={() => handleStartChat(user.userId)} className="flex-1 flex items-center justify-center space-x-1 bg-[#252532] text-white px-3 py-2 rounded-lg hover:bg-[#374151] text-sm">
                                        <MessageSquareIcon className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>
                                    {/* The commented out remove button was fine */}
                                    {/* <button onClick={() => handleRemoveConnection(user.userId)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-900/20">
                                        <UserMinusIcon className="w-4 h-4"/>
                                    </button> */}
                                    <button onClick={() => setPage('profile', user.userId)} className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
// --- Make sure there are NO extra braces between here ---
}; // --- and here ---
// --- NO extra '}' should be below this line ---