import React, { useState, useEffect } from 'react';
import { Idea, User, Page, ProgressStage } from '../types';
import { api } from '../services/mockApiService';
import { LightbulbIcon, MessageSquareIcon } from './icons';
import { PROGRESS_STAGES } from '../constants';

interface IdeaCardProps {
    idea: Idea;
    currentUser: User | null;
    setPage: (page: Page, id?: string) => void;
}

const IdeaProgressTracker: React.FC<{ currentStageId: ProgressStage }> = ({ currentStageId }) => {
    const currentStageIndex = PROGRESS_STAGES.findIndex(s => s.id === currentStageId);
    
    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${((currentStageIndex + 0.5) / PROGRESS_STAGES.length) * 100}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                {PROGRESS_STAGES.map((stage, index) => (
                    <span key={stage.id} className={`w-1/4 text-center ${index === currentStageIndex ? 'font-bold text-gray-800 dark:text-white' : ''}`}>
                        {stage.name}
                    </span>
                ))}
            </div>
        </div>
    );
};

const IdeaCardComponent: React.FC<IdeaCardProps> = ({ idea, currentUser, setPage }) => {
    const [owner, setOwner] = useState<User | null>(null);

    useEffect(() => {
        api.getUserById(idea.ownerId).then(setOwner);
    }, [idea.ownerId]);

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

    return (
        <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/40 hover:-translate-y-1 transform transition-all duration-300">
            <div className="flex items-start space-x-4">
                <button onClick={() => owner && setPage('profile', owner.userId)} className="flex-shrink-0">
                    <img className="h-12 w-12 rounded-full object-cover" src={owner?.avatarUrl} alt={owner?.name} />
                </button>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                           <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left">
                                {idea.title}
                           </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Posted by <button onClick={() => owner && setPage('profile', owner.userId)} className="font-medium hover:underline">{owner?.name || '...'}</button> &middot; {timeAgo(idea.createdAt)}
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">{idea.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {idea.tags.slice(0, 4).map(tag => (
                             <span key={tag} className="bg-indigo-100 dark:bg-[#252532] text-xs font-semibold px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-300">{tag}</span>
                        ))}
                    </div>
                    <IdeaProgressTracker currentStageId={idea.progressStage} />
                     <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1.5">
                                <LightbulbIcon className="w-5 h-5"/>
                                <span>{idea.likesCount} Likes</span>
                            </span>
                             <span className="flex items-center space-x-1.5">
                                <MessageSquareIcon className="w-5 h-5"/>
                                <span>{idea.commentsCount} Comments</span>
                            </span>
                        </div>
                        <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
                            View Details &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const IdeaCard = React.memo(IdeaCardComponent);