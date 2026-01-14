import React, { useState, useEffect, useMemo } from 'react';
import { FeedItem, User, Page, Idea } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { AchievementPostCard } from './AchievementPostCard';
import { MilestonePostCard } from './MilestonePostCard';
import { SECTORS, REGIONS, SKILLS } from '../constants';
import { LoaderIcon } from './icons';

type SortOrder = 'relevant' | 'trending' | 'likes' | 'newest' | 'collaboration' | 'skillMatch';

/* -------------------- SCORING FUNCTIONS -------------------- */

const calculateRelevanceScore = (idea: Idea, user: User | null) => {
    if (!user) return 0;

    const ideaRequiredSkills = idea.requiredSkills || [];
    const ideaTags = idea.tags || [];

    const userSkills = new Set(user.skills?.map(s => s.skillName));
    const userInterests = new Set(user.interests || []);

    let score = 0;

    ideaRequiredSkills.forEach(skill => userSkills.has(skill) && (score += 15));
    ideaTags.forEach(tag => userInterests.has(tag) && (score += 5));
    if (idea.sector && userInterests.has(idea.sector)) score += 10;

    return score;
};

const calculateTrendingScore = (idea: Idea) => {
    const createdAtTime = idea.createdAt ? new Date(idea.createdAt).getTime() : Date.now();
    const hoursAgo = (Date.now() - createdAtTime) / (1000 * 60 * 60);
    const engagement = (idea.likesCount || 0) + (idea.commentsCount || 0) * 2;
    return engagement / Math.pow(Math.max(hoursAgo, 0) + 2, 1.8);
};

const calculateCollaborationScore = (idea: Idea) => {
    const ideaRequiredSkills = idea.requiredSkills || [];
    const ideaCollaborators = idea.collaborators || [];
    let score = ideaRequiredSkills.length * 5 + (idea.commentsCount || 0) * 2;

    score += ideaCollaborators.length === 0 ? 25 : 10 / ideaCollaborators.length;

    const skillsLooking = idea.questionnaire?.skillsLooking || '';
    if (skillsLooking.trim().length > 5) score += 15;

    return score;
};

const calculateSkillMatchScore = (idea: Idea, user: User | null) => {
    if (!user?.skills?.length) return 0;

    const ideaRequiredSkills = idea.requiredSkills || [];
    const userSkills = new Set(user.skills.map((s: { skillName: string }) => s.skillName));

    return ideaRequiredSkills.filter(skill => userSkills.has(skill)).length;
};


/* -------------------- MAIN COMPONENT -------------------- */

