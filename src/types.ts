// C:\Users\hemant\Downloads\synapse\src\types.ts

export type Page =
    | 'login'
    | 'feed'
    | 'profile'
    | 'ideaDetail'
    | 'newIdea'
    | 'ideaBoard'
    | 'connections'
    | 'bookmarks'
    | 'inbox'
    | 'chat'
    | 'forum'
    | 'explore'
    | 'notifications'
    | 'privacyPolicy'
    | 'privacy'
    | 'analytics'
    | 'onboarding'
    | 'notificationSettings'
    | 'kanban'
    | 'verify-email'
    | 'forgot-password'
    | 'reset-password'
    | 'search'
    | 'trending'
    | 'notificationCenter'
    | 'settings'
    | 'achievements'
    | 'leaderboard'
    | 'spaces'
    | 'events'
    | 'premium'
    | 'investor'
    | 'activity'
    | 'quests'
    | 'mentorship'
    | 'developer'
    | 'bounties'
    | 'jobs'
    | 'compare'
    | 'trendingTags'
    | 'status'
    | 'changelog'
    | 'stats'
    | 'roadmap';

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
    ideaId: string; // Added based on FeedItem
    milestoneTitle?: string; // Renamed based on FeedItem
    userId?: string; // Added based on FeedItem
    title?: string; // Added based on FeedItem
    description?: string; // Added based on FeedItem
    milestoneType?: string; // Added based on FeedItem
    relatedSkills?: string[]; // Added based on FeedItem
    createdAt: string;
    updatedAt?: string; // Added based on FeedItem
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
  id?: string; // Backend may send 'id' as alias
  name?: string; // Legacy alias for displayName (some components still use it)
  displayName?: string; // Preferred name field
  email: string;
  avatarUrl: string;
  coverImageUrl?: string; // Profile banner
  bio: string;
  skills?: SkillEndorsement[];
  interests?: string[];
  connections: string[]; // array of userIds
  followers?: string[];
  following?: string[];
  bookmarkedIdeas?: string[];
  achievements?: UserAchievement[];
  linkedInUrl?: string;
  portfolioUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  location?: string;
  headline?: string; // Short tagline
  onboardingCompleted: boolean;
  notificationSettings?: NotificationSettings;
  username?: string;
  userType?: 'thinker' | 'doer' | 'investor' | 'admin';
  isVerified?: boolean;
  isPremium?: boolean;
  streakDays?: number;
  reputationScore?: number;
  profileCompletion?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Idea {
  ideaId: string;
  ownerId: string; // userId
  title: string;
  summary: string;
  tags: string[]; // Ensure this is always an array []
  sector?: string;
  region?: string;
  requiredSkills: string[]; // Ensure this is always an array []
  questionnaire?: Questionnaire; // Make optional
  ideaBoard?: IdeaBoard; // Make optional
  status?: 'active' | 'archived' | 'in-development'; // Make optional
  progressStage?: ProgressStage; // Make optional
  createdAt: string; // ISO date string
  likesCount: number;
  commentsCount: number;
  collaborators?: string[]; // Make optional, ensure array
  forumMembers?: string[]; // Make optional, ensure array
  blockchainHash?: string;
  blockchainTimestamp?: string;
  votes?: Vote[]; // Make optional
  isUnderReview?: boolean;
  roadmap?: Milestone[]; // Make optional
  kanbanBoard?: KanbanBoard;
  // Add backend fields expected by components
  ownerUsername?: string;
  ownerDisplayName?: string;
  ownerAvatarUrl?: string;
  description: string;
  isPublic: boolean; // Keep non-optional based on usage
  aiAnalysis?: any;
  updatedAt?: string;
  // Add fields from feed query
  id?: string; // Backend might send 'id' sometimes? Keep optional for safety.
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
  engagementRate: number;
  collaborationConversionRate: number;
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
    | 'MILESTONE_COMPLETED';

export interface Notification {
  id: string;
  userId: string; // Changed from user_id if backend sends userId
  type: NotificationType;
  message?: string; // Make optional if not always present
  content?: string; // Added based on backend table
  read?: boolean; // Changed from is_read if backend sends read
  is_read?: boolean; // Keep if backend sends this
  createdAt: string; // ISO date string
  created_at?: string; // Keep if backend sends this
  link?: { // Make optional
      page: Page;
      id: string;
  };
  link_url?: string; // Added based on backend table
}

export interface Comment {
    commentId: string; // Use this one
    id?: string; // Add if backend sends 'id'
    ideaId: string;
    userId: string;
    text: string;
    createdAt: string;
    created_at?: string; // Add if backend sends 'created_at'
    isUnderReview?: boolean;
    // Add fields returned by backend query
    username?: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface Feedback {
  feedbackId: string; // Use this one
  id?: string; // Add if backend sends 'id'
  ideaId: string;
  userId: string;
  ratings?: { // Make optional
    problemClarity: number;
    solutionViability: number;
    marketPotential: number;
  };
  comment?: string; // Make optional
  createdAt: string;
  created_at?: string; // Add if backend sends 'created_at'
  feasibility?: number;
  innovation?: number;
  marketPotential?: number; // Check name consistency with backend (market_potential?)
  market_potential?: number; // Add if backend sends snake_case
}

export interface Reaction {
    userId: string;
    emoji: string;
}

export interface Message {
  messageId: string; // Use this one
  id?: string; // Add if backend sends 'id'
  conversationId: string;
  senderId: string;
  text?: string; // Make optional if not always present
  content?: string; // Add based on backend table
  createdAt: string; // ISO date string
  created_at?: string; // Add if backend sends 'created_at'
  isRead: boolean; // Use this one
  read?: boolean; // Add if backend sends 'read'
  reactions?: Reaction[];
  replyToMessageId?: string;
  media?: {
      url: string;
      type: 'image' | 'file';
      fileName: string;
  };
  // Add fields returned by backend query
  sender_id?: string;
  recipient_id?: string;
  message_type?: string;
  file_url?: string;
}

export interface Conversation {
  conversationId: string; // Use this one
  id?: string; // If backend also returns 'id'
  participants?: string[]; // Make optional, array of userIds
  lastMessage?: Message;
  lastUpdatedAt?: string; // ISO date string
  unreadCount?: { [userId: string]: number };
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  admins?: string[];
  status?: 'pending' | 'accepted' | 'blocked';
  // Add fields returned by backend query
  userId?: string; // Other user's ID
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  lastMessageTime?: string; // Added based on backend query
  other_user_id?: string; // Added based on backend query
  other_username?: string; // Added based on backend query
  other_display_name?: string; // Added based on backend query
  other_avatar_url?: string; // Added based on backend query
  last_message?: string; // Added based on backend query
  last_message_time?: string; // Added based on backend query
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
    collaborationRequests?: NotificationChannel[]; // Make optional
    collaborationUpdates?: NotificationChannel[];
    commentsOnMyIdeas?: NotificationChannel[];
    feedbackOnMyIdeas?: NotificationChannel[];
    newConnections?: NotificationChannel[];
    achievementUnlocks?: NotificationChannel[];
    directMessages?: NotificationChannel[];
    messageReactions?: NotificationChannel[];
    doNotDisturb?: { // Make optional
        enabled: boolean;
        startTime: string;
        endTime: string;
    };
}


// --- GAMIFICATION TYPES ---

export type AchievementId =
  | 'first_thought'
  | 'serial_innovator'
  | 'team_player'
  | 'super_collaborator'
  | 'valued_critic'
  | 'community_pillar'
  // Legacy IDs from older types/index.ts kept for backend compatibility
  | 'first_idea'
  | 'five_collaborators'
  | 'forum_enthusiast'
  | 'popular_idea'
  | 'early_adopter'
  // Additional achievements
  | 'streak_7'
  | 'streak_30'
  | 'mentor'
  | 'verified_profile'
  | 'top_contributor';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  goal: number;
  icon: 'LightbulbIcon' | 'UsersIcon' | 'StarIcon' | 'TrophyIcon';
}

export interface UserAchievement {
  achievementId: AchievementId; // Use this one
  achievement_id?: AchievementId; // Add if backend sends snake_case
  progress?: number;
  unlockedAt: string | null; // Use this one
  unlocked_at?: string | null; // Add if backend sends snake_case
  // Add fields returned by backend query
  id?: string;
  userId?: string;
  user_id?: string;
}

export interface AchievementPost {
    postId: string; // Use this one
    id?: string; // Add if backend sends id
    userId: string;
    achievementId: AchievementId; // Use this one
    achievement_id?: AchievementId; // Add if backend sends this
    createdAt: string;
    created_at?: string; // Add if backend sends this
    // Add fields returned by backend query
    title?: string;
    description?: string;
    achievementType?: string; // Use this one
    achievement_type?: string; // Add if backend sends this
    skillsGained?: string[]; // Use this one
    skills_gained?: string[]; // Add if backend sends this
    updatedAt?: string;
    updated_at?: string; // Add if backend sends this
    isPublic?: boolean; // Added based on backend query
    is_public?: boolean; // Add if backend sends this
}

// --- FIX: IdeaBoard interface is simplified to match logic ---
export interface IdeaBoard {
  nodes: IdeaNode[];
  isPublic: boolean;
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

// --- NEW FEATURE TYPES (added for app expansion) ---

/** Reaction emojis allowed on ideas and comments */
export type ReactionEmoji = '👍' | '❤️' | '🔥' | '💡' | '🚀' | '👀' | '🎉';

export interface IdeaReaction {
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: ReactionEmoji;
  count: number;
  hasReacted: boolean;
}

/** Follow / social graph */
export interface FollowEdge {
  followerId: string;
  followingId: string;
  createdAt: string;
}

/** Tag with usage count, for autocomplete + trending */
export interface Tag {
  name: string;
  count: number;
  slug?: string;
}

/** Activity feed item — what your followed users are doing */
export type ActivityType =
  | 'posted_idea'
  | 'commented'
  | 'reacted'
  | 'achieved'
  | 'connected'
  | 'milestone';

export interface Activity {
  activityId: string;
  actorId: string;
  type: ActivityType;
  targetType?: 'idea' | 'comment' | 'user';
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/** Command palette command spec */
export interface PaletteCommand {
  id: string;
  label: string;
  description?: string;
  group: 'navigation' | 'create' | 'actions' | 'settings' | 'ideas' | 'people';
  icon?: string;
  keywords?: string[];
  shortcut?: string;
  perform: () => void;
}

/** Settings page sub-sections */
export type SettingsSection =
  | 'account'
  | 'profile'
  | 'notifications'
  | 'privacy'
  | 'appearance'
  | 'security'
  | 'integrations'
  | 'danger';

/** Theme variants */
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'violet' | 'rose' | 'emerald' | 'amber' | 'sky';

/** Toast intent */
export type ToastIntent = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';