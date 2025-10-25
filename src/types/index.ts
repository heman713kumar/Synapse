export interface User {
    userId: string;
    id?: string; // Add this to fix Login.tsx error
    name: string;
    email: string;
    avatarUrl: string;
    bio: string;
    connections: string[];
    createdAt: string;
}

export interface Idea {
    ideaId: string;
    title: string;
    description: string;
    ownerId: string;
    forumMembers: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ForumMessage {
    messageId: string;
    ideaId: string;
    senderId: string;
    text: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export type Page = 'feed' | 'ideaDetail' | 'profile' | 'explore' | 'connections' | 'achievements' | 'newIdea';

export type AchievementId = 
    | 'first_idea' 
    | 'five_collaborators' 
    | 'forum_enthusiast' 
    | 'popular_idea' 
    | 'early_adopter';

export interface Achievement {
    id: AchievementId;
    name: string;
    description: string;
    icon: string;
}

// Add these interfaces for components that need them:
export interface IdeaCardProps {
    idea: Idea;
    setPage: (page: Page, id?: string) => void;
}

export interface NewIdeaFormProps {
    setPage: (page: Page, id?: string) => void;
    setSelectedIdeaId: (id: string | null) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}