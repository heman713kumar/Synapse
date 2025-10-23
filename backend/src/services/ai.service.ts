// C:\Users\hemant\Downloads\synapse\backend\src\services\ai.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai'; // Use import

class AIService {
  private genAI: any;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY is not set. AI features will be disabled.");
        // Optionally throw an error or handle initialization differently
        // For now, let's allow it to proceed but log errors later
        return;
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-pro'
    });
  }

  // Ensure model is initialized before using it
  private async generateContentWithModel(prompt: string): Promise<string> {
      if (!this.model) {
          throw new Error("AI Service not initialized. Check GEMINI_API_KEY.");
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
  }


  async analyzeIdea(idea: { title: string; description: string; category: string }): Promise<any> {
    try {
      const prompt = `
        Analyze this business idea and provide constructive feedback:
        
        Title: ${idea.title}
        Description: ${idea.description}
        Category: ${idea.category}
        
        Please provide analysis ONLY in this valid JSON format (do not include markdown backticks or 'json' prefix):
        {
          "feasibility": { "score": 0-10, "reason": "..." },
          "innovation": { "score": 0-10, "reason": "..." },
          "marketPotential": { "score": 0-10, "reason": "..." },
          "strengths": ["..."],
          "weaknesses": ["..."],
          "recommendations": ["..."],
          "similarIdeas": ["..."],
          "estimatedDevelopmentTime": "..."
        }
        
        Be constructive and provide actionable feedback. Ensure the output is valid JSON.
      `;

      const text = await this.generateContentWithModel(prompt);
      console.log('AI Raw Response:', text);
      
      try {
        // Attempt to parse directly, assuming the model followed instructions
        return JSON.parse(text); 
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw Text:', text);
        // Fallback if parsing fails (e.g., model added extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerParseError) {
                 console.error('Fallback JSON parse error:', innerParseError);
                 return this.getDefaultAnalysis(idea);
            }
        }
        return this.getDefaultAnalysis(idea);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getDefaultAnalysis(idea);
    }
  }

  private getDefaultAnalysis(idea: { title: string; description: string; category: string }): any {
    // ... (keep this function as is)
     return {
      feasibility: { score: 5, reason: "Analysis unavailable" },
      innovation: { score: 5, reason: "Analysis unavailable" },
      marketPotential: { score: 5, reason: "Analysis unavailable" },
      strengths: ["AI service temporarily unavailable"],
      weaknesses: ["Cannot analyze at the moment"],
      recommendations: ["Try again later or proceed with your idea"],
      similarIdeas: [],
      estimatedDevelopmentTime: "Unknown"
    };
  }

  async generateIdeaSummary(idea: { title: string; description: string }): Promise<string> {
    try {
      const prompt = `Create a concise 2-3 sentence summary of this idea: "${idea.title}" - ${idea.description}`;
      const text = await this.generateContentWithModel(prompt);
      return text;
    } catch (error) {
      console.error('AI summary error:', error);
      return `Summary: ${idea.title} - ${idea.description.substring(0, 100)}...`;
    }
  }

  async refineSummary(summary: string): Promise<string> {
    try {
      const prompt = `Refine the following idea summary to improve clarity, conciseness, and impact, while keeping the core meaning intact. Return only the refined summary text:\n\n"${summary}"`;
      const refinedText = await this.generateContentWithModel(prompt);
      // Basic check to prevent returning empty strings or error messages
      return refinedText && refinedText.length > 10 ? refinedText : summary;
    } catch (error) {
      console.error('AI summary refinement error:', error);
      // Fallback to original summary on error
      return summary;
    }
  }
}

// Export the instance
export const aiService = new AIService();
// Remove module.exports
// module.exports = { aiService, AIService };