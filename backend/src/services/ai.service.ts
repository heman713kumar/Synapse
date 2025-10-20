// C:\Users\hemant\Downloads\synapse\backend\src\services\ai.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai'; // Use import
import dotenv from 'dotenv'; // Use import

dotenv.config(); // Ensure env vars are loaded

class AIService {
  private genAI: GoogleGenerativeAI | null = null; // Allow null if key missing
  private model: any = null; // Use more specific type if available

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
       try {
         this.genAI = new GoogleGenerativeAI(apiKey);
         this.model = this.genAI.getGenerativeModel({
           model: process.env.GEMINI_MODEL || 'gemini-pro'
         });
         console.log("✅ AI Service Initialized with model:", process.env.GEMINI_MODEL || 'gemini-pro');
       } catch (error) {
           console.error("❌ Failed to initialize GoogleGenerativeAI:", error);
           this.genAI = null;
           this.model = null;
       }
    } else {
        console.warn("⚠️ GEMINI_API_KEY not found. AI Service disabled.");
    }
  }

  private isAvailable(): boolean {
      return !!this.model;
  }

  async analyzeIdea(idea: { title: string; description: string; category: string }): Promise<any> {
    if (!this.isAvailable()) {
        console.warn("AI analyzeIdea called but service is unavailable.");
        return this.getDefaultAnalysis(idea);
    }
    try {
      // ... (prompt remains the same) ...
      const prompt = `...`; // Keep your existing prompt

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('AI Raw Response:', text);

      // ... (parsing logic remains the same) ...
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      // ...

    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getDefaultAnalysis(idea);
    }
  }

  // ... (getDefaultAnalysis remains the same) ...
  private getDefaultAnalysis(idea: { title: string; description: string; category: string }): any {
      // ...
  }


  async generateIdeaSummary(idea: { title: string; description: string }): Promise<string> {
     if (!this.isAvailable()) {
        console.warn("AI generateIdeaSummary called but service is unavailable.");
        return `Summary: ${idea.title} - ${idea.description.substring(0, 100)}...`;
     }
    try {
      // ... (prompt remains the same) ...
      const prompt = `...`; // Keep your existing prompt

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI summary error:', error);
      return `Summary: ${idea.title} - ${idea.description.substring(0, 100)}...`;
    }
  }
}

// Export an instance
export const aiService = new AIService();