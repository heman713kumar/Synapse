import React, { useState, useEffect } from 'react';
import { MilestonePost, User, Page, Idea } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { RocketIcon } from './icons';

interface MilestonePostCardProps {
    post: MilestonePost;
    setPage: (page: Page, id?: string) => void;
}

export const MilestonePostCard: React.FC<MilestonePostCardProps> = ({ post, setPage }) => {
    const [user, setUser] = useState<User | null>(null);
    const [idea, setIdea] = useState<Idea | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // api is now backendApiService
                const ideaData = await api.getIdeaById(post.ideaId);
                setIdea(ideaData);
                if (ideaData) {
                    const userData = await api.getUserById(ideaData.ownerId);
                    setUser(userData);
                }
            } catch (error) {
                console.error("Failed to fetch milestone post data:", error);
            }
        };
        fetchData();
    }, [post]);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "just now";
    };

    if (!user || !idea) return null; // Don't render if data is missing

    return (
        <div className="bg-gradient-to-br from-[#1A1A24] to-[#1D2E3A] rounded-2xl p-6 shadow-lg border border-cyan-400/20">
            <div className="flex items-start space-x-4">
                <button onClick={() => setPage('profile', user.userId)} className="flex-shrink-0">
                    <img className="h-12 w-12 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                </button>
                <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">
                        <button onClick={() => setPage('profile', user.userId)} className="font-medium hover:underline text-white">{user.name}</button>
                        's project{' '}
                        <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="font-medium hover:underline text-indigo-400">{idea.title}</button>
                        {' '}just achieved a milestone &middot; {timeAgo(post.createdAt)}
                    </p>
                    
                    <div className="bg-black/20 p-4 rounded-lg flex items-center space-x-4 border border-white/10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cyan-400/10 flex-shrink-0">
                            <RocketIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Milestone Completed</p>
                            <h3 className="font-bold text-xl text-white">{post.milestoneTitle}</h3>
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