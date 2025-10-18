import React, { useState, useEffect } from 'react';
import { AchievementPost, User, Page } from '../types';
import { api } from '../services/mockApiService';
import { ACHIEVEMENTS } from '../constants';
import * as Icons from './icons';

interface AchievementPostCardProps {
    post: AchievementPost;
    setPage: (page: Page, id?: string) => void;
}

export const AchievementPostCard: React.FC<AchievementPostCardProps> = ({ post, setPage }) => {
    const [user, setUser] = useState<User | null>(null);
    const achievement = ACHIEVEMENTS[post.achievementId];

    useEffect(() => {
        api.getUserById(post.userId).then(setUser);
    }, [post.userId]);
    
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    if (!user || !achievement) return null;

    const IconComponent = Icons[achievement.icon as keyof typeof Icons] || Icons.TrophyIcon;

    return (
        <div className="bg-gradient-to-br from-[#1A1A24] to-[#252532] rounded-2xl p-6 shadow-lg border border-yellow-400/20">
            <div className="flex items-start space-x-4">
                <button onClick={() => setPage('profile', user.userId)} className="flex-shrink-0">
                    <img className="h-12 w-12 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                </button>
                <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">
                        <button onClick={() => setPage('profile', user.userId)} className="font-medium hover:underline text-white">{user.name}</button>
                        {' '}unlocked a new badge &middot; {timeAgo(post.createdAt)}
                    </p>
                    
                    <div className="bg-black/20 p-4 rounded-lg flex items-center space-x-4 border border-white/10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-yellow-400/10 flex-shrink-0">
                            <IconComponent className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-white">{achievement.name}</h3>
                            <p className="text-sm text-gray-300">{achievement.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
