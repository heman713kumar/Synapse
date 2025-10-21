// C:\Users\hemant\Downloads\synapse\src\services\geminiService.ts
import api from './backendApiService'; // Import your backend API service
import { Idea, User, Questionnaire, KanbanTask } from "../types"; // Keep types if needed for parameters

/**
 * Calls the backend API to validate an idea using AI.
 * @param ideaData - Data about the idea (title, description, category).
 * @returns {Promise<any>} A promise that resolves with the analysis object from the backend.
 */
export const validateIdeaWithGemini = async (ideaData: { title: string; description: string; category?: string }): Promise<any> => {
    console.log("Calling backend API for AI validation...");
    try {
        // Ensure api.analyzeIdea exists in backendApiService and matches the backend endpoint /api/ai/analyze-idea
        const response = await api.analyzeIdea(ideaData);
        // Ensure the backend response structure matches this access
        return response.analysis;
    } catch (error) {
        console.error("Backend validation call failed:", error);
        // Return a fallback structure indicating failure
        return {
            error: `Failed to get analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
            feasibility: { score: 0, reason: "Analysis unavailable" },
            innovation: { score: 0, reason: "Analysis unavailable" },
            marketPotential: { score: 0, reason: "Analysis unavailable" },
            strengths: ["Could not retrieve AI analysis."],
            weaknesses: [],
            recommendations: [],
            similarIdeas: [],
            estimatedDevelopmentTime: "Unknown"
        };
    }
};

/**
 * Calls the backend API to refine text using AI.
 * @param text - The text to refine.
 * @returns {Promise<string>} A promise that resolves with the refined text from the backend.
 */
export const refineTextWithGemini = async (text: string): Promise<string> => {
   console.log("Calling backend API for AI text refinement...");
   try {
     // Ensure api.refineSummary exists in backendApiService and matches the backend endpoint /api/ai/refine-summary
     const response = await api.refineSummary({ summary: text });
     // Ensure the backend response structure matches this access
     return response.refinedSummary;
   } catch (error) {
     console.error("Backend refinement call failed:", error);
     // Return original text with an error note
     return text + `\n\n---\nAI Refinement Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
   }
};

/**
 * Calls the backend API to get collaboration matches.
 * @param idea - The idea object.
 * @param potentialCollaborators - Array of users to consider (might not be needed if backend handles user pool).
 * @returns {Promise<Array<{userId: string, matchScore: number, reason: string}>>} A promise resolving with matches.
 */
export const getCollaborationMatches = async (idea: Idea, potentialCollaborators: User[]): Promise<{userId: string, matchScore: number, reason: string}[]> => {
    console.log("Calling backend API for AI collaboration matches...");
    try {
        // Ensure api.getRecommendedCollaborators exists in backendApiService
        // Backend might only need ideaId
        const matches = await api.getRecommendedCollaborators(idea.ideaId);
        return matches;
    } catch (error) {
        console.error("Backend collaboration match call failed:", error);
        return [];
    }
};

/**
 * Calls the backend API to generate Kanban tasks from an idea board.
 * @param idea - The idea object containing the idea board.
 * @returns {Promise<Array<Omit<KanbanTask, 'id'>>>} A promise resolving with task suggestions.
 */
export const generateKanbanTasksFromIdeaBoard = async (idea: Idea): Promise<Omit<KanbanTask, 'id'>[]> => {
    console.log("Calling backend API for AI Kanban task generation...");
    try {
        // Ensure you have a backend endpoint and corresponding api service function
        // e.g., api.generateKanbanTasks(idea.ideaId) that calls POST /api/ai/generate-tasks
        // const tasks = await api.generateKanbanTasks(idea.ideaId);
        // return tasks;

        // --- TEMPORARY Placeholder ---
        console.warn("generateKanbanTasksFromIdeaBoard using placeholder - needs backend endpoint.");
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
             { title: "(AI Placeholder) Define Core Features", description: "Goal: List the essential features for MVP. Outcome: A prioritized list of features." },
             { title: "(AI Placeholder) Setup Project Environment", description: "Goal: Initialize development setup. Outcome: Repository created, basic dependencies installed." },
        ];
        // --- End Placeholder ---

    } catch (error) {
        console.error("Backend Kanban task generation call failed:", error);
         return [{ title: "Error Generating Tasks", description: `Failed to contact AI service: ${error instanceof Error ? error.message : 'Unknown'}` }];
    }
};

// Note: This file now correctly delegates AI operations to the backend
// via the functions imported from './backendApiService'.
// Ensure the backend API service (api object) and the actual backend server
// implement the corresponding endpoints (/api/ai/analyze-idea, /api/ai/refine-summary, etc.).