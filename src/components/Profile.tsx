// C:\Users\hemant\Downloads\synapse\src\components\Profile.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { User, Idea, Page, UserAchievement, SkillEndorsement } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { UsersIcon, MessageSquareIcon, LinkedinIcon, LinkIcon, MoreVerticalIcon, FlagIcon, TrophyIcon, LightbulbIcon, PlusIcon, LoaderIcon } from './icons';
import { ReportModal } from './ReportModal';
import { AchievementCard } from './AchievementCard';
import { ACHIEVEMENTS } from '../constants';
import { EmptyState } from './EmptyState';

interface ProfileProps {
    userId: string;
    currentUser: User | null;
    setPage: (page: Page, id?: string) => void;
}

const SkillBadgeComponent: React.FC<{
    skill: SkillEndorsement;
    currentUser: User | null;
    isEndorsable: boolean;
    onEndorse: () => void;
}> = ({ skill, currentUser, isEndorsable, onEndorse }) => {
    const [endorserUsers, setEndorserUsers] = useState<User[]>([]);
    
    const endorserIds = useMemo(() => skill?.endorsers || [], [skill?.endorsers]);

    useEffect(() => {
        const fetchEndorsers = async () => {
            if (endorserIds.length === 0) return;
            try {
                const users = await Promise.all(
                    endorserIds.slice(0, 3).map(id => api.getUserById(id))
                );
                setEndorserUsers(users.filter((u): u is User => u !== null));
            } catch (error) {
                console.error("Failed to fetch endorsers:", error);
            }
        };
        fetchEndorsers();
    }, [endorserIds]);

    const isEndorsedByCurrentUser = !!currentUser && endorserIds.includes(currentUser.userId);

    return (
        <div className="bg-[#252532] rounded-lg p-3 flex items-center space-x-3 transition-colors duration-200">
            <div className="flex-1">
                <p className="font-semibold text-white">{skill?.skillName || 'Unnamed Skill'}</p>
                {endorserIds.length > 0 ? (
                    <div className="flex items-center space-x-1 mt-1">
                        <div className="flex -space-x-2">
                            {endorserUsers.map(user => (
                                <img 
                                    key={user.userId} 
                                    // --- FIX: Updated path for GitHub Pages subfolder ---
                                    src={user.avatarUrl || '/Synapse/default-avatar.png'} 
                                    alt={user.displayName || 'User'} 
                                    className="w-5 h-5 rounded-full ring-2 ring-[#252532]" 
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-400">Endorsed by {endorserIds.length} {endorserIds.length === 1 ? 'person' : 'people'}</span>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No endorsements yet.</p>
                )}
            </div>
            {isEndorsable && currentUser && (
                <button
                    onClick={onEndorse}
                    className={`p-2 rounded-full transition-all duration-200 ${isEndorsedByCurrentUser ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-indigo-600 text-gray-300'}`}
                    title={isEndorsedByCurrentUser ? 'Retract Endorsement' : 'Endorse Skill'}
                    aria-pressed={isEndorsedByCurrentUser}
                >
                    <PlusIcon className={`w-4 h-4 transition-transform ${isEndorsedByCurrentUser ? 'rotate-45' : 'rotate-0'}`} />
                </button>
            )}
        </div>
    );
};
const SkillBadge = React.memo(SkillBadgeComponent);


export const Profile: React.FC<ProfileProps> = ({ userId, currentUser, setPage }) => {
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
    const [collaborationIdeas, setCollaborationIdeas] = useState<Idea[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ideas' | 'achievements'>('ideas');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setProfileUser(null); 
            setUserIdeas([]);
            setCollaborationIdeas([]);
            setUserAchievements([]);

            try {
                const user = await api.getUserById(userId);
                if (!user) {
                    setError("User not found.");
                    setIsLoading(false);
                    return;
                }
                setProfileUser(user);
                
                const [owned, collaborating, achievementsData] = await Promise.all([
                    api.getIdeasByOwnerId(userId),
                    api.getIdeasByCollaboratorId(userId),
                    api.getUserAchievements(userId),
                ]);

                setUserIdeas(owned || []); 
                setCollaborationIdeas(collaborating || []); 
                setUserAchievements(achievementsData || []); 

                setIsConnected(!!currentUser && (currentUser.connections || []).includes(userId));

            } catch (err) {
                setError("Failed to fetch profile data.");
                console.error("Profile fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, currentUser?.connections, currentUser?.userId]);

    const handleConnection = async () => {
        if (isConnecting || !currentUser) return; 
        setIsConnecting(true);
        try {
            await api.sendConnectionRequest(userId);
            setIsConnected(!isConnected); 
        } catch (err) {
            console.error("Connection request failed:", err);
            alert("Failed to send connection request.");
        } finally {
            setIsConnecting(false);
        }
    };
    
    const handleEndorse = async (skillName: string) => {
        if (!profileUser || !currentUser) return; 
        try {
            const updatedUser = await api.endorseSkill(profileUser.userId, skillName);
            if(updatedUser) {
                setProfileUser(prev => prev ? { ...prev, skills: updatedUser.skills } : null);
            }
        } catch (err) {
            console.error("Endorsement failed:", err);
            alert("Failed to endorse skill.");
        }
    };

    const handleReport = () => {
        if (!currentUser) return; 
        setIsReportModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleReportSubmit = async (reason: any, details: string) => {
        if (!profileUser || !currentUser) return; 
        try {
            await api.submitReport({
                contentType: 'user',
                contentId: profileUser.userId,
                reason,
                details,
            });
            setIsReportModalOpen(false);
            alert('Thank you for your report. Our team will review this shortly.');
        } catch (err) {
            console.error("Report submission failed:", err);
            alert("Failed to submit report.");
        }
    };

    if (isLoading) return <div className="text-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-400 inline-block"/></div>;
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;
    if (!profileUser) return <div className="text-center p-8">User not found.</div>;

    const isCurrentUserProfile = currentUser?.userId === profileUser.userId;

    return (
        <> 
            {isReportModalOpen && currentUser && (
                <ReportModal
                    contentId={profileUser.userId}
                    contentType="user"
                    contentTitle={`the profile of ${profileUser.displayName || 'this user'}`}
                    currentUser={currentUser}
                    onClose={() => setIsReportModalOpen(false)}
                    onSubmit={handleReportSubmit}
                />
            )}
            <div className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-[#1A1A24] rounded-2xl shadow-2xl border border-white/10 p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
                            <img 
                                // --- FIX: Updated path for GitHub Pages subfolder ---
                                src={profileUser.avatarUrl || '/Synapse/default-avatar.png'} 
                                alt={profileUser.displayName || 'User'} 
                                className="w-32 h-32 rounded-full ring-4 ring-indigo-500/50 object-cover" 
                            />
                            <div className="flex-1 mt-4 sm:mt-0 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-between">
                                    <h1 className="text-3xl font-bold text-white">{profileUser.displayName || 'User'}</h1>
                                    <div className="relative ml-4">
                                        {currentUser && !isCurrentUserProfile && (
                                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-white/10">
                                                <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
                                            </button>
                                        )}
                                        {isMenuOpen && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[#252532] ring-1 ring-black ring-opacity-5 z-10">
                                                <div className="py-1">
                                                    <button onClick={handleReport} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
                                                        <FlagIcon className="w-4 h-4" />
                                                        <span>Report User</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-300 mt-2">{profileUser.bio || 'No bio provided.'}</p>
                                <div className="mt-4 flex flex-wrap gap-4 justify-center sm:justify-start">
                                    {currentUser && !isCurrentUserProfile && (
                                        <>
                                            <button disabled={isConnecting} onClick={handleConnection} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                                <UsersIcon className="w-5 h-5" />
                                                <span>{isConnected ? 'Connected' : 'Connect'}</span>
                                            </button>
                                            <button onClick={async () => {
                                                if (!currentUser) return; 
                                                try {
                                                    const conv = await api.startConversation(profileUser.userId);
                                                    setPage('chat', conv.conversationId || (conv as any).id); 
                                                } catch(err) {
                                                    console.error("Failed to start conversation", err);
                                                    alert("Could not start conversation.");
                                                }
                                            }} className="flex items-center space-x-2 bg-[#252532] text-white px-4 py-2 rounded-lg hover:bg-[#374151]">
                                                <MessageSquareIcon className="w-5 h-5" />
                                                <span>Message</span>
                                            </button>
                                        </>
                                    )}
                                    {(profileUser.linkedInUrl) && <a href={profileUser.linkedInUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white"><LinkedinIcon className="w-6 h-6" /></a>}
                                    {(profileUser.portfolioUrl) && <a href={profileUser.portfolioUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white"><LinkIcon className="w-6 h-6" /></a>}
                                </div>
                            </div>
                        </div> 

                        <div className="mt-8">
                            <h3 className="text-xl font-semibold text-white mb-4">Skills & Endorsements</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(profileUser.skills || []).length > 0 ? (profileUser.skills || []).map(skill => (
                                    <SkillBadge 
                                        key={skill.skillName} 
                                        skill={skill} 
                                        currentUser={currentUser} 
                                        isEndorsable={!!currentUser && !isCurrentUserProfile}
                                        onEndorse={() => handleEndorse(skill.skillName)}
                                    />
                                )) : <p className="text-gray-500 col-span-full">No skills listed yet.</p>}
                            </div> 
                        </div> 
                    </div> 

                    <div className="mt-8">
                        <div className="border-b border-white/10">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button onClick={() => setActiveTab('ideas')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ideas' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                                    Ideas ({(userIdeas || []).length + (collaborationIdeas || []).length})
                                </button>
                                <button onClick={() => setActiveTab('achievements')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'achievements' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                                    Achievements ({(userAchievements || []).filter(a => a?.unlockedAt).length})
                                </button>
                            </nav>
                        </div>
                        <div className="py-6">
                            {activeTab === 'ideas' && (
                                <div className="space-y-6">
                                    {(userIdeas || []).length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">Owned Ideas</h3>
                                            <div className="space-y-4">
                                                {/* --- (FIXED) Use only ideaId --- */}
                                                {userIdeas.map(idea => <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />)}
                                            </div>
                                        </div>
                                    )}
                                    {(collaborationIdeas || []).length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">Collaborating On</h3>
                                            <div className="space-y-4">
                                                 {/* --- (FIXED) Use only ideaId --- */}
                                                {collaborationIdeas.map(idea => <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />)}
                                            </div>
                                        </div>
                                    )}
                                    {(userIdeas || []).length === 0 && (collaborationIdeas || []).length === 0 && (
                                        <EmptyState
                                            icon={LightbulbIcon}
                                            title="No Ideas Yet"
                                            message={`${isCurrentUserProfile ? 'You haven\'t' : `${profileUser.displayName || 'This user'} hasn't`} posted or joined any ideas yet.`}
                                            {...(isCurrentUserProfile && {
                                                ctaText: "Post Your First Idea",
                                                onCtaClick: () => setPage('newIdea')
                                            })}
                                        />
                                    )}
                                </div>
                            )}
                            {activeTab === 'achievements' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(userAchievements || []).length > 0 ? (userAchievements || []).map(ua => {
                                        const achievementDetails = ua ? ACHIEVEMENTS[ua.achievementId] : null;
                                        if (!achievementDetails) return null; 
                                        // --- (FIXED) Type Assertion for AchievementCard ---
                                        // Ensure the object passed matches the expected prop type
                                        const achievementProp = { 
                                            ...achievementDetails, 
                                            progress: ua.progress || 0, // Provide default if progress is optional
                                            unlockedAt: ua.unlockedAt 
                                        };
                                        return <AchievementCard key={ua.achievementId} achievement={achievementProp} />;
                                    }) : (
                                        <div className="col-span-full">
                                            <EmptyState
                                                icon={TrophyIcon}
                                                title="No Achievements"
                                                message={`${profileUser.displayName || 'This user'} hasn't unlocked any achievements yet.`}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div> 
                    </div> 
                </div> 
            </div> 
        </> 
    );
};