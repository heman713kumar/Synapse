import React, { useState, useEffect } from 'react';
import { Idea, User, Page } from '../types';
import { api } from '../services/mockApiService';
import { IdeaCard } from './IdeaCard';
import { SECTORS } from '../constants';

interface ExploreProps {
    currentUser: User;
    setPage: (page: Page, id?: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({ currentUser, setPage }) => {
    const [ideasBySector, setIdeasBySector] = useState<Record<string, Idea[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // FIX: Replaced non-existent api.getIdeas() with api.getAllIdeas()
        api.getAllIdeas().then(allIdeas => {
            const groupedIdeas: Record<string, Idea[]> = {};
            for (const sector of SECTORS) {
                groupedIdeas[sector] = allIdeas.filter(idea => idea.sector === sector);
            }
            setIdeasBySector(groupedIdeas);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="text-center p-8">Loading ideas to explore...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Explore Ideas</h1>

                <div className="space-y-10">
                    {SECTORS.map(sector => {
                        const ideas = ideasBySector[sector];
                        if (!ideas || ideas.length === 0) return null;

                        return (
                            <section key={sector}>
                                <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-indigo-500 pl-3">{sector}</h2>
                                <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                                    {ideas.map(idea => (
                                        <div key={idea.ideaId} className="w-80 flex-shrink-0">
                                            <IdeaCard idea={idea} currentUser={currentUser} setPage={setPage} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};