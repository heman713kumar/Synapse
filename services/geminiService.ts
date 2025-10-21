// C:\Users\hemant\Downloads\synapse\src\services\geminiService.ts
import api from './backendApiService'; // Import your backend API service

/**
 * @deprecated Frontend should call backend API for AI features.
 * This function is a placeholder and does NOT call the Gemini API directly.
 * Use api.validateIdea (or similar) from backendApiService instead.
 */
export const validateIdeaWithGemini = async (ideaData: { title: string; description: string; category?: string }): Promise<any> => {
    console.warn("DEPRECATED: Frontend validateIdeaWithGemini called. Use backend API via backendApiService.");
    // Example: How you WOULD call your backend (adjust endpoint/data as needed)
    // try {
    //   const response = await api.validateIdeaOnBackend(ideaData); // Assuming you add 'validateIdeaOnBackend' to backendApiService
    //   return response.analysis;
    // } catch (error) {
    //   console.error("Backend validation call failed:", error);
    //   throw error; // Rethrow or handle error appropriately
    // }

    // Return fallback structure ONLY FOR TEMPORARY TESTING
    return {
        marketFit: 0.7, feasibility: 0.6, innovation: 0.8,
        swot: { strengths: ["Placeholder - Call Backend"], weaknesses: ["Placeholder"], opportunities: ["Placeholder"], threats: ["Placeholder"] },
        recommendations: ["Call backend for real analysis"]
    };
};

/**
 * @deprecated Frontend should call backend API for AI features.
 * This function is a placeholder and does NOT call the Gemini API directly.
 * Use api.refineSummary (or similar) from backendApiService instead.
 */
export const refineTextWithGemini = async (existingSummary: string, userInput: string): Promise<string> => {
   console.warn("DEPRECATED: Frontend refineTextWithGemini called. Use backend API via backendApiService.");
   // Example: How you WOULD call your backend (adjust endpoint/data as needed):
   // try {
   //   const response = await api.refineSummaryOnBackend({ summary: existingSummary, feedback: userInput });
   //   return response.refinedSummary;
   // } catch (error) {
   //   console.error("Backend refinement call failed:", error);
   //   throw error;
   // }
   return existingSummary + " - Refined (Placeholder)";
};

// Add other functions if they existed, marking them as deprecated placeholders
// that should call the backend via 'api' from backendApiService.

// It's generally better to remove these frontend functions entirely and
// call the backendApiService directly from the components that need AI features.