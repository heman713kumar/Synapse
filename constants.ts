import { Achievement, AchievementId, IdeaTemplate } from "./types";

export const PROGRESS_STAGES = [
    { id: 'idea-stage', name: 'Idea Stage' },
    { id: 'team-building', name: 'Team Building' },
    { id: 'in-development', name: 'In Development' },
    { id: 'launched', name: 'Launched' },
] as const;

export const SECTORS = [
    "Technology", 
    "Healthcare", 
    "Finance", 
    "Education", 
    "Environment",
    "Energy",
    "E-commerce",
    "Entertainment",
    "Real Estate",
    "Food & Beverage",
    "Travel & Hospitality",
    "Automotive",
    "Logistics", 
    "Arts",
    "Fashion"
];

export const REGIONS = [
    // Continents
    "North America", 
    "Europe", 
    "Asia", 
    "South America", 
    "Africa", 
    "Australia",
    // Top 20 Countries by GDP (mix)
    "United States",
    "China",
    "Germany",
    "Japan",
    "India",
    "United Kingdom",
    "France",
    "Canada",
    "Brazil",
    "Australia",
    "South Korea",
    "Spain",
    "Mexico",
    "Indonesia",
    "Netherlands",
    "Saudi Arabia",
    "Switzerland",
    "Nigeria",
    "Argentina",
    "Sweden",
];

export const SKILLS = [
    // Technical
    "Software Development",
    "Data Science",
    "AI/ML", 
    "Cybersecurity",
    "DevOps",
    "Mobile Development (iOS/Android)",
    "Blockchain",
    "Cloud Computing (AWS/Azure/GCP)",
    // Marketing & Sales
    "Marketing",
    "SEO/SEM",
    "Content Creation",
    "Social Media Management",
    "Digital Advertising",
    "Public Relations",
    "Sales",
    // Design
    "Design",
    "UI/UX Design",
    "Graphic Design",
    "Industrial Design",
    "Animation",
    // Business & Operations
    "Business",
    "Finance & Accounting",
    "Product Management",
    "Human Resources",
    "Fundraising",
    "Operations",
    "Legal",
    // Creative & Other
    "Writing",
    "Scientific Research",
    "Engineering (Mechanical/Electrical)",
    "Videography",
    "Customer Support",
];

export const REPORT_REASONS = {
    spam: "Spam or Misleading",
    harassment: "Harassment or Hate Speech",
    inappropriate: "Inappropriate Content",
    ip_infringement: "Intellectual Property Infringement",
    other: "Other"
};

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
    first_thought: {
        id: 'first_thought',
        name: 'First Thought',
        description: 'Post your very first idea.',
        goal: 1,
        icon: 'LightbulbIcon'
    },
    serial_innovator: {
        id: 'serial_innovator',
        name: 'Serial Innovator',
        description: 'Post 5 different ideas.',
        goal: 5,
        icon: 'LightbulbIcon'
    },
    team_player: {
        id: 'team_player',
        name: 'Team Player',
        description: 'Join 3 different projects as a collaborator.',
        goal: 3,
        icon: 'UsersIcon'
    },
    super_collaborator: {
        id: 'super_collaborator',
        name: 'Super Collaborator',
        description: 'Join 10 different projects.',
        goal: 10,
        icon: 'TrophyIcon'
    },
    valued_critic: {
        id: 'valued_critic',
        name: 'Valued Critic',
        description: 'Provide constructive feedback on 5 ideas.',
        goal: 5,
        icon: 'StarIcon'
    },
    community_pillar: {
        id: 'community_pillar',
        name: 'Community Pillar',
        description: 'Receive 25 upvotes across all your ideas.',
        goal: 25,
        icon: 'TrophyIcon'
    }
};

export const IDEA_TEMPLATES: IdeaTemplate[] = [
    {
        id: 'startup',
        name: 'Startup Venture',
        description: 'Structure your business idea from problem to market vision. Ideal for entrepreneurs.',
        icon: 'CpuIcon',
        questionnairePrompts: {
            problemStatement: 'What customer pain point are you solving?',
            targetAudience: 'Who is your ideal customer profile (ICP)?',
            resourcesNeeded: 'What key resources (funding, tech, people) do you need for an MVP?',
            timeline: 'What is your 3-6 month roadmap?',
            skillsLooking: 'What are the critical roles for your founding team?',
            visionForSuccess: 'What does market leadership look like in 5 years?',
        }
    },
    {
        id: 'research',
        name: 'Research Project',
        description: 'Outline your academic or scientific study, from hypothesis to potential impact.',
        icon: 'BookOpenIcon',
        questionnairePrompts: {
            problemStatement: 'What is your core research question or hypothesis?',
            targetAudience: 'Who will benefit from this research (academics, industry, public)?',
            resourcesNeeded: 'What data, equipment, or funding is required?',
            timeline: 'What are the key phases (lit review, experiment, publishing)?',
            skillsLooking: 'What collaborators do you need (e.g., statisticians, subject experts)?',
            visionForSuccess: 'What would a successful publication or finding enable?',
        }
    },
    {
        id: 'creative',
        name: 'Creative Project',
        description: 'Flesh out your artistic idea, whether it\'s a film, book, or performance piece.',
        icon: 'StarIcon',
        questionnairePrompts: {
            problemStatement: 'What is the core theme or artistic statement?',
            targetAudience: 'Who is the intended audience for this work?',
            resourcesNeeded: 'What materials, space, or collaborators do you need?',
            timeline: 'What are the major milestones (drafting, production, exhibition)?',
            skillsLooking: 'What skills are you seeking (e.g., illustrator, editor, musician)?',
            visionForSuccess: 'What emotional or intellectual impact will this have on the audience?',
        }
    },
    {
        id: 'impact',
        name: 'Social Impact Initiative',
        description: 'Define your project to create positive social or environmental change.',
        icon: 'HeartIcon',
        questionnairePrompts: {
            problemStatement: 'What specific social or environmental problem are you addressing?',
            targetAudience: 'Which community or group are you serving?',
            resourcesNeeded: 'What do you need (volunteers, grants, partnerships) to get started?',
            timeline: 'What is your plan for a pilot project?',
            skillsLooking: 'What expertise is needed (e.g., community organizers, grant writers)?',
            visionForSuccess: 'What is the long-term, measurable change you aim to create?',
        }
    }
];