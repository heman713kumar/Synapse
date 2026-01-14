// C:\Users\hemant\Downloads\synapse\src\components\IdeaCard.tsx
import React, { useState, useEffect } from 'react';
import { Idea, User, Page, ProgressStage } from '../types';
import api from '../services/backendApiService';
import { LightbulbIcon, MessageSquareIcon, AlertTriangleIcon } from './icons';
import { PROGRESS_STAGES } from '../constants';

interface IdeaCardProps {
    idea: Idea;
    setPage: (page: Page, id?: string) => void;
}

/* -------------------- PROGRESS TRACKER -------------------- */

const IdeaProgressTracker: React.FC<{ currentStageId?: ProgressStage }> = ({ currentStageId }) => {
    const stageId = currentStageId || 'idea-stage';
    const currentIndex = Math.max(0, PROGRESS_STAGES.findIndex(s => s.id === stageId));

    return (
        <div className="mt-4">
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    className="h-1.5 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${((currentIndex + 1) / PROGRESS_STAGES.length) * 100}%` }}
                />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {PROGRESS_STAGES.map((stage, index) => (
                    <span
                        key={stage.id}
                        className={index === currentIndex ? 'font-semibold text-gray-900 dark:text-white' : ''}
                    >
                        {stage.name}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* -------------------- MAIN CARD -------------------- */

const IdeaCardComponent: React.FC<IdeaCardProps> = ({ idea, setPage }) => {
    const [owner, setOwner] = useState<User | null>(null);
    const [backendOnline, setBackendOnline] = useState(true);
    const [loadingOwner, setLoadingOwner] = useState(true);

    useEffect(() => {
        const fetchOwner = async () => {
            setLoadingOwner(true);
            setBackendOnline(true);

            if (!idea.ownerId) {
                setLoadingOwner(false);
                return;
            }

            // const healthy = await api.checkBackendHealth();
            // if (!healthy) {
            //     setBackendOnline(false);
            //     setLoadingOwner(false);
            //     return;
            // }

            try {
                const user = await api.getUserById(idea.ownerId);
                setOwner(user);
            } catch {
                setOwner(null);
            } finally {
                setLoadingOwner(false);
            }
        };

        fetchOwner();
    }, [idea.ownerId]);

    const timeAgo = (date?: string) => {
        if (!date) return 'just now';
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const likes = idea.likesCount ?? 0;
    const comments = idea.commentsCount ?? 0;
    const tags = idea.tags ?? [];

    return (
        <article className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            
            {/* Backend warning */}
            {!backendOnline && (
                <div className="mb-3 flex items-center gap-2 text-sm text-red-500">
                    <AlertTriangleIcon className="w-4 h-4" />
                    Owner information unavailable
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4">
                {loadingOwner ? (
                    <div className="h-11 w-11 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                ) : (
                    <button
                        onClick={() => owner && setPage('profile', owner.userId)}
                        disabled={!owner || !backendOnline}
                    >
                        <img
                            src={owner?.avatarUrl || '/Synapse/default-avatar.png'}
                            alt={owner?.displayName || 'User'}
                            className="h-11 w-11 rounded-full object-cover"
                            onError={e => {
                                (e.target as HTMLImageElement).src = '/Synapse/default-avatar.png';
                            }}
                        />
                    </button>
                )}

                <div className="min-w-0 flex-1">
                    <button
                        onClick={() => setPage('ideaDetail', idea.ideaId)}
                        className="block text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 truncate"
                        title={idea.title}
                    >
                        {idea.title}
                    </button>

                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {loadingOwner ? (
                            <span className="inline-block h-4 w-40 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
                        ) : (
                            <>
                                {owner?.displayName || 'Unknown User'} · {timeAgo(idea.createdAt)}
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Summary */}
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {idea.summary}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {tags.slice(0, 3).map(tag => (
                        <span
                            key={tag}
                            className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                            {tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                            +{tags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Progress */}
            <IdeaProgressTracker currentStageId={idea.progressStage} />

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1">
                        <LightbulbIcon className="w-4 h-4" />
                        {likes}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageSquareIcon className="w-4 h-4" />
                        {comments}
                    </span>
                </div>

                <button
                    onClick={() => setPage('ideaDetail', idea.ideaId)}
                    className="font-medium text-indigo-600 hover:underline"
                    disabled={!backendOnline}
                >
                    View details
                </button>
            </div>
        </article>
    );
};

export const IdeaCard = React.memo(IdeaCardComponent);
