// C:\Users\hemant\Downloads\synapse\src\components\AchievementPostCard.tsx
import React, { useState, useEffect } from 'react';
import { AchievementPost, User, Page } from '../types';
import api from '../services/backendApiService';
import { ACHIEVEMENTS } from '../constants';
import * as Icons from './icons';

interface AchievementPostCardProps {
    post: AchievementPost;
    setPage: (page: Page, id?: string) => void;
}

const getIconComponent = (iconName: keyof typeof Icons | undefined) => {
    if (!iconName || !(iconName in Icons)) {
        return Icons.TrophyIcon; // Default icon
    }
    return Icons[iconName] as React.ElementType;
};


export const AchievementPostCard: React.FC<AchievementPostCardProps> = ({ post, setPage }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ensure achievementId exists before looking up details
    const achievementDetails = post?.achievementId ? ACHIEVEMENTS[post.achievementId] : null;

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                if (post?.userId) { // Check if post and userId exist
                    const userData = await api.getUserById(post.userId);
                    setUser(userData);
                } else {
                    console.warn("Achievement post is missing userId:", post);
                }
            } catch (error) {
                console.error(`Failed to fetch user ${post?.userId} for achievement post:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [post?.userId]); // Depend on post.userId

    if (isLoading || !user || !achievementDetails) {
        return <div className="bg-[#1A1A24] p-4 rounded-lg shadow animate-pulse h-32 border border-white/10"></div>;
    }

    const IconComponent = getIconComponent(achievementDetails.icon as keyof typeof Icons);

    return (
        <div className="bg-[#1A1A24] p-4 rounded-lg shadow border border-white/10">
            <div className="flex items-start space-x-3">
                 {/* --- FIX: Updated path for GitHub Pages subfolder --- */}
                <img className="h-12 w-12 rounded-full object-cover" src={user.avatarUrl || '/Synapse/default-avatar.png'} alt={user.displayName || user.username} />
                <div className="flex-1">
                    <p className="text-sm text-gray-400">
                         {/* --- (FIXED) Use displayName --- */}
                        <button onClick={() => setPage('profile', user.userId)} className="font-medium hover:underline text-white">{user.displayName || user.username}</button>
                        {' unlocked the achievement:'}
                    </p>
                    <div className="mt-2 flex items-center space-x-3 bg-[#252532] p-3 rounded-md">
                        <IconComponent className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-white">{achievementDetails.name}</h3>
                            <p className="text-xs text-gray-400">{achievementDetails.description}</p>
                        </div>
                    </div>
                     <p className="text-xs text-gray-500 mt-2 text-right">
                        {/* Safely access createdAt */}
                        {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Date unknown'}
                    </p>
                </div>
            </div>
        </div>
    );
};