// Single source of truth: re-export everything from the comprehensive types.ts
// This file existed as a partial duplicate which shadowed the full type definitions.
// Re-exporting keeps all imports (`from '../types'`) working without modification.
export * from '../types';

// IdeaCardProps / NewIdeaFormProps were defined only here previously — keep them.
import type { Idea, Page, AchievementId } from '../types';

export interface IdeaCardProps {
    idea: Idea;
    setPage: (page: Page, id?: string) => void;
}

export interface NewIdeaFormProps {
    setPage: (page: Page, id?: string) => void;
    setSelectedIdeaId: (id: string | null) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}
