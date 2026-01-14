// C:\Users\hemant\Downloads\synapse\backend\src\services\ai.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai'; // Use import

// --- FIX 2: Define proper interface for Type Safety ---
interface IdeaAnalysis {
  feasibility: { score: number; reason: string };
  innovation: { score: number; reason: string };
  marketPotential: { score: number; reason: string };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  similarIdeas: string[];
  estimatedDevelopmentTime: string;
}

class AIService {
  private genAI: any;
  private model: any;
  private isInitialized: boolean = false;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY is not set. AI features will be disabled.");
        return;
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-pro'
    });
    this.isInitialized = true;
  }
  
  // --- FIX 5: Add Input Sanitization and Length Limiting (Security) ---
  private sanitizeInput(input: string): string {
    // Remove or escape potentially dangerous characters for prompt injection
    return input
      .replace(/[{}<>\[\]\(\)\\\/]/g, '')
      .substring(0, 1000); // Limit input length to prevent excessive cost/injection
  }
  
  // --- FIX 4: Add Rate Limiting & Cost Control Placeholder ---
  private async checkRateLimit(): Promise<void> {
      // In a production environment, this would check a Redis/DB counter.
      // For now, it serves as a structural reminder.
      return; 
  }

  // --- FIX 2: Add Request Timeout logic (Reliability) ---
  private async generateContentWithModel(prompt: string): Promise<string> {
      if (!this.model) {
          throw new Error("AI Service not initialized. Check GEMINI_API_KEY.");
      }
      
      // Use structured rate limit check
      await this.checkRateLimit();
      
      // Add timeout to prevent hanging requests
      const timeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT || '30000');
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs)
      );
      
      const contentPromise = this.model.generateContent(prompt);
      
      try {
          const result = await Promise.race([contentPromise, timeoutPromise]);
          const response = await result.response;
          const text = response.text();
          this.logUsage(prompt, text, true); // Log usage on success
          return text;
      } catch (error) {
          this.logUsage(prompt, '', false); // Log usage on failure
          throw error;
      }
  }
  // --- END FIX 2 ---

  // --- FIX 6: Add Usage Logging ---
  private logUsage(prompt: string, response: string, success: boolean): void {
      console.log(`[AI USAGE] Success: ${success}, Prompt Length: ${prompt.length}, Response Length: ${response.length}`);
  }
  // --- END FIX 6 ---


  async analyzeIdea(idea: { title: string; description: string; category: string }): Promise<IdeaAnalysis> {
    // --- FIX 1: Add Input Validation & Sanitization ---
    if (!this.isInitialized) {
        return this.getDefaultAnalysis(idea);
    }
    if (!idea.title?.trim() || !idea.description?.trim()) {
        throw new Error('Title and description are required for AI analysis');
    }
    
    const sanitizedTitle = this.sanitizeInput(idea.title);
    const sanitizedDescription = this.sanitizeInput(idea.description);
    // --- END FIX 1 ---
    
    try {
      const prompt = `
        Analyze this business idea and provide constructive feedback:
        
        Title: ${sanitizedTitle}
        Description: ${sanitizedDescription}
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
      
      try {
        // Attempt to parse directly, assuming the model followed instructions
        const parsedJson = JSON.parse(text);
        // Ensure the parsed result conforms to the IdeaAnalysis type contract
        return parsedJson as IdeaAnalysis; 
      } catch (parseError) {
        console.error('JSON parse error (Attempt 1):', parseError, 'Raw Text:', text);
        // Fallback if parsing fails (e.g., model added extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsedJson = JSON.parse(jsonMatch[0]);
                return parsedJson as IdeaAnalysis;
            } catch (innerParseError) {
                 console.error('Fallback JSON parse error (Attempt 2):', innerParseError);
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

  // --- FIX 3: Complete the Default Analysis Method with IdeaAnalysis return type ---
  private getDefaultAnalysis(idea: { title: string; description: string; category: string }): IdeaAnalysis {
     return {
      feasibility: { score: 5, reason: "AI service temporarily unavailable or request timed out." },
      innovation: { score: 5, reason: "AI service temporarily unavailable." },
      marketPotential: { score: 5, reason: "AI service temporarily unavailable." },
      strengths: ["AI service temporarily unavailable"],
      weaknesses: ["Cannot analyze at the moment"],
      recommendations: ["Try again later or proceed with your idea based on initial market data."],
      similarIdeas: [],
      estimatedDevelopmentTime: "Unknown"
    };
  }

  async generateIdeaSummary(idea: { title: string; description: string }): Promise<string> {
    if (!this.isInitialized) {
        return `Summary: ${idea.title} - ${idea.description.substring(0, 100)}...`;
    }
    
    // Sanitize inputs before generating prompt
    const sanitizedTitle = this.sanitizeInput(idea.title);
    const sanitizedDescription = this.sanitizeInput(idea.description);
    
    try {
      const prompt = `Create a concise 2-3 sentence summary of this idea: "${sanitizedTitle}" - ${sanitizedDescription}`;
      const text = await this.generateContentWithModel(prompt);
      return text;
    } catch (error) {
      console.error('AI summary error:', error);
      return `Summary: ${idea.title} - ${idea.description.substring(0, 100)}...`;
    }
  }

  async refineSummary(summary: string): Promise<string> {
    if (!this.isInitialized) {
        return summary;
    }
    
    const sanitizedSummary = this.sanitizeInput(summary);
    
    try {
      const prompt = `Refine the following idea summary to improve clarity, conciseness, and impact, while keeping the core meaning intact. Return only the refined summary text:\n\n"${sanitizedSummary}"`;
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