

export type Page = 'login' | 'feed' | 'profile' | 'ideaDetail' | 'newIdea' | 'ideaBoard' | 'connections' | 'bookmarks' | 'inbox' | 'chat' | 'forum' | 'explore' | 'notifications' | 'privacyPolicy' | 'analytics' | 'onboarding' | 'notificationSettings' | 'kanban';

// --- NEW TYPES ---
export interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: string; // ISO date string
    status: 'pending' | 'completed';
    completedAt?: string; // ISO date string
}

export interface MilestonePost {
    postId: string;
    ideaId: string;
    milestoneTitle: string;
    createdAt: string;
}

export interface SkillEndorsement {
    skillName: string;
    endorsers: string[]; // array of userIds
}

export type KanbanColumnId = 'todo' | 'in-progress' | 'done';

export interface KanbanTask {
    id: string;
    title: string;
    description: string;
    assignedTo?: string[]; // array of userIds
}

export interface KanbanColumn {
    id: KanbanColumnId;
    title: string;
    taskIds: string[];
}

export interface KanbanBoard {
    tasks: Record<string, KanbanTask>;
    columns: Record<KanbanColumnId, KanbanColumn>;
    columnOrder: KanbanColumnId[];
}


// --- UPDATED TYPES ---
export interface User {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  skills: SkillEndorsement[];
  interests: string[];
  connections: string[]; // array of userIds
  bookmarkedIdeas: string[]; // array of ideaIds
  achievements: UserAchievement[];
  linkedInUrl?: string;
  portfolioUrl?: string;
  onboardingCompleted?: boolean;
  notificationSettings: NotificationSettings;
}

export interface Idea {
  ideaId: string;
  ownerId: string; // userId
  title: string;
  summary: string;
  tags: string[];
  sector: string;
  region: string;
  requiredSkills: string[];
  questionnaire: Questionnaire;
  ideaBoard: IdeaBoard;
  status: 'active' | 'archived' | 'in-development';
  progressStage: ProgressStage;
  createdAt: string; // ISO date string
  likesCount: number; // Retaining for simple feed display
  commentsCount: number;
  collaborators: string[]; // array of userIds
  forumMembers: string[]; // array of userIds
  blockchainHash?: string; // Initial hash for backwards compatibility/simple display
  blockchainTimestamp?: string; // Initial timestamp
  votes: Vote[];
  isUnderReview?: boolean;
  roadmap: Milestone[];
  kanbanBoard?: KanbanBoard;
}

export type FeedItem = 
    | { type: 'idea'; data: Idea }
    | { type: 'achievement'; data: AchievementPost }
    | { type: 'milestone'; data: MilestonePost };
    
// --- EXISTING TYPES ---
export interface RecommendedCollaborator extends User {
    matchScore: number;
    reason: string;
}

export interface NodeComment {
  commentId: string;
  ideaId: string;
  nodeId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface IdeaNode {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  connections: string[]; // array of nodeIds
}

export interface IdeaBoard {
  nodes: IdeaNode[];
  isPublic: boolean;
}

export interface IdeaBoardVersion {
  versionId: string;
  ideaId: string;
  nodes: IdeaNode[];
  createdAt: string;
  name: string;
}

export interface Questionnaire {
  problemStatement: string;
  targetAudience: string;
  resourcesNeeded: string;
  timeline: string;
  skillsLooking: string;
  visionForSuccess: string;
}

export type ProgressStage = 'idea-stage' | 'team-building' | 'in-development' | 'launched';

export interface Vote {
  userId: string;
  type: 'up' | 'down';
}

export interface IdeaAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  engagementRate: number; // (likes + comments + feedback) / views
  collaborationConversionRate: number; // approved requests / total requests
  viewsOverTime: { date: string; views: number }[];
  geography: { region: string; views: number }[];
  trafficSources: { source: string; visits: number }[];
  collaboratorSkillDemographics: { skill: string; count: number }[];
}

