import { User, Idea, Notification, IdeaNode, Conversation, Message, CollaborationRequest, ForumMessage, Comment, BlockchainRecord, Feedback, RecommendedCollaborator, NodeComment, IdeaBoardVersion, Report, AchievementId, AchievementPost, FeedItem, IdeaAnalytics, NotificationSettings, ProgressStage, Milestone, MilestonePost, KanbanBoard } from '../types';
import { getCollaborationMatches, generateKanbanTasksFromIdeaBoard } from './geminiService';
import { ACHIEVEMENTS } from '../constants';


// --- MOCK DATA ---

let MOCK_REPORTS: Report[] = [];

const defaultNotificationSettings: NotificationSettings = {
    collaborationRequests: ['inApp', 'email'],
    collaborationUpdates: ['inApp', 'email'],
    commentsOnMyIdeas: ['inApp'],
    feedbackOnMyIdeas: ['inApp'],
    newConnections: ['inApp'],
    achievementUnlocks: ['inApp'],
    directMessages: ['inApp', 'email'],
    messageReactions: ['inApp'],
    doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
    }
};

let MOCK_USERS: User[] = [
  {
    userId: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-1',
    bio: 'Innovator in renewable energy and sustainable tech. Looking to connect with designers and engineers.',
    skills: [
        { skillName: 'Cloud Computing (AWS/Azure/GCP)', endorsers: ['user-3'] },
        { skillName: 'Fundraising', endorsers: [] },
        { skillName: 'Energy', endorsers: ['user-2', 'user-3'] },
    ],
    interests: ['Energy', 'Environment', 'Finance'],
    connections: ['user-2', 'user-3'],
    bookmarkedIdeas: ['idea-2'],
    linkedInUrl: 'https://linkedin.com/in/sarahchen',
    portfolioUrl: 'https://github.com/sarahchen',
    achievements: [
        { achievementId: 'first_thought', progress: 1, unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { achievementId: 'serial_innovator', progress: 1, unlockedAt: null },
        { achievementId: 'valued_critic', progress: 1, unlockedAt: null },
    ],
    onboardingCompleted: true,
    notificationSettings: defaultNotificationSettings,
  },
  {
    userId: 'user-2',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-2',
    bio: 'Full-stack developer with a passion for educational technology and creating accessible learning platforms.',
    skills: [
        { skillName: 'Mobile Development (iOS/Android)', endorsers: ['user-1'] },
        { skillName: 'UI/UX Design', endorsers: [] },
        { skillName: 'Education', endorsers: [] },
    ],
    interests: ['Education', 'Technology'],
    connections: ['user-1'],
    bookmarkedIdeas: ['idea-1', 'idea-3'],
    achievements: [
        { achievementId: 'first_thought', progress: 1, unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { achievementId: 'valued_critic', progress: 1, unlockedAt: null },
    ],
    onboardingCompleted: true,
    notificationSettings: defaultNotificationSettings,
  },
    {
    userId: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-3',
    bio: 'Healthcare professional focused on digital health solutions and improving patient outcomes.',
    skills: [
        { skillName: 'Healthcare', endorsers: ['user-1'] },
        { skillName: 'Operations', endorsers: [] },
        { skillName: 'Digital Advertising', endorsers: [] },
    ],
    interests: ['Healthcare', 'Technology'],
    connections: ['user-1'],
    bookmarkedIdeas: [],
    achievements: [
        { achievementId: 'first_thought', progress: 1, unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { achievementId: 'team_player', progress: 1, unlockedAt: null },
    ],
    onboardingCompleted: true,
    notificationSettings: defaultNotificationSettings,
  },
  {
    userId: 'user-4',
    name: 'Alex Doe',
    email: 'alex@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user-4',
    bio: '',
    skills: [],
    interests: [],
    connections: [],
    bookmarkedIdeas: [],
    achievements: [],
    onboardingCompleted: false,
    notificationSettings: defaultNotificationSettings,
  },
];

let MOCK_IDEAS: Idea[] = [
  {
    ideaId: 'idea-1',
    ownerId: 'user-1',
    title: 'AI-Powered Platform for Personalized Sustainable Living',
    summary: 'A mobile app that uses AI to track a user\'s carbon footprint and provides personalized, actionable recommendations for reducing environmental impact, from diet to travel.',
    tags: ['AI', 'Sustainability', 'Mobile App', 'Technology', 'Environment'],
    sector: 'Energy',
    region: 'United States',
    requiredSkills: ['AI/ML', 'UI/UX Design', 'SEO/SEM'],
    questionnaire: {
      problemStatement: 'Many people want to live more sustainably but don\'t know how or feel their actions won\'t make a difference. Existing apps are often too generic.',
      targetAudience: 'Environmentally-conscious millennials and Gen Z who are tech-savvy and looking for practical ways to reduce their impact.',
      resourcesNeeded: 'AI/ML expertise, mobile developers, UX/UI designers, and partnerships with sustainable brands.',
      timeline: '6-9 months for MVP',
      skillsLooking: 'React Native developer, Python developer (for AI), UX designer',
      visionForSuccess: 'Become the go-to app for personalized sustainability, empowering millions to make a measurable difference.'
    },
    ideaBoard: {
        nodes: [
            { id: 'n1', x: 100, y: 150, title: 'User Onboarding', description: 'Gamified setup process', connections: ['n2'] },
            { id: 'n2', x: 400, y: 150, title: 'AI Recommendation Engine', description: 'Core of the product', connections: [] },
        ],
        isPublic: true,
    },
    roadmap: [
        { id: 'm1-1', title: 'Develop MVP', description: 'Core feature set for initial launch.', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
        { id: 'm1-2', title: 'User Testing', description: 'Beta testing with 100 users.', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending' },
    ],
    status: 'active',
    progressStage: 'team-building',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    likesCount: 152,
    commentsCount: 2,
    collaborators: ['user-3'],
    forumMembers: ['user-1', 'user-3'],
    blockchainHash: `0xb9d3a1a8c08f4cde6c5b05a639a5f7f185a6b2c8e3d4e5f6a7b8c9d0e1f2a3b4`,
    blockchainTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    votes: [
        { userId: 'user-2', type: 'up' },
        { userId: 'user-3', type: 'up' },
    ]
  },
  {
    ideaId: 'idea-2',
    ownerId: 'user-2',
    title: 'Interactive Coding Platform for Kids',
    summary: 'A gamified web platform that teaches children coding fundamentals through interactive stories and puzzle-solving challenges, making learning fun and accessible.',
    tags: ['EdTech', 'Gaming', 'Software Development', 'Education'],
    sector: 'Education',
    region: 'Germany',
    requiredSkills: ['Software Development', 'UI/UX Design', 'Content Creation'],
    questionnaire: {
        problemStatement: 'Learning to code can be intimidating for young children. Traditional methods are often dry and fail to keep them engaged.',
        targetAudience: 'Children aged 8-12 and their parents/educators.',
        resourcesNeeded: 'Frontend developers (React), game designers, educational content creators.',
        timeline: '1 year for full launch',
        skillsLooking: 'React developer, content writer specializing in education',
        visionForSuccess: 'To be the leading platform for introducing children to coding concepts in a playful and effective way.'
    },
    ideaBoard: { nodes: [], isPublic: false },
    roadmap: [],
    status: 'active',
    progressStage: 'in-development',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    likesCount: 230,
    commentsCount: 1,
    collaborators: [],
    forumMembers: ['user-2'],
    blockchainHash: `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`,
    blockchainTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    votes: [],
    kanbanBoard: {
        tasks: {
            'task-1': { id: 'task-1', title: 'Design initial character sprites', description: 'Create 3-4 character designs for the main story.' },
            'task-2': { id: 'task-2', title: 'Set up React project structure', description: 'Initialize with Create React App and add basic components.' },
            'task-3': { id: 'task-3', title: 'Write Chapter 1 story script', description: 'Draft the first interactive story.' },
            'task-4': { id: 'task-4', title: 'Develop puzzle engine v1', description: 'Core logic for the first puzzle type.' },
        },
        columns: {
            'todo': { id: 'todo', title: 'To Do', taskIds: ['task-3', 'task-4'] },
            'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: ['task-2'] },
            'done': { id: 'done', title: 'Done', taskIds: ['task-1'] },
        },
        columnOrder: ['todo', 'in-progress', 'done'],
    },
  },
  {
    ideaId: 'idea-3',
    ownerId: 'user-3',
    title: 'Digital Health Platform for Rural Communities',
    summary: 'A telehealth service connecting patients in remote areas with specialized doctors via a low-bandwidth mobile application.',
    tags: ['Healthcare', 'Telehealth', 'Mobile App', 'Social Impact'],
    sector: 'Healthcare',
    region: 'Nigeria',
    requiredSkills: ['Healthcare', 'Mobile Development (iOS/Android)', 'Operations'],
    questionnaire: {
      problemStatement: 'Access to specialized healthcare is limited in rural and remote areas, leading to poor health outcomes.',
      targetAudience: 'Patients in remote communities and doctors looking to offer virtual consultations.',
      resourcesNeeded: 'Mobile developers, healthcare professionals, partnerships with local clinics.',
      timeline: '1 year to pilot program',
      skillsLooking: 'Android developer, medical consultant, community manager',
      visionForSuccess: 'To provide accessible and affordable specialized healthcare to 1 million people in rural areas within 5 years.'
    },
    ideaBoard: { nodes: [], isPublic: true },
    roadmap: [],
    status: 'active',
    progressStage: 'idea-stage',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    likesCount: 310,
    commentsCount: 1,
    collaborators: ['user-1'],
    forumMembers: ['user-3', 'user-1'],
    blockchainHash: `0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b`,
    blockchainTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    votes: [
        { userId: 'user-1', type: 'up'},
    ]
  }
];

let MOCK_COMMENTS: Comment[] = [
    { commentId: 'c-1', ideaId: 'idea-1', userId: 'user-2', text: 'This is a fantastic idea! I have some experience in ML and would love to help.', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
    { commentId: 'c-2', ideaId: 'idea-1', userId: 'user-3', text: 'Great concept. Have you considered partnering with local eco-friendly stores for promotions?', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
    { commentId: 'c-3', ideaId: 'idea-2', userId: 'user-1', text: 'My kids would love this!', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
    { commentId: 'c-4', ideaId: 'idea-3', userId: 'user-2', text: 'Important problem to solve. What about internet connectivity issues in rural areas?', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

let MOCK_ACHIEVEMENT_POSTS: AchievementPost[] = [
    { postId: 'ap-1', userId: 'user-1', achievementId: 'first_thought', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
];

let MOCK_MILESTONE_POSTS: MilestonePost[] = [];

let MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', userId: 'user-1', type: 'NEW_COMMENT', message: 'Mike Johnson commented on your idea "AI-Powered Platform..."', read: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), link: { page: 'ideaDetail', id: 'idea-1' } },
    { id: 'notif-2', userId: 'user-2', type: 'NEW_CONNECTION', message: 'Sarah Chen accepted your connection request.', read: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), link: { page: 'profile', id: 'user-1' } },
];
let MOCK_CONVERSATIONS: Conversation[] = [
    {
        conversationId: 'convo-1',
        participants: ['user-1', 'user-2'],
        status: 'accepted',
        lastMessage: { messageId: 'm-3', conversationId: 'convo-1', senderId: 'user-2', text: "Yeah, let's connect on that. I've got some ideas for the UI.", createdAt: new Date(Date.now() - 60000).toISOString(), isRead: false },
        lastUpdatedAt: new Date(Date.now() - 60000).toISOString(),
        unreadCount: { 'user-1': 1 },
    },
    {
        conversationId: 'convo-2',
        participants: ['user-1', 'user-3'],
        status: 'accepted',
        isGroup: true,
        groupName: 'Project Health Platform',
        groupAvatar: 'https://i.pravatar.cc/150?u=group-1',
        admins: ['user-1'],
        lastMessage: { messageId: 'm-g1', conversationId: 'convo-2', senderId: 'user-3', text: "Just pushed the initial specs.", createdAt: new Date(Date.now() - 120000).toISOString(), isRead: true },
        lastUpdatedAt: new Date(Date.now() - 120000).toISOString(),
        unreadCount: { 'user-1': 0 },
    },
    {
        conversationId: 'convo-req-1',
        participants: ['user-1', 'user-4'], // user-4 is the new user
        status: 'pending',
        lastMessage: { messageId: 'm-req-1', conversationId: 'convo-req-1', senderId: 'user-4', text: "Hey Sarah, saw your profile. I'd love to connect.", createdAt: new Date(Date.now() - 300000).toISOString(), isRead: false },
        lastUpdatedAt: new Date(Date.now() - 300000).toISOString(),
        unreadCount: { 'user-1': 1 },
    }
];
let MOCK_MESSAGES: Message[] = [
    { messageId: 'm-1', conversationId: 'convo-1', senderId: 'user-1', text: "Hey Mike! Great work on the EdTech idea.", createdAt: new Date(Date.now() - 300000).toISOString(), isRead: true },
    { messageId: 'm-2', conversationId: 'convo-1', senderId: 'user-1', text: "I have some thoughts on gamification I'd like to share.", createdAt: new Date(Date.now() - 240000).toISOString(), isRead: true, media: { url: 'https://placehold.co/600x400/252532/FFF/png?text=Gamification+Flowchart', type: 'image', fileName: 'gamification.png' } },
    { messageId: 'm-3', conversationId: 'convo-1', senderId: 'user-2', text: "Yeah, let's connect on that. I've got some ideas for the UI.", createdAt: new Date(Date.now() - 60000).toISOString(), isRead: false, replyToMessageId: 'm-2', reactions: [{userId: 'user-1', emoji: '👍'}] },
    { messageId: 'm-g1', conversationId: 'convo-2', senderId: 'user-3', text: "Just pushed the initial specs.", createdAt: new Date(Date.now() - 120000).toISOString(), isRead: true },
    { messageId: 'm-req-1', conversationId: 'convo-req-1', senderId: 'user-4', text: "Hey Sarah, saw your profile. I'd love to connect.", createdAt: new Date(Date.now() - 300000).toISOString(), isRead: false },
];
let MOCK_COLLABORATION_REQUESTS: CollaborationRequest[] = [];
let MOCK_FORUM_MESSAGES: ForumMessage[] = [];
let MOCK_BLOCKCHAIN_RECORDS: BlockchainRecord[] = [];
let MOCK_FEEDBACK: Feedback[] = [];
let MOCK_NODE_COMMENTS: NodeComment[] = [
    {
        commentId: 'nc-1',
        ideaId: 'idea-1',
        nodeId: 'n1',
        userId: 'user-2',
        text: 'This is a great starting point for the onboarding flow!',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        commentId: 'nc-2',
        ideaId: 'idea-1',
        nodeId: 'n1',
        userId: 'user-3',
        text: 'What about adding a step to connect social accounts?',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
];
let MOCK_BOARD_VERSIONS: IdeaBoardVersion[] = [
    {
        versionId: 'v-initial-1',
        ideaId: 'idea-1',
        nodes: [
            { id: 'n1', x: 100, y: 150, title: 'User Onboarding', description: 'Initial idea for onboarding', connections: [] },
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        name: 'Initial Brainstorm',
    }
];

// --- API Helper Functions ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const createNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
    };
    MOCK_NOTIFICATIONS.unshift(newNotif);
};

// --- Mock API Implementation ---

const login = async (email: string): Promise<User | null> => {
    await delay(500);
    return MOCK_USERS.find(u => u.email === email) || null;
};

const signUp = async (name: string, email: string): Promise<{user: User | null, error?: string}> => {
    await delay(500);
    if (MOCK_USERS.some(u => u.email === email)) {
        return { user: null, error: 'An account with this email already exists.' };
    }
    const newUser: User = {
        userId: `user-${Date.now()}`,
        name,
        email,
        avatarUrl: `https://i.pravatar.cc/150?u=user-${Date.now()}`,
        bio: '',
        skills: [],
        interests: [],
        connections: [],
        bookmarkedIdeas: [],
        achievements: [],
        onboardingCompleted: false,
        notificationSettings: defaultNotificationSettings,
    };
    MOCK_USERS.push(newUser);
    return { user: newUser };
};

const getUserById = async (userId: string): Promise<User | null> => {
    await delay(50);
    return MOCK_USERS.find(u => u.userId === userId) || null;
};

const getAllUsers = async (): Promise<User[]> => {
    await delay(50);
    return MOCK_USERS;
};

const getIdeaById = async (ideaId: string): Promise<Idea | null> => {
    await delay(100);
    return MOCK_IDEAS.find(i => i.ideaId === ideaId) || null;
};

const getAllIdeas = async (): Promise<Idea[]> => {
    await delay(300);
    return MOCK_IDEAS;
};

const getIdeasByOwnerId = async (userId: string): Promise<Idea[]> => {
    await delay(200);
    return MOCK_IDEAS.filter(idea => idea.ownerId === userId);
};

const getIdeasByCollaboratorId = async (userId: string): Promise<Idea[]> => {
    await delay(200);
    return MOCK_IDEAS.filter(idea => idea.collaborators.includes(userId));
};

const getFeedItems = async (): Promise<FeedItem[]> => {
    await delay(500);
    const ideaItems: FeedItem[] = MOCK_IDEAS.map(idea => ({ type: 'idea', data: idea }));
    const achievementItems: FeedItem[] = MOCK_ACHIEVEMENT_POSTS.map(post => ({ type: 'achievement', data: post }));
    const milestoneItems: FeedItem[] = MOCK_MILESTONE_POSTS.map(post => ({ type: 'milestone', data: post }));
    return [...ideaItems, ...achievementItems, ...milestoneItems].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
};

const addIdea = async (ideaData: Omit<Idea, 'ideaId' | 'createdAt' | 'likesCount' | 'commentsCount' | 'collaborators' | 'forumMembers' | 'blockchainHash' | 'blockchainTimestamp' | 'votes' | 'progressStage' | 'roadmap'>): Promise<{ idea: Idea, unlockedAchievements: AchievementId[] }> => {
    await delay(1000);
    const newIdea: Idea = {
        ...ideaData,
        ideaId: `idea-${Date.now()}`,
        createdAt: new Date().toISOString(),
        progressStage: 'idea-stage',
        likesCount: 0,
        commentsCount: 0,
        collaborators: [],
        forumMembers: [ideaData.ownerId],
        votes: [],
        roadmap: [],
    };
    MOCK_IDEAS.unshift(newIdea);
    // Simulate blockchain timestamping
    setTimeout(() => {
        const ideaIndex = MOCK_IDEAS.findIndex(i => i.ideaId === newIdea.ideaId);
        if (ideaIndex !== -1) {
            MOCK_IDEAS[ideaIndex].blockchainHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            MOCK_IDEAS[ideaIndex].blockchainTimestamp = new Date().toISOString();
            const record: BlockchainRecord = { recordId: `rec-${Date.now()}`, ideaId: newIdea.ideaId, transactionHash: MOCK_IDEAS[ideaIndex].blockchainHash!, blockchainNetwork: 'Polygon', timestamp: MOCK_IDEAS[ideaIndex].blockchainTimestamp!, recordType: 'timestamp' };
            MOCK_BLOCKCHAIN_RECORDS.push(record);
            createNotification({ userId: newIdea.ownerId, type: 'IDEA_TIMESTAMPED', message: `Your idea "${newIdea.title}" has been timestamped on the blockchain.`, link: { page: 'ideaDetail', id: newIdea.ideaId }});
        }
    }, 5000);
    
    // Check for 'first_thought' achievement
    const unlockedAchievements: AchievementId[] = [];
    const user = MOCK_USERS.find(u => u.userId === ideaData.ownerId);
    if (user) {
        const firstThought = user.achievements.find(a => a.achievementId === 'first_thought');
        if (!firstThought || !firstThought.unlockedAt) {
            if (firstThought) {
                firstThought.progress = 1;
                firstThought.unlockedAt = new Date().toISOString();
            } else {
                user.achievements.push({ achievementId: 'first_thought', progress: 1, unlockedAt: new Date().toISOString() });
            }
            unlockedAchievements.push('first_thought');
        }
    }

    return { idea: newIdea, unlockedAchievements };
};

const getRecommendedCollaborators = async (ideaId: string): Promise<RecommendedCollaborator[]> => {
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (!idea) return [];
    const potentialCollaborators = MOCK_USERS.filter(u => u.userId !== idea.ownerId && !idea.collaborators.includes(u.userId));
    const matches = await getCollaborationMatches(idea, potentialCollaborators);
    return matches.map(match => {
        const user = MOCK_USERS.find(u => u.userId === match.userId)!;
        return { ...user, ...match };
    }).sort((a,b) => b.matchScore - a.matchScore);
};

const submitReport = async (reportData: Omit<Report, 'reportId' | 'status' | 'createdAt'>): Promise<Report> => {
    await delay(400);
    const newReport: Report = {
        ...reportData,
        reportId: `report-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    MOCK_REPORTS.push(newReport);

    if (reportData.contentType === 'idea') {
        const idea = MOCK_IDEAS.find(i => i.ideaId === reportData.contentId);
        if (idea) idea.isUnderReview = true;
    } else if (reportData.contentType === 'comment') {
        const comment = MOCK_COMMENTS.find(c => c.commentId === reportData.contentId);
        if (comment) comment.isUnderReview = true;
    }

    // Notifying the reporter and owner
    const idea = MOCK_IDEAS.find(i => i.ideaId === (reportData.contentType === 'idea' ? reportData.contentId : MOCK_COMMENTS.find(c => c.commentId === reportData.contentId)?.ideaId));
    createNotification({ userId: reportData.reporterId, type: 'CONTENT_REPORTED_REPORTER', message: `Thank you for your report on "${idea?.title}". Our team will review it shortly.`, link: { page: 'ideaDetail', id: idea!.ideaId } });
    if (idea) {
        createNotification({ userId: idea.ownerId, type: 'CONTENT_REPORTED_OWNER', message: `Content related to your idea "${idea.title}" has been reported and is under review.`, link: { page: 'ideaDetail', id: idea.ideaId } });
    }
    
    return newReport;
};

const submitCollaborationRequest = async (req: Omit<CollaborationRequest, 'requestId' | 'status' | 'createdAt'>): Promise<CollaborationRequest> => {
    await delay(300);
    const newRequest: CollaborationRequest = {
        ...req,
        requestId: `req-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    MOCK_COLLABORATION_REQUESTS.push(newRequest);
    
    const idea = MOCK_IDEAS.find(i => i.ideaId === req.ideaId);
    const requester = MOCK_USERS.find(u => u.userId === req.requesterId);
    if (idea && requester) {
        createNotification({
            userId: idea.ownerId,
            type: 'COLLABORATION_REQUEST',
            message: `${requester.name} has requested to collaborate on your idea "${idea.title}".`,
            link: { page: 'ideaDetail', id: idea.ideaId }
        });
    }

    return newRequest;
};

const updateCollaborationRequestStatus = async (reqId: string, status: 'approved' | 'denied'): Promise<{ unlockedAchievements: AchievementId[] }> => {
    await delay(500);
    const requestIndex = MOCK_COLLABORATION_REQUESTS.findIndex(r => r.requestId === reqId);
    if (requestIndex === -1) return { unlockedAchievements: [] };

    const request = MOCK_COLLABORATION_REQUESTS[requestIndex];
    request.status = status;
    
    const idea = MOCK_IDEAS.find(i => i.ideaId === request.ideaId);
    if (!idea) return { unlockedAchievements: [] };

    const requester = MOCK_USERS.find(u => u.userId === request.requesterId);
    if (!requester) return { unlockedAchievements: [] };

    if (status === 'approved') {
        if (!idea.collaborators.includes(request.requesterId)) {
            idea.collaborators.push(request.requesterId);
        }
        if (!idea.forumMembers.includes(request.requesterId)) {
            idea.forumMembers.push(request.requesterId);
        }
        
        const transactionHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const timestamp = new Date().toISOString();
        const record: BlockchainRecord = {
            recordId: `rec-${Date.now()}`,
            ideaId: idea.ideaId,
            transactionHash,
            blockchainNetwork: 'Polygon',
            timestamp,
            recordType: "collaboration",
            collaboratorId: request.requesterId,
        };
        MOCK_BLOCKCHAIN_RECORDS.push(record);
        
        createNotification({
            userId: request.requesterId,
            type: 'COLLABORATION_APPROVED',
            message: `Your request to collaborate on "${idea.title}" has been approved!`,
            link: { page: 'ideaDetail', id: idea.ideaId }
        });
        createNotification({
            userId: idea.ownerId,
            type: 'COLLABORATION_RECORDED',
            message: `${requester.name} is now a collaborator on "${idea.title}". The agreement is recorded on the blockchain.`,
            link: { page: 'ideaDetail', id: idea.ideaId }
        });

        const unlockedAchievements: AchievementId[] = [];
        const userCollabCount = MOCK_IDEAS.filter(i => i.collaborators.includes(requester.userId)).length;

        const checkAndUnlock = (achievementId: AchievementId) => {
            const achievementData = ACHIEVEMENTS[achievementId];
            let userAchievement = requester.achievements.find(a => a.achievementId === achievementId);
            
            if (!userAchievement) {
                userAchievement = { achievementId, progress: 0, unlockedAt: null };
                requester.achievements.push(userAchievement);
            }

            userAchievement.progress = userCollabCount;

            if (!userAchievement.unlockedAt && userAchievement.progress >= achievementData.goal) {
                userAchievement.unlockedAt = new Date().toISOString();
                unlockedAchievements.push(achievementId);
            }
        };

        checkAndUnlock('team_player');
        checkAndUnlock('super_collaborator');

        return { unlockedAchievements };
    }
    
    return { unlockedAchievements: [] };
};

const updateIdeaProgressStage = async (ideaId: string, stage: ProgressStage): Promise<Idea | null> => {
    await delay(300);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        idea.progressStage = stage;
        // Auto-generate Kanban board if moving to "In Development"
        if (stage === 'in-development' && !idea.kanbanBoard) {
            const aiTasks = await generateKanbanTasksFromIdeaBoard(idea);
            const tasks: KanbanBoard['tasks'] = {};
            const taskIds: string[] = [];
            aiTasks.forEach((task, index) => {
                const taskId = `task-${Date.now()}-${index}`;
                // FIX: Explicitly create task object to satisfy TypeScript type for KanbanTask.
                tasks[taskId] = { id: taskId, title: task.title, description: task.description };
                taskIds.push(taskId);
            });
            
            idea.kanbanBoard = {
                tasks,
                columns: {
                    'todo': { id: 'todo', title: 'To Do', taskIds: taskIds },
                    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
                    'done': { id: 'done', title: 'Done', taskIds: [] },
                },
                columnOrder: ['todo', 'in-progress', 'done'],
            };
        }
        return { ...idea }; // Return a copy to ensure state updates
    }
    return null;
};

const endorseSkill = async (endorsedUserId: string, endorsingUserId: string, skillName: string): Promise<User | null> => {
    await delay(200);
    const user = MOCK_USERS.find(u => u.userId === endorsedUserId);
    if (user) {
        const skill = user.skills.find(s => s.skillName === skillName);
        if (skill) {
            if (!skill.endorsers.includes(endorsingUserId)) {
                skill.endorsers.push(endorsingUserId);
            } else {
                // Retract endorsement
                skill.endorsers = skill.endorsers.filter(id => id !== endorsingUserId);
            }
            return { ...user };
        }
    }
    return null;
}

const completeMilestone = async (ideaId: string, milestoneId: string): Promise<{ idea: Idea, post: MilestonePost } | null> => {
    await delay(500);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        const milestone = idea.roadmap.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.status = 'completed';
            milestone.completedAt = new Date().toISOString();
            
            const newPost: MilestonePost = {
                postId: `mp-${Date.now()}`,
                ideaId: idea.ideaId,
                milestoneTitle: milestone.title,
                createdAt: new Date().toISOString(),
            };
            MOCK_MILESTONE_POSTS.unshift(newPost);
            
            createNotification({
                userId: idea.ownerId,
                type: 'MILESTONE_COMPLETED',
                message: `You've completed the milestone "${milestone.title}" for your idea! A success story has been posted to the feed.`,
                link: { page: 'ideaDetail', id: idea.ideaId }
            });

            return { idea: { ...idea }, post: newPost };
        }
    }
    return null;
};

const addMilestone = async (ideaId: string, milestoneData: Omit<Milestone, 'id' | 'status' | 'completedAt'>): Promise<Idea | null> => {
    await delay(300);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        const newMilestone: Milestone = {
            ...milestoneData,
            id: `m-${Date.now()}`,
            status: 'pending',
        };
        idea.roadmap.push(newMilestone);
        return { ...idea };
    }
    return null;
};

const editMilestone = async (ideaId: string, milestoneId: string, milestoneData: Partial<Omit<Milestone, 'id'>>): Promise<Idea | null> => {
    await delay(300);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        const milestoneIndex = idea.roadmap.findIndex(m => m.id === milestoneId);
        if (milestoneIndex > -1) {
            idea.roadmap[milestoneIndex] = { ...idea.roadmap[milestoneIndex], ...milestoneData };
            return { ...idea };
        }
    }
    return null;
};

const deleteMilestone = async (ideaId: string, milestoneId: string): Promise<Idea | null> => {
    await delay(300);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        idea.roadmap = idea.roadmap.filter(m => m.id !== milestoneId);
        return { ...idea };
    }
    return null;
};

const updateKanbanBoard = async (ideaId: string, board: KanbanBoard): Promise<Idea | null> => {
    await delay(300);
    const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
    if (idea) {
        idea.kanbanBoard = board;
        return { ...idea };
    }
    return null;
};


// NOTE: This is a partial implementation to satisfy the compiler errors. 
// A full production-ready mock API would be much larger.
const getNotificationsByUserId = async(userId: string) => { await delay(100); return MOCK_NOTIFICATIONS.filter(n => n.userId === userId); };
const getUserAchievements = async(userId: string) => { await delay(100); return MOCK_USERS.find(u=>u.userId === userId)?.achievements || []; };
const sendConnectionRequest = async(_fromUserId: string, _toUserId: string) => { await delay(200); return true; };
const getCollaborationRequestsByIdeaId = async(ideaId: string) => { await delay(100); return MOCK_COLLABORATION_REQUESTS.filter(r => r.ideaId === ideaId); };
const getCommentsByIdeaId = async(ideaId: string) => { await delay(100); return MOCK_COMMENTS.filter(c => c.ideaId === ideaId); };
const getBlockchainRecordsByIdeaId = async(ideaId: string) => { await delay(100); return MOCK_BLOCKCHAIN_RECORDS.filter(r => r.ideaId === ideaId); };
const getFeedbackByIdeaId = async(ideaId: string) => { await delay(100); return MOCK_FEEDBACK.filter(f => f.ideaId === ideaId); };
const postComment = async(ideaId: string, userId: string, text: string) => { await delay(100); const comment: Comment = { ideaId, userId, text, commentId: `c-${Date.now()}`, createdAt: new Date().toISOString() }; MOCK_COMMENTS.push(comment); const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId); if(idea) idea.commentsCount++; return comment; };
const castVote = async(ideaId: string, userId: string, type: 'up' | 'down') => { await delay(100); const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId); if(idea){ const existingVote = idea.votes.find(v => v.userId === userId); if(existingVote){ if(existingVote.type === type) { idea.votes = idea.votes.filter(v=> v.userId !== userId); } else { existingVote.type = type; } } else { idea.votes.push({userId, type}); } idea.likesCount = idea.votes.filter(v=>v.type==='up').length; return {...idea}; } return MOCK_IDEAS[0]; };
const submitFeedback = async(feedbackData: Omit<Feedback, 'feedbackId' | 'createdAt'>): Promise<{ feedback: Feedback, unlockedAchievements: AchievementId[] }> => {
    await delay(200);
    const feedback: Feedback = { ...feedbackData, feedbackId: `f-${Date.now()}`, createdAt: new Date().toISOString() };
    MOCK_FEEDBACK.push(feedback);

    const unlockedAchievements: AchievementId[] = [];
    const user = MOCK_USERS.find(u => u.userId === feedbackData.userId);
    if (user) {
        // Count unique ideas the user has given feedback on
        const uniqueIdeasWithFeedback = new Set(MOCK_FEEDBACK.filter(f => f.userId === user.userId).map(f => f.ideaId));
        const feedbackCount = uniqueIdeasWithFeedback.size;

        const achievementId: AchievementId = 'valued_critic';
        const achievementData = ACHIEVEMENTS[achievementId];
        let userAchievement = user.achievements.find(a => a.achievementId === achievementId);

        if (!userAchievement) {
            userAchievement = { achievementId, progress: 0, unlockedAt: null };
            user.achievements.push(userAchievement);
        }

        userAchievement.progress = feedbackCount;

        if (!userAchievement.unlockedAt && userAchievement.progress >= achievementData.goal) {
            userAchievement.unlockedAt = new Date().toISOString();
            unlockedAchievements.push(achievementId);
        }
    }

    return { feedback, unlockedAchievements };
};
const getCommentsByNodeId = async(ideaId: string) => { await delay(100); return MOCK_NODE_COMMENTS.filter(c => c.ideaId === ideaId); };
const getBoardVersions = async(ideaId: string): Promise<IdeaBoardVersion[]> => { 
    await delay(100); 
    return MOCK_BOARD_VERSIONS
        .filter(v => v.ideaId === ideaId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
const updateIdeaBoard = async(ideaId: string, nodes: IdeaNode[]) => { await delay(500); const idea = MOCK_IDEAS.find(i=> i.ideaId === ideaId); if(idea) idea.ideaBoard.nodes = nodes; };
const saveBoardVersion = async(ideaId: string, nodes: IdeaNode[], name: string): Promise<IdeaBoardVersion> => { 
    await delay(200); 
    const version: IdeaBoardVersion = { 
        ideaId, 
        nodes, 
        name, 
        versionId: `v-${Date.now()}`, 
        createdAt: new Date().toISOString() 
    }; 
    MOCK_BOARD_VERSIONS.unshift(version); 
    return version; 
};
const revertToBoardVersion = async(ideaId: string, versionId: string): Promise<IdeaNode[] | null> => { 
    await delay(200);
    const version = MOCK_BOARD_VERSIONS.find(v => v.versionId === versionId);
    if (version) {
        const idea = MOCK_IDEAS.find(i => i.ideaId === ideaId);
        if (idea) {
            idea.ideaBoard.nodes = JSON.parse(JSON.stringify(version.nodes)); // Deep copy to prevent mutation issues
            return idea.ideaBoard.nodes;
        }
    }
    return null;
};
const addNodeComment = async(ideaId: string, nodeId: string, userId: string, text: string) => { await delay(100); const comment: NodeComment = { ideaId, nodeId, userId, text, commentId: `nc-${Date.now()}`, createdAt: new Date().toISOString() }; MOCK_NODE_COMMENTS.push(comment); return comment;};
const shareAchievementToFeed = async(_userId: string, _achievementId: AchievementId) => { await delay(200); };
const updateUser = async (userId: string, data: Partial<User> & { skills?: string[] | { skillName: string, endorsers: string[] }[] }) => {
    await delay(200);
    const user = MOCK_USERS.find(u => u.userId === userId);
    if (user) {
        const { skills, ...restOfData } = data;
        Object.assign(user, restOfData);
        if (skills && skills.length > 0 && typeof skills[0] === 'string') {
            user.skills = (skills as string[]).map(skillName => ({ skillName, endorsers: [] }));
        } else if (skills) {
            user.skills = skills as { skillName: string, endorsers: string[] }[];
        }
        return user;
    }
    return null;
};
const getConversationsByUserId = async(userId: string) => { await delay(100); return MOCK_CONVERSATIONS.filter(c => c.participants.includes(userId)); };
const getMessagesByConversationId = async(convoId: string) => { await delay(100); return MOCK_MESSAGES.filter(m => m.conversationId === convoId); };
const getForumMessages = async(ideaId: string) => { await delay(100); return MOCK_FORUM_MESSAGES.filter(m => m.ideaId === ideaId); };
const postForumMessage = async(ideaId: string, senderId: string, text: string) => { await delay(100); const msg: ForumMessage = { ideaId, senderId, text, messageId: `fm-${Date.now()}`, createdAt: new Date().toISOString() }; MOCK_FORUM_MESSAGES.push(msg); return msg; };
const addForumMember = async(_ideaId: string, _userId: string) => { await delay(200); return true; };
const removeForumMember = async(_ideaId: string, _userId: string) => { await delay(200); return true; };
const deleteForumMessage = async(_messageId: string) => { await delay(200); };
const pinForumMessage = async(_messageId: string) => { await delay(200); };
const getAnalyticsForIdea = async(_ideaId: string): Promise<IdeaAnalytics | null> => { await delay(500); return { totalViews: 1234, uniqueVisitors: 843, engagementRate: 15.2, collaborationConversionRate: 5.5, viewsOverTime: [{date: new Date(Date.now() - 6*86400000).toISOString(), views: 100}, {date: new Date().toISOString(), views: 250}], geography: [{region: 'North America', views: 500}], trafficSources: [{source: 'Direct', visits: 300}], collaboratorSkillDemographics: [{skill: 'Design', count: 2}] }; };
const updateNotificationSettings = async(userId: string, settings: NotificationSettings) => { await delay(200); const user = MOCK_USERS.find(u => u.userId === userId); if(user) { user.notificationSettings = settings; return user; } return null; };
const markAllNotificationsAsRead = async(userId: string) => { await delay(100); MOCK_NOTIFICATIONS.forEach(n => { if (n.userId === userId) n.read = true; }); };

const startConversation = async(fromUserId: string, toUserId: string): Promise<Conversation> => {
    await delay(200);
    // Check for existing conversation
    let existing = MOCK_CONVERSATIONS.find(c => c.participants.includes(fromUserId) && c.participants.includes(toUserId));
    if (existing) return existing;

    // Check if users are connected
    const fromUser = MOCK_USERS.find(u => u.userId === fromUserId);
    const areConnected = fromUser?.connections.includes(toUserId);
    
    const status = areConnected ? 'accepted' : 'pending';
    const convoId = `convo-${Date.now()}`;
    const initialMessage: Message = {
        messageId: `m-${Date.now()}`,
        conversationId: convoId,
        senderId: fromUserId,
        text: status === 'pending' ? 'Sent a connection request.' : 'Started a new conversation.',
        createdAt: new Date().toISOString(),
        isRead: false,
    };
    
    const newConvo: Conversation = {
        conversationId: convoId,
        participants: [fromUserId, toUserId],
        status,
        lastMessage: initialMessage,
        lastUpdatedAt: new Date().toISOString(),
        unreadCount: { [toUserId]: 1 }
    };

    MOCK_CONVERSATIONS.unshift(newConvo);
    MOCK_MESSAGES.push(initialMessage);

    if (status === 'pending') {
         createNotification({
            userId: toUserId,
            type: 'MESSAGE_REQUEST',
            message: `${fromUser?.name} wants to connect and sent you a message.`,
            link: { page: 'inbox', id: '' }
        });
    }

    return newConvo;
};

const acceptMessageRequest = async (conversationId: string): Promise<boolean> => {
    await delay(300);
    const convo = MOCK_CONVERSATIONS.find(c => c.conversationId === conversationId);
    if (convo && convo.status === 'pending') {
        convo.status = 'accepted';
        // Add users to each other's connections
        const [user1Id, user2Id] = convo.participants;
        const user1 = MOCK_USERS.find(u => u.userId === user1Id);
        const user2 = MOCK_USERS.find(u => u.userId === user2Id);
        if (user1 && user2) {
            if (!user1.connections.includes(user2Id)) {
                user1.connections.push(user2Id);
            }
            if (!user2.connections.includes(user1Id)) {
                user2.connections.push(user1Id);
            }
            // Create notifications for both users
            createNotification({
                userId: user1Id,
                type: 'NEW_CONNECTION',
                message: `You are now connected with ${user2.name}.`,
                link: { page: 'profile', id: user2Id }
            });
            createNotification({
                userId: user2Id,
                type: 'NEW_CONNECTION',
                message: `You are now connected with ${user1.name}.`,
                link: { page: 'profile', id: user1Id }
            });
            return true;
        }
    }
    return false;
};
const addReactionToMessage = async (messageId: string, userId: string, emoji: string): Promise<Message | null> => {
    await delay(100);
    const message = MOCK_MESSAGES.find(m => m.messageId === messageId);
    if (message) {
        if (!message.reactions) {
            message.reactions = [];
        }
        const existingReaction = message.reactions.find(r => r.userId === userId);
        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // User clicked the same emoji, so remove reaction
                message.reactions = message.reactions.filter(r => r.userId !== userId);
            } else {
                // User changed their reaction
                existingReaction.emoji = emoji;
            }
        } else {
            // New reaction
            message.reactions.push({ userId, emoji });
        }
        return { ...message };
    }
    return null;
}
const sendMessage = async (conversationId: string, senderId: string, text: string, options?: { replyToMessageId?: string; media?: Message['media'] }): Promise<Message> => {
    await delay(100);
    const newMessage: Message = {
        messageId: `m-${Date.now()}`,
        conversationId,
        senderId,
        text,
        createdAt: new Date().toISOString(),
        isRead: false,
        ...options,
    };
    MOCK_MESSAGES.push(newMessage);
    const convo = MOCK_CONVERSATIONS.find(c => c.conversationId === conversationId);
    if (convo) {
        convo.lastMessage = newMessage;
        convo.lastUpdatedAt = newMessage.createdAt;
        convo.participants.forEach(pId => {
            if (pId !== senderId) {
                if (convo.unreadCount[pId]) {
                    convo.unreadCount[pId]++;
                } else {
                    convo.unreadCount[pId] = 1;
                }
            }
        });
    }
    return newMessage;
};

export const api = {
    login,
    signUp,
    getUserById,
    getAllUsers,
    getIdeaById,
    getAllIdeas,
    getIdeasByOwnerId,
    getIdeasByCollaboratorId,
    getFeedItems,
    addIdea,
    getRecommendedCollaborators,
    submitReport,
    submitCollaborationRequest,
    updateCollaborationRequestStatus,
    updateIdeaProgressStage,
    endorseSkill,
    completeMilestone,
    addMilestone,
    editMilestone,
    deleteMilestone,
    getNotificationsByUserId,
    getUserAchievements,
    sendConnectionRequest,
    getCollaborationRequestsByIdeaId,
    getCommentsByIdeaId,
    getBlockchainRecordsByIdeaId,
    getFeedbackByIdeaId,
    postComment,
    castVote,
    submitFeedback,
    getCommentsByNodeId,
    getBoardVersions,
    updateIdeaBoard,
    saveBoardVersion,
    revertToBoardVersion,
    addNodeComment,
    shareAchievementToFeed,
    updateUser,
    getConversationsByUserId,
    getMessagesByConversationId,
    getForumMessages,
    postForumMessage,
    addForumMember,
    removeForumMember,
    deleteForumMessage,
    pinForumMessage,
    getAnalyticsForIdea,
    updateNotificationSettings,
    markAllNotificationsAsRead,
    startConversation,
    acceptMessageRequest,
    sendMessage,
    addReactionToMessage,
    updateKanbanBoard,
};