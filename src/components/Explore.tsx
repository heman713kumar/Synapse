// C:\Users\hemant\Downloads\synapse\src\components\Explore.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Idea, User, Page } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { LoaderIcon } from './icons';
import { SECTORS } from '../constants';

interface ExploreProps {
    currentUser: User | null;
    setPage: (page: Page, id?: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({ currentUser, setPage }) => {
    const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
    const [trendingIdeas, setTrendingIdeas] = useState<Idea[]>([]);
    const [recommendedIdeas, setRecommendedIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'sectors' | 'trending' | 'recommended'>('sectors');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchExploreData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const ideas = await api.getAllIdeas();
                setAllIdeas(ideas || []);

                const sortedIdeas = [...(ideas || [])].sort((a, b) =>
                    ((b.likesCount || 0) + (b.commentsCount || 0)) -
                    ((a.likesCount || 0) + (a.commentsCount || 0))
                );
                setTrendingIdeas(sortedIdeas.slice(0, 10));

                if (currentUser) {
                    const userInterests = new Set(currentUser.interests || []);
                    const userSkills = new Set((currentUser.skills || []).map(s => s?.skillName).filter(Boolean));

                    const recommended = [...(ideas || [])].filter(idea =>
                        (idea.tags || []).some(tag => userInterests.has(tag)) ||
                        (idea.requiredSkills || []).some(skill => userSkills.has(skill))
                    ).slice(0, 10);
                    setRecommendedIdeas(recommended);
                }

            } catch (err: any) {
                console.error('Failed to fetch explore data:', err);
                setError('Could not load ideas. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchExploreData();
    }, [currentUser]);

    const ideasBySector = useMemo(() => {
        const grouped: Record<string, Idea[]> = {};
        const ideasToFilter = searchQuery
            ? (allIdeas || []).filter(idea =>
                (idea?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (idea?.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
              )
            : (allIdeas || []);

        for (const sector of SECTORS) {
            grouped[sector] = ideasToFilter.filter(idea => idea?.sector === sector);
        }
        return grouped;
    }, [allIdeas, searchQuery]);

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center h-64"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400" /></div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-400">{error}</div>;
        }

        switch (activeTab) {
            case 'sectors':
                 const hasIdeasInSectors = SECTORS.some(sector => ideasBySector[sector]?.length > 0);
                 if (!hasIdeasInSectors && searchQuery) {
                     return <p className="text-gray-400 text-center">No ideas found matching your search.</p>;
                 }
                 if (!hasIdeasInSectors) {
                     return <p className="text-gray-400 text-center">No ideas found in any sector yet.</p>;
                 }

                return (
                    <div className="space-y-10">
                        {SECTORS.map(sector => {
                            const ideas = ideasBySector[sector];
                            if (!ideas || ideas.length === 0) return null;

                            return (
                                <section key={sector}>
                                    <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-indigo-500 pl-3">{sector}</h2>
                                    <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-thin">
                                        {ideas.map(idea => (
                                            <div key={idea.ideaId} className="w-80 flex-shrink-0">
                                                <IdeaCard idea={idea} setPage={setPage} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                );
            case 'trending':
                 if (trendingIdeas.length === 0) {
                     return <p className="text-gray-400 text-center">No trending ideas found yet.</p>;
                 }
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trendingIdeas.map(idea => (
                            <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />
                        ))}
                    </div>
                 );
            case 'recommended':
                 if (!currentUser) return <p className="text-gray-400 text-center">Please log in to see recommendations.</p>;
                 if (recommendedIdeas.length === 0) {
                      return <p className="text-gray-400 text-center col-span-full">No recommendations found. Update your profile interests and skills.</p>;
                 }
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedIdeas.map(idea => (
                            <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />
                        ))}
                    </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Explore Ideas</h1>

                <div className="mb-6">
                    <input
                        type="search"
                        placeholder="Search all ideas by keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A24] border-2 border-[#374151] rounded-lg shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="border-b border-white/10 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('sectors')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sectors' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                            By Sector
                        </button>
                         <button onClick={() => setActiveTab('trending')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'trending' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                            Trending
                        </button>
                         <button onClick={() => setActiveTab('recommended')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recommended' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                            Recommended
                        </button>
                    </nav>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};