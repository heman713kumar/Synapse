import { GoogleGenAI, Type } from "@google/genai";
import { Idea, User, Questionnaire, KanbanTask } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.warn("VITE_API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

export const refineTextWithGemini = async (text: string): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve(`(AI offline) Original: ${text}`);
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Refine the following idea summary to be more clear, concise, and engaging. Return only the refined text, without any preamble.
      
      Original Text: "${text}"
      `,
    });
    return (response.text ?? "").trim();
  } catch (error) {
    console.error("Error refining text with Gemini:", error);
    return text;
  }
};

export const validateIdeaWithGemini = async (ideaData: {
  title: string;
  summary: string;
  questionnaire: Questionnaire;
}): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("AI is offline. Cannot validate idea.");
  }

  const prompt = `
    You are an expert business analyst and startup consultant.
    Your task is to provide a quick validation for a new idea based on the provided details. Use your knowledge and real-time search data to generate your analysis.

    **The Idea:**
    Title: "${ideaData.title}"
    Summary: "${ideaData.summary}"
    Problem it solves: "${ideaData.questionnaire.problemStatement}"
    Target Audience: "${ideaData.questionnaire.targetAudience}"

    **Instructions:**
    Provide a concise analysis covering the following three sections. Use markdown for formatting (e.g., ### for headings, ** for bold, and - for list items). Return only the analysis, without any preamble.

    ### 1. Preliminary Market Analysis
    - Briefly describe the potential market size and trend.
    - Identify key competitors or existing solutions.
    - Mention any recent news or developments relevant to this market.

    ### 2. Strengths & Weaknesses (Mini-SWOT)
    - **Strengths:** List 1-2 potential strengths of this idea.
    - **Weaknesses:** List 1-2 potential weaknesses or challenges.
    - **Opportunities:** List 1-2 market opportunities.
    - **Threats:** List 1-2 potential threats.

    ### 3. Target Audience Refinement
    - Based on the summary, suggest a more specific or niche target audience.
    - Provide 1-2 suggestions on how to reach this audience.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return (response.text ?? "").trim();
  } catch (error) {
    console.error("Error validating idea with Gemini:", error);
    return "An error occurred while validating the idea. Please try again later.";
  }
};

export const getCollaborationMatches = async (idea: Idea, potentialCollaborators: User[]): Promise<{userId: string, matchScore: number, reason: string}[]> => {
    if (!apiKey) {
        console.warn("AI is offline. Cannot get matches.");
        return [];
    }

    const ideaProfile = `
    Idea Title: ${idea.title}
    Summary: ${idea.summary}
    Problem it solves: ${idea.questionnaire.problemStatement}
    Required Skills: ${idea.requiredSkills.join(', ')}
    Looking for: ${idea.questionnaire.skillsLooking}
    `;

    const userProfiles = potentialCollaborators.map(user => `
    - User ID: ${user.userId}
      Bio: ${user.bio}
      Skills: ${user.skills.map(s => `${s.skillName} (Endorsed by ${s.endorsers.length})`).join(', ')}
      Interests: ${user.interests.join(', ')}
    `).join('\n');

    const prompt = `
    You are an expert collaboration matchmaker for a platform connecting "Thinkers" (idea creators) with "Doers" (executors).
    Your task is to analyze an idea and a list of potential collaborators to find the best fits.

    **The Idea:**
    ${ideaProfile}

    **Potential Collaborators:**
    ${userProfiles}

    **Instructions:**
    1.  Carefully read the idea's details, especially the required skills and problem domain.
    2.  Evaluate each user's profile against the idea's needs. Consider their skills, bio, and interests. Give weight to skills with more endorsements.
    3.  Identify the top 3 to 5 users who would be the best collaborators for this idea.
    4.  For each recommended user, provide a "matchScore" from 0 to 100, where 100 is a perfect match.
    5.  For each recommended user, write a brief, one-sentence "reason" explaining why they are a strong match. Focus on specific skill alignments or relevant experience mentioned in their bio.
    6.  Return ONLY a JSON array of objects based on the provided schema. Do not include any other text, preamble, or markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            userId: { type: Type.STRING },
                            matchScore: { type: Type.INTEGER },
                            reason: { type: Type.STRING },
                        },
                        required: ["userId", "matchScore", "reason"],
                    },
                },
            },
        });
        
        const jsonStr = (response.text ?? "").trim();
        const matches = JSON.parse(jsonStr);
        return matches;

    } catch (error) {
        console.error("Error getting collaboration matches from Gemini:", error);
        return [];
    }
};

export const generateKanbanTasksFromIdeaBoard = async (idea: Idea): Promise<Omit<KanbanTask, 'id'>[]> => {
    if (!apiKey) {
        console.warn("AI is offline. Cannot generate Kanban tasks.");
        return [
            { title: "Setup Project Repository", description: "Goal: Initialize the project's version control. Outcome: A new GitHub repository with a basic file structure (README, .gitignore)." },
            { title: "Design Core UI Mockups", description: "Goal: Visualize the main user flows. Outcome: Figma designs for the login, feed, and idea detail pages." },
        ];
    }

    const ideaBoardContent = idea.ideaBoard.nodes.map(n => `- ${n.title}: ${n.description}`).join('\n');

    const prompt = `
    You are an expert project manager tasked with breaking down a high-level idea into actionable development tasks.
    Based on the provided idea title, summary, and its visual 'Idea Board' (represented as a list of nodes with titles and descriptions), generate a list of tasks for the 'To Do' column of a Kanban board.

    **The Idea:**
    Title: "${idea.title}"
    Summary: "${idea.summary}"

    **Idea Board Nodes:**
    ${ideaBoardContent}

    **Instructions:**
    1.  Analyze the idea board nodes to understand the core components and features.
    2.  Create a list of 5 to 7 small, concrete, and actionable tasks needed to build an MVP (Minimum Viable Product).
    3.  Each task must have a clear \`title\` and a concise, actionable \`description\`. The description must clearly state the goal of the task and its expected outcome (e.g., "Goal: Create UI mockups for key screens. Outcome: A Figma file containing designs for the home, profile, and idea detail pages.").
    4.  Return ONLY a JSON array of objects based on the provided schema. Do not include any other text, preamble, or markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["title", "description"],
                    },
                },
            },
        });

        const jsonStr = (response.text ?? "").trim();
        const tasks = JSON.parse(jsonStr);
        return tasks;

    } catch (error) {
        console.error("Error generating Kanban tasks from Gemini:", error);
        return [{ title: "Error Generating Tasks", description: "There was an issue with the AI. Please try again or add tasks manually." }];
    }
};