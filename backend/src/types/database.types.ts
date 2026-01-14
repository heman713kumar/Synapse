// C:\Users\hemant\Downloads\synapse\backend\src\types\database.types.ts

// --- FIX: Complete interface definitions based on router usage ---

export type UserType = 'thinker' | 'doer' | 'investor';
export type ProgressStage = 'idea' | 'planning' | 'development' | 'launch';

export interface User {
    userId: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    userType: UserType;
    skills: { skillName: string, endorsers: string[] }[]; // Assuming array of objects
    interests: string[];
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Idea {
    ideaId: string;
    title: string;
    summary: string;
    description: string;
    category: string;
    stage: ProgressStage;
    tags: string[];
    ownerId: string;
    isPublic: boolean;
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
    // ... potentially other fields
}

// Add this export {}; to ensure it's treated as a module
export {};