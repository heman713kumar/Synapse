// C:\Users\hemant\Downloads\synapse\src\components\Bookmarks.tsx
import React, { useState, useEffect } from 'react';
import { User, Idea, Page } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { EmptyState } from './EmptyState';
import { BookmarkIcon } from './icons';

interface BookmarksProps {
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({ currentUser, setPage }) => {
    const [bookmarkedIdeas, setBookmarkedIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Now calls the real API
        api.getAllIdeas().then(allIdeas => {
            // Ensure currentUser.bookmarkedIdeas is an array before filtering
            const bookmarkedIds = new Set(currentUser.bookmarkedIdeas || []);
            const userBookmarks = allIdeas.filter(idea => bookmarkedIds.has(idea.ideaId));
            setBookmarkedIdeas(userBookmarks);
        }).catch(err => {
            console.error("Failed to load bookmarked ideas:", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [currentUser.bookmarkedIdeas]);

    if (isLoading) return <div className="text-center p-8">Loading bookmarks...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Bookmarked Ideas</h1>
                <div className="space-y-6">
                    {bookmarkedIdeas.length > 0 ? (
                        bookmarkedIdeas.map(idea => (
                            <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />
                        ))
                    ) : (
                        <EmptyState
                            icon={BookmarkIcon}
                            title="No Bookmarks Yet"
                            message="Save ideas that catch your eye to come back to them later."
                            ctaText="Explore the Feed"
                            onCtaClick={() => setPage('feed')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};