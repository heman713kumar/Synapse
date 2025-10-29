// C:\Users\hemant\Downloads\synapse\src\components\Feed.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FeedItem, User, Page, Idea } from '../types';
// FIX: Changed mockApiService to backendApiService
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { AchievementPostCard } from './AchievementPostCard';
import { MilestonePostCard } from './MilestonePostCard';
import { SECTORS, REGIONS, SKILLS } from '../constants';
import { LoaderIcon } from './icons'; // Added LoaderIcon

type SortOrder = 'relevant' | 'trending' | 'likes' | 'newest' | 'collaboration' | 'skillMatch';

// --- SCORING FUNCTIONS FOR SORTING ---

const calculateRelevanceScore = (idea: Idea, user: User | null): number => {
    if (!user) return 0;
    
    // DEFENSIVE FIX: Ensure all idea properties are treated as arrays/strings
    const ideaRequiredSkills = idea.requiredSkills || [];
    const ideaTags = idea.tags || [];
    
    const userSkills = new Set((user.skills || []).map(s => s.skillName));
    const userInterests = new Set(user.interests || []);

    let relevanceScore = 0;
    
    // Strong boost for matching required skills with user's skills
    (ideaRequiredSkills).forEach(skill => {
        if (userSkills.has(skill)) {
            relevanceScore += 15;
        }
    });

    // Boost for matching idea tags with user's interests
    (ideaTags).forEach(tag => {
        if (userInterests.has(tag)) {
            relevanceScore += 5;
        }
    });

    // Stronger boost for matching the idea's sector with user interests
    if (idea.sector && userInterests.has(idea.sector)) {
        relevanceScore += 10;
    }

    return relevanceScore;
};

const calculateTrendingScore = (idea: Idea): number => {
    // FIX: Safely access createdAt (assume it's an ISO string)
    const createdAtTime = idea.createdAt ? new Date(idea.createdAt).getTime() : Date.now();
    const hoursAgo = (Date.now() - createdAtTime) / (1000 * 60 * 60);
    const gravity = 1.8;
    const engagement = (idea.likesCount || 0) + ((idea.commentsCount || 0) * 2);
    // Add check to prevent division by zero or negative hours (though Math.pow protects somewhat)
    const trendingScore = engagement / Math.pow(Math.max(hoursAgo, 0) + 2, gravity);
    return trendingScore;
};

const calculateCollaborationScore = (idea: Idea): number => {
    let collabScore = 0;
    
    // DEFENSIVE FIX: Treat requiredSkills and collaborators as arrays
    const ideaRequiredSkills = idea.requiredSkills || [];
    const ideaCollaborators = idea.collaborators || [];

    collabScore += ideaRequiredSkills.length * 5;
    collabScore += (idea.commentsCount || 0) * 2;

    // Use safe access for collaborators length
    if (ideaCollaborators.length === 0) {
        collabScore += 25;
    } else {
        collabScore += 10 / (ideaCollaborators.length); 
    }

    // FIX: Ensure questionnaire exists before accessing skillsLooking
    const skillsLookingString = idea.questionnaire?.skillsLooking || '';
    if (skillsLookingString.trim().length > 5) {
        collabScore += 15;
    }

    return collabScore;
};

const calculateSkillMatchScore = (idea: Idea, user: User | null): number => {
    if (!user || !user.skills || user.skills.length === 0) return 0;
    
    // DEFENSIVE FIX: Treat requiredSkills as array
    const ideaRequiredSkills = idea.requiredSkills || [];

    const userSkills = new Set((user.skills || []).map(s => s.skillName));
    let matchCount = 0;

    (ideaRequiredSkills).forEach(skill => {
        if (userSkills.has(skill)) {
            matchCount++;
        }
    });

    return matchCount;
};