export type NotificationType = 
    | 'COLLABORATION_REQUEST' 
    | 'COLLABORATION_APPROVED'
    | 'NEW_COMMENT'
    | 'NEW_FEEDBACK'
    | 'NEW_CONNECTION'
    | 'ACHIEVEMENT_UNLOCKED'
    | 'CONTENT_REPORTED_OWNER'
    | 'CONTENT_REPORTED_REPORTER'
    | 'IDEA_TIMESTAMPED'
    | 'COLLABORATION_RECORDED'
    | 'NEW_MESSAGE'
    | 'MESSAGE_REQUEST'
    | 'MILESTONE_COMPLETED'; // New Notification Type

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string; // ISO date string
  link: {
      page: Page;
      id: string;
  };
}

export interface Comment {
    commentId: string;
    ideaId: string;
    userId: string;
    text: string;
    createdAt: string;
    isUnderReview?: boolean;
}

export interface Feedback {
  feedbackId: string;
  ideaId: string;
  userId: string;
  ratings: {
    problemClarity: number; // 1-5
    solutionViability: number; // 1-5
    marketPotential: number; // 1-5
  };
  comment: string;
  createdAt: string;
}

export interface Reaction {
    userId: string;
    emoji: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO date string
  isRead: boolean;
  reactions?: Reaction[];
  replyToMessageId?: string;
  media?: {
      url: string;
      type: 'image' | 'file';
      fileName: string;
  };
}

export interface Conversation {
  conversationId: string;
  participants: string[]; // array of userIds
  lastMessage: Message;
  lastUpdatedAt: string; // ISO date string
  unreadCount: { [userId: string]: number };
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  admins?: string[];
  status?: 'pending' | 'accepted' | 'blocked';
}

export interface CollaborationRequest {
  requestId: string;
  ideaId: string;
  requesterId: string;
  skills: string;
  contribution: string;
  motivation: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string; // ISO date string
}

export interface ForumMessage {
  messageId: string;
  ideaId: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO date string
  isPinned?: boolean;
}

export interface BlockchainRecord {
  recordId: string;
  ideaId: string;
  transactionHash: string;
  blockchainNetwork: string; // e.g., "Polygon"
  timestamp: string; // ISO date string
  recordType: "timestamp" | "collaboration" | "ownership";
  collaboratorId?: string; // For 'collaboration' type
}

export interface Report {
  reportId: string;
  contentType: 'idea' | 'comment' | 'user';
  contentId: string;
  reporterId: string;
  reason: keyof typeof import('./constants').REPORT_REASONS;
  details: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
}

// --- NOTIFICATION SETTINGS TYPES ---

export type NotificationChannel = 'inApp' | 'email';

export interface NotificationSettings {
    collaborationRequests: NotificationChannel[];
    collaborationUpdates: NotificationChannel[];
    commentsOnMyIdeas: NotificationChannel[];
    feedbackOnMyIdeas: NotificationChannel[];
    newConnections: NotificationChannel[];
    achievementUnlocks: NotificationChannel[];
    directMessages: NotificationChannel[];
    messageReactions: NotificationChannel[];
    doNotDisturb: {
        enabled: boolean;
        startTime: string; // "HH:mm" format
        endTime: string; // "HH:mm" format
    };
}


// --- GAMIFICATION TYPES ---

export type AchievementId = 'first_thought' | 'serial_innovator' | 'team_player' | 'super_collaborator' | 'valued_critic' | 'community_pillar';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  goal: number;
  icon: 'LightbulbIcon' | 'UsersIcon' | 'StarIcon' | 'TrophyIcon';
}

export interface UserAchievement {
  achievementId: AchievementId;
  progress: number;
  unlockedAt: string | null;
}

export interface AchievementPost {
    postId: string;
    userId: string;
    achievementId: AchievementId;
    createdAt: string;
}

// --- IDEA TEMPLATE TYPES ---

export interface IdeaTemplate {
  id: 'startup' | 'research' | 'creative' | 'impact';
  name: string;
  description: string;
  icon: 'CpuIcon' | 'BookOpenIcon' | 'StarIcon' | 'HeartIcon';
  questionnairePrompts: {
    problemStatement: string;
    targetAudience: string;
    resourcesNeeded: string;
    timeline: string;
    skillsLooking: string;
    visionForSuccess: string;
  };
}