interface FeedProps {
    currentUser: User | null;
    setPage: (page: Page, id?: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, setPage }) => {
    /* -------------------- STATE -------------------- */
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(currentUser ? 'relevant' : 'trending');
    const [filters, setFilters] = useState({
        sector: currentUser?.interests?.find(i => SECTORS.includes(i)) || '',
        region: '',
        skills: [] as string[],
    });

    const selectBaseClass =
        'block w-full bg-white dark:bg-[#252532] border-2 border-gray-300 dark:border-[#374151] rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500';

    /* -------------------- EFFECTS -------------------- */
    useEffect(() => {
    const fetchFeed = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getFeedItems();

            // Ensure type literals are correct
   const typedFeed: FeedItem[] = (data || []).map(item => {
    switch (item.type) {
        case 'idea':
            return { type: 'idea' as const, data: item.data };
        case 'milestone':
            return { type: 'milestone' as const, data: item.data };
        case 'achievement':
            return { type: 'achievement' as const, data: item.data };
        default:
            return item as FeedItem;
    }
});


            setFeedItems(typedFeed);
        } catch (e: any) {
            setError(`Failed to load the feed: ${e.message || 'Please try again later.'}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchFeed();
}, []);



    /* -------------------- HANDLERS -------------------- */
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSkillsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected: string[] = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setFilters(prev => ({ ...prev, skills: selected }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setSearchQuery(e.target.value);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setSortOrder(e.target.value as SortOrder);

    const clearFilters = () => setFilters({ sector: '', region: '', skills: [] });

    /* -------------------- FILTERED & SORTED FEED -------------------- */
    const filteredItems = useMemo(() => {
        let items = [...feedItems];

        // FILTERING
        items = items.filter(item => {
            if (item.type === 'achievement' || item.type === 'milestone') return true;

            const idea = item.data;
            if (!idea) return false;

            const title = idea.title || '';
            const summary = idea.summary || '';
            const requiredSkills = idea.requiredSkills || [];

            let matches = searchQuery
                ? title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  summary.toLowerCase().includes(searchQuery.toLowerCase())
                : true;

            if (matches && filters.sector) matches = idea.sector === filters.sector;
            if (matches && filters.region) matches = idea.region === filters.region;
            if (matches && filters.skills.length > 0)
                matches = filters.skills.some(skill => requiredSkills.includes(skill));

            return matches;
        });

        // SORTING
        items.sort((a, b) => {
            const dateA = a.data?.createdAt ? new Date(a.data.createdAt).getTime() : 0;
            const dateB = b.data?.createdAt ? new Date(b.data.createdAt).getTime() : 0;

            if (sortOrder === 'newest') return dateB - dateA;

            let scoreA = 0;
            let scoreB = 0;

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
            } else if (a.type === 'idea') scoreA = 1;
            else if (b.type === 'idea') scoreB = 1;

            return scoreB - scoreA || dateB - dateA;
        });

        return items;
    }, [feedItems, filters, searchQuery, sortOrder, currentUser]);

    /* -------------------- RENDERERS -------------------- */
    const renderFeedItem = (item: FeedItem) => {
        if (!item.data) return null;
        switch (item.type) {
            case 'idea':
                return <IdeaCard key={item.data.ideaId} idea={item.data} setPage={setPage} />;
            case 'achievement':
                return item.data.postId ? (
                    <AchievementPostCard key={item.data.postId} post={item.data} setPage={setPage} />
                ) : null;
            case 'milestone':
                return item.data.postId ? (
                    <MilestonePostCard key={item.data.postId} post={item.data} setPage={setPage} />
                ) : null;
            default:
                return null;
        }
    };

    /* -------------------- JSX -------------------- */
    return (
        <div className="container mx-auto p-4 md:p-8 animate-fadeInUp">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Idea Feed</h1>

                {/* FILTER SECTION */}
                <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-white/10 mb-6">
                    <div className="mb-4">
                        <label htmlFor="search-ideas" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Search Ideas
                        </label>
                        <input
                            id="search-ideas"
                            type="text"
                            placeholder="Search by keywords in title or summary..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={selectBaseClass}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Sector */}
                        <FilterSelect label="Sector" name="sector" value={filters.sector} options={SECTORS} onChange={handleFilterChange} />
                        {/* Region */}
                        <FilterSelect label="Region" name="region" value={filters.region} options={REGIONS} onChange={handleFilterChange} />
                        {/* Skills */}
                        <FilterSelect label="Required Skills" name="skills" value={filters.skills} options={SKILLS} onChange={handleSkillsChange} multiple className="h-24 scrollbar-thin" />
                        {/* Sort */}
                        <FilterSelect
                            label="Sort By"
                            name="sortOrder"
                            value={sortOrder}
                            options={[
                                { label: 'Most Relevant', value: 'relevant' },
                                ...(currentUser ? [{ label: 'Skill Match', value: 'skillMatch' }] : []),
                                { label: 'Trending', value: 'trending' },
                                { label: 'Most Liked', value: 'likes' },
                                { label: 'Collaboration Opportunity', value: 'collaboration' },
                                { label: 'Newest', value: 'newest' },
                            ]}
                            onChange={handleSortChange}
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button onClick={clearFilters} className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                            Clear All Filters
                        </button>
                    </div>
                </div>

                {/* FEED CONTENT */}
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <LoaderIcon className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                )}

                {error && <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg text-center">{error}</div>}

                {!isLoading && !error && (
                    <div className="space-y-6">
                        {filteredItems.length > 0
                            ? filteredItems.map(renderFeedItem)
                            : <div className="bg-white dark:bg-[#1A1A24]/70 backdrop-blur-md p-8 rounded-2xl text-center text-gray-500 border border-gray-200 dark:border-white/10">
                                No items match your filter criteria.
                              </div>}
                    </div>
                )}
            </div>
        </div>
    );
};

/* -------------------- FILTER SELECT COMPONENT -------------------- */
interface FilterSelectProps {
    label: string;
    name: string;
    value: string | string[];
    options: string[] | { label: string; value: string }[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    multiple?: boolean;
    className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ label, name, value, options, onChange, multiple = false, className = '' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            multiple={multiple}
            className={`block w-full ${className} bg-white dark:bg-[#252532] border-2 border-gray-300 dark:border-[#374151] rounded-lg shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        >
            {options.map(opt => typeof opt === 'string'
                ? <option key={opt} value={opt}>{opt}</option>
                : <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
        </select>
    </div>
);