interface FeedProps {
    currentUser: User | null;
    setPage: (page: Page, id?: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, setPage }) => {
    const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(currentUser ? 'relevant' : 'trending'); // Default to relevant if logged in
    
    const [filters, setFilters] = useState(() => {
        // --- DEFINITIVE FIX: Add null/undefined check (|| []) to interests ---
        const userInterests = currentUser?.interests || []; 
        const userPrimaryInterest = userInterests.find(i => SECTORS.includes(i));
        return {
            sector: userPrimaryInterest || '',
            region: '',
            skills: [] as string[],
        };
    });

    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Now calls the real API
                const data = await api.getFeedItems();
                setAllFeedItems(data || []); // Ensure data is an array
            } catch (e: any) {
                setError(`Failed to load the feed: ${e.message || 'Please try again later.'}`);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchItems();
    }, []); // Only fetch once on load

    const filteredItems = useMemo(() => {
        let itemsToProcess = [...allFeedItems];

        // Filtering
        itemsToProcess = itemsToProcess.filter(item => {
            // Always show non-idea posts
            if (item.type === 'achievement' || item.type === 'milestone') return true;
            
            const idea = item.data;
            if (!idea) return false; // Guard against bad data
            
            // DEFENSIVE FIXES: Ensure data is usable before calling methods
            const ideaTitle = idea.title || '';
            const ideaSummary = idea.summary || '';
            const ideaRequiredSkills = idea.requiredSkills || [];

            let matches = true;

            if (searchQuery.trim() !== '') {
                const lowercasedQuery = searchQuery.toLowerCase();
                // FIX: Use guaranteed strings for searching
                matches = ideaTitle.toLowerCase().includes(lowercasedQuery) ||
                          ideaSummary.toLowerCase().includes(lowercasedQuery);
            }

            if (matches && filters.sector) {
                matches = idea.sector === filters.sector;
            }

            if (matches && filters.region) {
                matches = idea.region === filters.region;
            }

            if (matches && filters.skills.length > 0) {
                // FIX: Use guaranteed array for comparison
                matches = filters.skills.some(skill => (ideaRequiredSkills).includes(skill));
            }
            
            return matches;
        });
        
        // Sorting
        itemsToProcess.sort((a, b) => {
            // Use 'createdAt' which exists on all post types
            const dateA = a.data.createdAt ? new Date(a.data.createdAt).getTime() : 0;
            const dateB = b.data.createdAt ? new Date(b.data.createdAt).getTime() : 0;

            if (sortOrder === 'newest') {
                return dateB - dateA;
            }

            let scoreA = -1;
            let scoreB = -1;

            // Only apply complex scores to ideas
            if (a.type === 'idea' && b.type === 'idea') {
                switch (sortOrder) {
                    case 'likes':
                        scoreA = a.data.likesCount || 0;
                        scoreB = b.data.likesCount || 0;
                        break;
                    case 'relevant':
                        scoreA = calculateRelevanceScore(a.data, currentUser);
                        scoreB = calculateRelevanceScore(b.data, currentUser);
                        break;
                    case 'skillMatch':
                        scoreA = calculateSkillMatchScore(a.data, currentUser);
                        scoreB = calculateSkillMatchScore(b.data, currentUser);
                        break;
                    case 'trending':
                        scoreA = calculateTrendingScore(a.data);
                        scoreB = calculateTrendingScore(b.data);
                        break;
                    case 'collaboration':
                        scoreA = calculateCollaborationScore(a.data);
                        scoreB = calculateCollaborationScore(b.data);
                        break;
                }
            } else if (a.type === 'idea') {
                 scoreA = 1; // Prioritize ideas
                 scoreB = -1;
            } else if (b.type === 'idea') {
                 scoreA = -1;
                 scoreB = 1;
            }

            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            // Fallback for tie-breaking
            return dateB - dateA;
        });

        return itemsToProcess;
    }, [filters, allFeedItems, searchQuery, sortOrder, currentUser]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { options } = e.target;
        const value: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setFilters(prev => ({ ...prev, skills: value }));
    };
    
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortOrder(e.target.value as SortOrder);
    };

    const clearFilters = () => {
        setFilters({ sector: '', region: '', skills: [] });
        setSearchQuery('');
    };

    const selectBaseClass = "block w-full bg-white dark:bg-[#252532] border-2 border-gray-300 dark:border-[#374151] rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";


    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeInUp">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Idea Feed</h1>

                {/* Filter Section */}
                <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-white/10 mb-6">
                    <div className="mb-4">
                        <label htmlFor="search-ideas" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Search Ideas</label>
                        <input
                            id="search-ideas"
                            type="text"
                            name="search"
                            placeholder="Search by keywords in title or summary..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={selectBaseClass}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="sector-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sector</label>
                            <select id="sector-filter" name="sector" value={filters.sector} onChange={handleFilterChange} className={selectBaseClass}>
                                <option value="">All Sectors</option>
                                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="region-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Region</label>
                            <select id="region-filter" name="region" value={filters.region} onChange={handleFilterChange} className={selectBaseClass}>
                                <option value="">All Regions</option>
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-1">
                            <label htmlFor="skills-filter" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Required Skills</label>
                            <select id="skills-filter" name="skills" multiple value={filters.skills} onChange={handleSkillsChange} className={`${selectBaseClass} h-24 scrollbar-thin`}>
                                {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
                            <select id="sort-order" name="sortOrder" value={sortOrder} onChange={handleSortChange} className={selectBaseClass}>
                                <option value="relevant">Most Relevant</option>
                                {currentUser && <option value="skillMatch">Skill Match</option>}
                                <option value="trending">Trending</option>
                                <option value="likes">Most Liked</option>
                                <option value="collaboration">Collaboration Opportunity</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={clearFilters} className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">Clear All Filters</button>
                    </div>
                </div>
                
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <LoaderIcon className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                )}
                
                {error && <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg text-center">{error}</div>}

                {!isLoading && !error && (
                    <div className="space-y-6">
                        {filteredItems.length > 0 ? (
                             filteredItems.map(item => {
                                // Ensure item.data exists before passing to components
                                if (!item.data) return null; 

                                if (item.type === 'idea') {
                                    return <IdeaCard key={item.data.ideaId} idea={item.data} setPage={setPage} />
                                }
                                if (item.type === 'achievement') {
                                    // Make sure post data is valid
                                    if (!item.data.postId) return null;
                                    return <AchievementPostCard key={item.data.postId} post={item.data} setPage={setPage} />
                                }
                                if (item.type === 'milestone') {
                                    // Make sure post data is valid
                                    if (!item.data.postId) return null;
                                    return <MilestonePostCard key={item.data.postId} post={item.data} setPage={setPage} />
                                }
                                return null;
                             })
                        ) : (
                            <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md p-8 rounded-2xl text-center text-gray-500 border border-gray-200 dark:border-white/10">
                                No items match your filter criteria.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};