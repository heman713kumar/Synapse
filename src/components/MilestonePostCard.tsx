// C:\Users\hemant\Downloads\synapse\src\components\MilestonePostCard.tsx
import React, { useState, useEffect } from 'react';
import { MilestonePost, User, Page, Idea } from '../types';
import api from '../services/backendApiService';
import { RocketIcon } from './icons'; // Added LoaderIcon
import { timeAgo } from '../utils/timeAgo'; // Assuming timeAgo utility

interface MilestonePostCardProps {
    post: MilestonePost;
    setPage: (page: Page, id?: string) => void;
}

export const MilestonePostCard: React.FC<MilestonePostCardProps> = ({ post, setPage }) => {
    const [user, setUser] = useState<User | null>(null);
    const [idea, setIdea] = useState<Idea | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Added loading state

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true); // Set loading true at start
            try {
                // Fetch idea and user concurrently if possible, or sequentially
                // Check if post.ideaId exists
                if (!post.ideaId) {
                     console.warn("Milestone post missing ideaId:", post);
                     setIsLoading(false); // Stop loading if no ID
                     return;
                }
                const ideaData = await api.getIdeaById(post.ideaId);
                setIdea(ideaData); // Set idea

                // Check if ideaData and ownerId exist before fetching user
                if (ideaData?.ownerId) {
                    const userData = await api.getUserById(ideaData.ownerId);
                    setUser(userData); // Set user
                } else if (post.userId) {
                    // Fallback to userId on the post itself if ownerId isn't on idea
                     const userData = await api.getUserById(post.userId);
                     setUser(userData);
                } else {
                     console.warn("Could not determine user for milestone post:", post);
                }
            } catch (error) {
                console.error("Failed to fetch milestone post data:", error);
                 // Optionally set an error state here
            } finally {
                 setIsLoading(false); // Set loading false after fetching
            }
        };
        fetchData();
    // Depend on post.ideaId and potentially post.userId if used as fallback
    }, [post.ideaId, post.userId]);

    // Show loader while fetching
    if (isLoading) {
         return <div className="bg-gradient-to-br from-[#1A1A24] to-[#1D2E3A] rounded-2xl p-6 shadow-lg border border-cyan-400/20 animate-pulse h-40"></div>;
    }

    // Don't render if essential data is missing after loading
    if (!user || !idea) return null;

    return (
        <div className="bg-gradient-to-br from-[#1A1A24] to-[#1D2E3A] rounded-2xl p-6 shadow-lg border border-cyan-400/20">
            <div className="flex items-start space-x-4">
                <button onClick={() => setPage('profile', user.userId)} className="flex-shrink-0">
                     {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                    <img className="h-12 w-12 rounded-full object-cover bg-gray-700" src={user.avatarUrl || '/Synapse/default-avatar.png'} alt={user.displayName || user.username} />
                </button>
                <div className="flex-1 min-w-0"> {/* Allow truncation */}
                    <p className="text-sm text-gray-400 mb-2 truncate"> {/* Add truncation */}
                         {/* --- (FIXED) Use displayName --- */}
                        <button onClick={() => setPage('profile', user.userId)} className="font-medium hover:underline text-white">{user.displayName || user.username}</button>
                        's project{' '}
                        <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="font-medium hover:underline text-indigo-400">{idea.title}</button>
                        {' '}just achieved a milestone &middot; {timeAgo(post.createdAt)}
                    </p>

                    <div className="bg-black/20 p-4 rounded-lg flex items-center space-x-4 border border-white/10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cyan-400/10 flex-shrink-0">
                            <RocketIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div className="min-w-0"> {/* Allow truncation */}
                            <p className="text-sm text-gray-400">Milestone Completed</p>
                            {/* Use post.title as fallback if milestoneTitle isn't present */}
                            <h3 className="font-bold text-xl text-white truncate" title={post.milestoneTitle || post.title}>{post.milestoneTitle || post.title || 'Untitled Milestone'}</h3>
                             <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="mt-2 text-cyan-400 text-sm font-semibold hover:underline">
                                View Project Progress &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};