// C:\Users\hemant\Downloads\synapse\src\components\IdeaCard.tsx
import React, { useState, useEffect } from 'react';
import { Idea, User, Page, ProgressStage } from '../types';
// --- (FIX) Import only the default 'api' service ---
import api from '../services/backendApiService';
import { LightbulbIcon, MessageSquareIcon, AlertTriangleIcon } from './icons'; // Added LoaderIcon
import { PROGRESS_STAGES } from '../constants';

interface IdeaCardProps {
    idea: Idea;
    setPage: (page: Page, id?: string) => void;
}

const IdeaProgressTracker: React.FC<{ currentStageId: ProgressStage | undefined }> = ({ currentStageId }) => {
    // Default to 'idea-stage' if undefined
    const stageId = currentStageId || 'idea-stage';
    const currentStageIndex = Math.max(0, PROGRESS_STAGES.findIndex(s => s.id === stageId));

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

const IdeaCardComponent: React.FC<IdeaCardProps> = ({ idea, setPage }) => {
    const [owner, setOwner] = useState<User | null>(null);
    const [backendOnline, setBackendOnline] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOwner = async () => {
            setIsLoading(true);
            setBackendOnline(true); // Assume online initially

            // Skip fetch if ownerId is missing
            if (!idea.ownerId) {
                console.warn(`Idea ${idea.ideaId} is missing ownerId.`);
                setIsLoading(false);
                return;
            }

            // --- (FIX) Call checkBackendHealth from the 'api' service ---
            const isHealthy = await api.checkBackendHealth();
            // --- (FIX) Check the direct boolean response ---
            if (!isHealthy) { 
                setBackendOnline(false);
                setIsLoading(false);
                return;
            }

            try {
                const userData = await api.getUserById(idea.ownerId);
                setOwner(userData);
            } catch (err) {
                console.error(`Failed to fetch owner ${idea.ownerId} for idea ${idea.ideaId}:`, err);
                setOwner(null); // Set owner to null on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchOwner();
    }, [idea.ownerId, idea.ideaId]);

    const timeAgo = (date: string | undefined): string => { // Handle undefined date
        if (!date) return "somewhere in time";
        try {
            const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
            if (isNaN(seconds) || seconds < 0) return "just now"; // Handle invalid date or future date

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
            return Math.max(0, Math.floor(seconds)) + " seconds ago";
        } catch (e) {
             console.error("Error formatting date:", date, e);
             return "unknown date";
        }
    };

    // Safely access properties with defaults
    const likes = idea.likesCount ?? 0;
    const comments = idea.commentsCount ?? 0;
    const tags = idea.tags || [];
    const stage = idea.progressStage; // Pass undefined if missing

    return (
        <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/40 hover:-translate-y-1 transform transition-all duration-300">
            {!backendOnline && (
                <div className="mb-4 p-2 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center space-x-2">
                    <AlertTriangleIcon className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm">Owner data unavailable</span>
                </div>
            )}

            <div className="flex items-start space-x-4">
                <button
                    onClick={() => owner && setPage('profile', owner.userId)}
                    className="flex-shrink-0"
                    disabled={!backendOnline || isLoading || !owner} // Disable if loading or no owner
                >
                    {isLoading ? (
                        <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                    ) : (
                        <img
                            className="h-12 w-12 rounded-full object-cover bg-gray-300 dark:bg-gray-700"
                            // --- FIX: Updated path for GitHub Pages subfolder ---
                            src={owner?.avatarUrl || '/Synapse/default-avatar.png'}
                             // --- (FIXED) Use displayName ---
                            alt={owner?.displayName || owner?.username || 'User'}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // --- FIX: Updated path for GitHub Pages subfolder ---
                                target.src = '/Synapse/default-avatar.png'; // Fallback image on error
                            }}
                        />
                    )}
                </button>
                <div className="flex-1 min-w-0"> {/* Added min-w-0 for flex truncation */}
                    <div className="flex justify-between items-start">
                        <div className="min-w-0"> {/* Added min-w-0 */}
                           <button
                                onClick={() => setPage('ideaDetail', idea.ideaId)}
                                className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block" // Added truncate
                                disabled={!backendOnline}
                                title={idea.title} // Add title attribute for full text on hover
                            >
                                {idea.title}
                           </button>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate"> {/* Added truncate */}
                                {isLoading ? (
                                    <span className="inline-block h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></span>
                                ) : (
                                    <>
                                        Posted by{' '}
                                        <button
                                            onClick={() => owner && setPage('profile', owner.userId)}
                                            className="font-medium hover:underline disabled:no-underline"
                                            disabled={!backendOnline || !owner}
                                        >
                                            {/* --- (FIXED) Use displayName --- */}
                                            {owner?.displayName || owner?.username || 'Unknown User'}
                                        </button>{' '}
                                        &middot; {timeAgo(idea.createdAt)}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                    {/* Ensure summary exists and is not too long */}
                    <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{idea.summary}</p>

                    {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.slice(0, 3).map(tag => ( // Limit tags shown
                                <span
                                    key={tag}
                                    className="bg-indigo-100 dark:bg-[#252532] text-xs font-semibold px-3 py-1 rounded-full text-indigo-700 dark:text-indigo-300"
                                >
                                    {tag}
                                </span>
                            ))}
                            {tags.length > 3 && (
                                 <span className="bg-gray-100 dark:bg-gray-700 text-xs font-semibold px-3 py-1 rounded-full text-gray-600 dark:text-gray-400">
                                    +{tags.length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    <IdeaProgressTracker currentStageId={stage} />

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1.5">
                                <LightbulbIcon className="w-5 h-5"/>
                                <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
                            </span>
                             <span className="flex items-center space-x-1.5">
                                <MessageSquareIcon className="w-5 h-5"/>
                                <span>{comments} {comments === 1 ? 'Comment' : 'Comments'}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setPage('ideaDetail', idea.ideaId)}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold disabled:opacity-50"
                            disabled={!backendOnline}
                        >
                            View Details &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const IdeaCard = React.memo(IdeaCardComponent);