export type Page = 'login' | 'feed' | 'profile' | 'ideaDetail' | 'newIdea' | 'ideaBoard' | 'connections' | 'bookmarks' | 'inbox' | 'chat' | 'forum' | 'explore' | 'notifications' | 'privacyPolicy' | 'analytics' | 'onboarding' | 'notificationSettings' | 'kanban';

// --- CORE TYPES ---
export interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: 'pending' | 'completed';
    completedAt?: string;
}

export interface MilestonePost {
    postId: string;
    ideaId: string;
    milestoneTitle: string;
    createdAt: string;
}

export interface SkillEndorsement {
    skillName: string;
    endorsers: string[];
}

export type KanbanColumnId = 'todo' | 'in-progress' | 'done';

export interface KanbanTask {
    id: string;
    title: string;
    description: string;
    assignedTo?: string[];
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

// --- USER & AUTH TYPES ---
export interface User {
  userId: string;
  id?: string; // Added for Login.tsx compatibility
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  skills: SkillEndorsement[];
  interests: string[];
  connections: string[];
  bookmarkedIdeas: string[];
  achievements: UserAchievement[];
  linkedInUrl?: string;
  portfolioUrl?: string;
  onboardingCompleted?: boolean;
  notificationSettings: NotificationSettings;
  createdAt?: string; // Added for backend compatibility
}

// --- IDEA TYPES ---
export interface Idea {
  ideaId: string;
  ownerId: string;
  title: string;
  summary: string;
  description?: string; // Added for backward compatibility
  tags: string[];
  sector: string;
  region: string;
  requiredSkills: string[];
  questionnaire: Questionnaire;
  ideaBoard: IdeaBoard;
  status: 'active' | 'archived' | 'in-development';
  progressStage: ProgressStage;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  collaborators: string[];
  forumMembers: string[];
  blockchainHash?: string;
  blockchainTimestamp?: string;
  votes: Vote[];
  isUnderReview?: boolean;
  roadmap: Milestone[];
  kanbanBoard?: KanbanBoard;
  updatedAt?: string; // Added for backward compatibility
}

export type FeedItem = 
    | { type: 'idea'; data: Idea }
    | { type: 'achievement'; data: AchievementPost }
    | { type: 'milestone'; data: MilestonePost };

// --- IDEA BOARD TYPES ---
export interface IdeaNode {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  connections: string[];
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

// --- COLLABORATION TYPES ---
export interface RecommendedCollaborator extends User {
    matchScore: number;
    reason: string;
}

export interface CollaborationRequest {
  requestId: string;
  ideaId: string;
  requesterId: string;
  skills: string;
  contribution: string;
  motivation: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

// --- COMMENT & FEEDBACK TYPES ---
export interface Comment {
    commentId: string;
    ideaId: string;
    userId: string;
    text: string;
    createdAt: string;
    isUnderReview?: boolean;
}

export interface NodeComment {
  commentId: string;
  ideaId: string;
  nodeId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Feedback {
  feedbackId: string;
  ideaId: string;
  userId: string;
  ratings: {
    problemClarity: number;
    solutionViability: number;
    marketPotential: number;
  };
  comment: string;
  createdAt: string;
}

// --- MESSAGING TYPES ---
export interface Reaction {
    userId: string;
    emoji: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
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
  participants: string[];
  lastMessage: Message;
  lastUpdatedAt: string;
  unreadCount: { [userId: string]: number };
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  admins?: string[];
  status?: 'pending' | 'accepted' | 'blocked';
}

export interface ForumMessage {
  messageId: string;
  ideaId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isPinned?: boolean;
}

// --- ANALYTICS TYPES ---
export interface IdeaAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  engagementRate: number;
  collaborationConversionRate: number;
  viewsOverTime: { date: string; views: number }[];
  geography: { region: string; views: number }[];
  trafficSources: { source: string; visits: number }[];
  collaboratorSkillDemographics: { skill: string; count: number }[];
}

// --- NOTIFICATION TYPES ---
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
    | 'MILESTONE_COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  link: {
      page: Page;
      id: string;
  };
}

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
        startTime: string;
        endTime: string;
    };
}

// --- BLOCKCHAIN & REPORTING TYPES ---
export interface BlockchainRecord {
  recordId: string;
  ideaId: string;
  transactionHash: string;
  blockchainNetwork: string;
  timestamp: string;
  recordType: "timestamp" | "collaboration" | "ownership";
  collaboratorId?: string;
}

export interface Report {
  reportId: string;
  contentType: 'idea' | 'comment' | 'user';
  contentId: string;
  reporterId: string;
  reason: string; // Simplified to avoid import issues
  details: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
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

// --- COMPONENT PROP TYPES ---
export interface IdeaCardProps {
    idea: Idea;
    setPage: (page: Page, id?: string) => void;
}

export interface NewIdeaFormProps {
    setPage: (page: Page, id?: string) => void;
    setSelectedIdeaId: (id: string | null) => void;
    onAchievementsUnlock: (achievementIds: AchievementId[]) => void;
}