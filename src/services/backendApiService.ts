import {
  User, Idea, FeedItem, Comment, CollaborationRequest, Notification,
  ProgressStage, Feedback, Milestone, KanbanBoard, Report,
  NotificationSettings, AchievementId, IdeaNode, IdeaBoardVersion, NodeComment,
  BlockchainRecord, Conversation, Message, UserAchievement, RecommendedCollaborator,
  ForumMessage, AchievementPost, MilestonePost
} from '../types';

import { supabase } from '../lib/supabaseClient';

// ✅ Fix: remove /api from BASE_URL to avoid double /api
const API_BASE_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:3001'               // local backend during dev
  : 'https://synapse-backend-api.onrender.com'; // deployed backend

let authToken: string | null = localStorage.getItem('authToken');

interface LoginResponse { user: Partial<User>; token: string; message?: string; }
interface RegisterResponse { user: Partial<User>; token: string; message?: string; error?: string; }
interface CreateIdeaResponse { idea: Idea; unlockedAchievements: AchievementId[]; }
interface UpdateStatusResponse { message?: string; unlockedAchievements?: AchievementId[]; }
interface SubmitFeedbackResponse { feedback: Feedback; unlockedAchievements: AchievementId[]; }
interface AiAnalysisResponse { analysis: any; timestamp: string; }
interface AiSuggestionsResponse { suggestions: string[]; basedOn: any; }
interface BoardVersionResponse extends IdeaBoardVersion { nodes: IdeaNode[] }
interface MarkReadResponse { message?: string }
interface VoteResponse extends Idea {}
interface MilestoneResponse extends Milestone {}
interface KanbanResponse extends KanbanBoard {}
interface RefineSummaryResponse { refinedSummary: string }
interface VerifyTokenResponse { valid: boolean; user?: Partial<User> }
interface StartConversationResponse extends Conversation {}
interface SendMessageResponse extends Message {}
interface ReactionResponse extends Message {}
interface AcceptMessageResponse { conversation: Conversation }

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, ''); // remove trailing slash
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${finalEndpoint}`;

  const token = authToken;
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    console.log(`API Call: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });

    if (response.status === 0) {
      throw new Error('Network error: Cannot connect to server. Check if backend is running.');
    }

    const contentType = response.headers.get('content-type');

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`API Success (${response.status} No Content): ${url}`);
      return {} as T;
    }

    if (!response.ok) {
      let errorMessage = `API error (${response.status}): ${response.statusText || 'Request Failed'}`;
      let errorDetails: any = { status: response.status };

      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = { ...errorDetails, ...errorData };
        } catch { }
      } else {
        try {
          const textError = await response.text();
          if (textError) { errorMessage += ` - ${textError.substring(0, 100)}`; }
        } catch { }
      }

      console.error(`API Failed (${response.status}): ${url}`, errorMessage, errorDetails || '');

      if (response.status === 401 || response.status === 403) {
        console.warn("Authentication error detected. Clearing token and local user.");
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.reload();
      }

      const error = new Error(errorMessage);
      (error as any).details = errorDetails;
      throw error;
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log(`API Success (${response.status}): ${url}`);
      return data;
    }

    console.warn(`API Warning: Non-JSON response from ${url}. Content-Type: ${contentType}`);
    return {} as T;

  } catch (error: any) {
    console.error(`API Network/Fetch Exception: ${options.method || 'GET'} ${finalEndpoint}`, error);
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Network'))) {
      throw new Error('Network error: Could not connect to the API server. Please check your internet connection and ensure the backend is running.');
    }
    throw error;
  }
}

const api = {
  setAuthToken: (newToken: string | null) => {
    authToken = newToken;
    if (newToken) localStorage.setItem('authToken', newToken);
    else localStorage.removeItem('authToken');
    console.log("Auth token updated in service:", newToken ? 'Set' : 'Cleared');
  },

  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (response.token) api.setAuthToken(response.token);
    return response;
  },

  signUp: async (userData: any): Promise<RegisterResponse> => {
    const response = await apiRequest<RegisterResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) });
    if (response.token) api.setAuthToken(response.token);
    return response;
  },

  verifyToken: (tokenToCheck?: string): Promise<VerifyTokenResponse> => {
    const headers: HeadersInit = {};
    if (tokenToCheck) headers['Authorization'] = `Bearer ${tokenToCheck}`;
    else if (!authToken) return Promise.resolve({ valid: false });
    return apiRequest<VerifyTokenResponse>('/api/auth/verify', { method: 'GET', headers });
  },

  verifyEmail: (token: string): Promise<{ success: boolean; message: string }> =>
    apiRequest('/api/auth/verify-email', { 
      method: 'POST', 
      body: JSON.stringify({ token }) 
    }),

  resendVerificationEmail: (email: string): Promise<{ message: string }> =>
    apiRequest('/api/auth/resend-verification', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    }),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    apiRequest('/api/auth/forgot-password', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    }),

  resetPassword: (token: string, password: string): Promise<{ success: boolean; message: string }> =>
    apiRequest('/api/auth/reset-password', { 
      method: 'POST', 
      body: JSON.stringify({ token, newPassword: password }) 
    }),

  getUserById: (userId: string): Promise<User | null> => {
    if (!userId || userId === 'undefined') {
      console.warn(`getUserById called with invalid ID: ${userId}, skipping fetch.`);
      return Promise.resolve(null);
    }
    return apiRequest<User>(`/api/users/${userId}`);
  },

  updateUser: (userData: Partial<User>): Promise<User> =>
    apiRequest<User>('/api/users/me', { method: 'PUT', body: JSON.stringify(userData) }),

  markOnboardingComplete: (): Promise<User> =>
    apiRequest<User>('/api/users/me/onboarding', { method: 'PATCH' }),

  searchUsers: (params: { search?: string; userType?: string; skills?: string[] }): Promise<User[]> =>
    apiRequest<User[]>(`/api/users?${new URLSearchParams(params as any).toString()}`),

  sendConnectionRequest: (targetUserId: string): Promise<void> =>
    apiRequest(`/api/users/${targetUserId}/connect`, { method: 'POST' }),

  getAllIdeas: (params?: { category?: string; stage?: string; search?: string }): Promise<Idea[]> =>
    apiRequest<Idea[]>(`/api/ideas?${new URLSearchParams(params as any).toString()}`),

  getIdeasByOwnerId: (userId: string): Promise<Idea[]> =>
    apiRequest<Idea[]>(`/api/ideas?ownerId=${userId}`),
  
  getIdeasByCollaboratorId: (userId: string): Promise<Idea[]> =>
    apiRequest<Idea[]>(`/api/ideas?collaboratorId=${userId}`),

  getIdeaById: (ideaId: string): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}`),

  addIdea: (ideaData: any): Promise<CreateIdeaResponse> =>
    apiRequest<CreateIdeaResponse>('/api/ideas', { method: 'POST', body: JSON.stringify(ideaData) }),

  updateIdea: (ideaId: string, ideaData: Partial<Idea>): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}`, { method: 'PUT', body: JSON.stringify(ideaData) }),

  updateIdeaProgressStage: (ideaId: string, stage: ProgressStage): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),

  castVote: (ideaId: string, type: 'up' | 'down'): Promise<VoteResponse> =>
    apiRequest<VoteResponse>(`/api/ideas/${ideaId}/vote`, { method: 'POST', body: JSON.stringify({ type }) }),

 getFeedItems: async (): Promise<FeedItem[]> => {
  try {
    // Try to fetch from Supabase
    let ideas: any[] = [];
    let achievements: any[] = [];
    let milestones: any[] = [];

    // Safely attempt Supabase queries
    try {
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('id, owner_id, title, summary, description, stage, tags, sector, region, required_skills, is_public, likes_count, comments_count, collaborators, questionnaire, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!ideasError) ideas = ideasData || [];
    } catch (err) {
      console.warn('Ideas query failed, trying fallback...', err);
      ideas = [];
    }

    // Fetch achievements with safe column selection
    try {
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievement_posts')
        .select('id, user_id, achievement_id, title, description, achievement_type, skills_gained, is_public, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!achievementsError) achievements = achievementsData || [];
    } catch (err) {
      console.warn('Achievements query failed...', err);
      achievements = [];
    }

    // Fetch milestones with safe column selection
    try {
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestone_posts')
        .select('id, idea_id, user_id, title, description, milestone_type, related_skills, is_public, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!milestonesError) milestones = milestonesData || [];
    } catch (err) {
      console.warn('Milestones query failed...', err);
      milestones = [];
    }

    // If no data from Supabase, return empty array (will trigger fallback in component)
    if (!ideas.length && !achievements.length && !milestones.length) {
      return [];
    }

    // Map all to FeedItem[]
    const feed: FeedItem[] = [
      ...(ideas || []).map(i => ({
  type: 'idea' as const,
  data: {
    ideaId: i.id,
    ownerId: i.owner_id, 
    title: i.title,
    summary: i.summary,
    description: i.description,
    stage: i.stage,
    tags: i.tags || [],
    sector: i.sector,
    region: i.region,
    requiredSkills: i.required_skills || [],
    isPublic: i.is_public,
    likesCount: i.likes_count || 0,
    commentsCount: i.comments_count || 0,
    collaborators: i.collaborators || [],
    questionnaire: i.questionnaire || undefined,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  } as Idea,
})),


      ...(achievements || []).map(a => ({
        type: 'achievement' as const,
        data: {
          postId: a.id,
          userId: a.user_id,
          achievementId: a.achievement_id, 
          title: a.title,
          description: a.description,
          achievementType: a.achievement_type,
          skillsGained: a.skills_gained,
          isPublic: a.is_public,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        } as AchievementPost,
      })),

      ...(milestones || []).map(m => ({
        type: 'milestone' as const,
        data: {
          postId: m.id,
           ideaId: m.idea_id,   
          userId: m.user_id,
          title: m.title,
          description: m.description,
          milestoneType: m.milestone_type,
          relatedSkills: m.related_skills,
          isPublic: m.is_public,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        } as MilestonePost,
      })),
    ];

    // Sort feed by createdAt descending
    return feed.sort((a, b) => {
      const da = a.data?.createdAt ? new Date(a.data.createdAt).getTime() : 0;
      const db = b.data?.createdAt ? new Date(b.data.createdAt).getTime() : 0;
      return db - da;
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    // Return empty array so Feed component can show message
    return [];
  }
},


  getCommentsByIdeaId: (ideaId: string): Promise<Comment[]> => apiRequest<Comment[]>(`/api/ideas/${ideaId}/comments`),
  getCommentsByNodeId: (nodeId: string): Promise<NodeComment[]> => apiRequest<NodeComment[]>(`/api/nodes/${nodeId}/comments`),
  postComment: (ideaId: string, text: string): Promise<Comment> =>
    apiRequest<Comment>(`/api/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  getFeedbackByIdeaId: (ideaId: string): Promise<Feedback[]> => apiRequest<Feedback[]>(`/api/ideas/${ideaId}/feedback`),
  submitFeedback: (feedbackData: any): Promise<SubmitFeedbackResponse> =>
    apiRequest<SubmitFeedbackResponse>(`/api/ideas/${feedbackData.ideaId}/feedback`, { method: 'POST', body: JSON.stringify(feedbackData) }),

  getCollaborationRequestsByIdeaId: (ideaId: string): Promise<CollaborationRequest[]> =>
    apiRequest<CollaborationRequest[]>(`/api/ideas/${ideaId}/collaboration-requests`),
  submitCollaborationRequest: (requestData: any): Promise<CollaborationRequest> =>
    apiRequest<CollaborationRequest>(`/api/collaborations`, { method: 'POST', body: JSON.stringify(requestData) }),
  updateCollaborationRequestStatus: (collabId: string, status: 'approved' | 'rejected'): Promise<UpdateStatusResponse> =>
    apiRequest<UpdateStatusResponse>(`/api/collaborations/${collabId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCollaborationsByUserId: (userId: string): Promise<any[]> => apiRequest<any[]>(`/api/collaborations/user/${userId}`),

  updateIdeaBoard: (ideaId: string, nodes: IdeaNode[]): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}/board`, { method: 'PUT', body: JSON.stringify({ nodes }) }),
  saveBoardVersion: (ideaId: string, nodes: IdeaNode[], name: string): Promise<IdeaBoardVersion> =>
    apiRequest<IdeaBoardVersion>(`/api/ideas/${ideaId}/board/versions`, { method: 'POST', body: JSON.stringify({ nodes, name }) }),
  getBoardVersions: (ideaId: string): Promise<IdeaBoardVersion[]> =>
    apiRequest<IdeaBoardVersion[]>(`/api/ideas/${ideaId}/board/versions`),
  revertToBoardVersion: (ideaId: string, versionId: string): Promise<BoardVersionResponse> =>
    apiRequest<BoardVersionResponse>(`/api/ideas/${ideaId}/board/versions/${versionId}/revert`, { method: 'POST' }),

  getBlockchainRecordsByIdeaId: (ideaId: string): Promise<BlockchainRecord[]> =>
    apiRequest<BlockchainRecord[]>(`/api/ideas/${ideaId}/blockchain-records`),

  startConversation: (otherUserId: string): Promise<StartConversationResponse> =>
    apiRequest<StartConversationResponse>(`/api/chat/conversations`, {
      method: 'POST',
      body: JSON.stringify({ participants: [otherUserId] })
    }),
  getConversationsByUserId: (): Promise<Conversation[]> =>
    apiRequest<Conversation[]>(`/api/chat/conversations`),
  getConversationById: (conversationId: string): Promise<Conversation> =>
    apiRequest<Conversation>(`/api/chat/conversations/${conversationId}`),
  getMessagesByConversationId: (conversationId: string): Promise<Message[]> =>
    apiRequest<Message[]>(`/api/chat/conversations/${conversationId}/messages`),
  sendMessage: (payload: { conversationId: string; text: string; replyToMessageId?: string; media?: any }): Promise<SendMessageResponse> =>
    apiRequest<SendMessageResponse>(`/api/chat/conversations/${payload.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: payload.text, replyToMessageId: payload.replyToMessageId, media: payload.media }),
    }),
  reactToMessage: (messageId: string, emoji: string): Promise<ReactionResponse> =>
    apiRequest<ReactionResponse>(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  acceptMessageRequest: (conversationId: string): Promise<AcceptMessageResponse> =>
    apiRequest<AcceptMessageResponse>(`/api/chat/requests/${conversationId}/accept`, { method: 'POST' }),
  markMessagesRead: (conversationId: string): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/api/chat/conversations/${conversationId}/read`, { method: 'POST' }),

  getNotificationsByUserId: (): Promise<Notification[]> =>
    apiRequest<Notification[]>(`/api/users/me/notifications`),
  updateNotificationSettings: (settings: NotificationSettings): Promise<User> =>
    apiRequest<User>(`/api/users/me/settings/notifications`, { method: 'PUT', body: JSON.stringify(settings) }),

  getForumMessages: (ideaId: string): Promise<ForumMessage[]> => apiRequest<ForumMessage[]>(`/api/ideas/${ideaId}/forum/messages`),
  postForumMessage: (ideaId: string, text: string): Promise<ForumMessage> =>
    apiRequest<ForumMessage>(`/api/ideas/${ideaId}/forum/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  addForumMember: (ideaId: string, userIdToAdd: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/api/ideas/${ideaId}/forum/members`, { method: 'POST', body: JSON.stringify({ userId: userIdToAdd }) }),
  removeForumMember: (ideaId: string, userIdToRemove: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/api/ideas/${ideaId}/forum/members/${userIdToRemove}`, { method: 'DELETE' }),
  deleteForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/api/forum/messages/${messageId}`, { method: 'DELETE' }),
  pinForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/api/forum/messages/${messageId}/pin`, { method: 'POST' }),

  getUserAchievements: (userId: string): Promise<UserAchievement[]> => apiRequest<UserAchievement[]>(`/api/users/${userId}/achievements`),
  shareAchievementToFeed: (achievementId: AchievementId): Promise<void> =>
    apiRequest<void>(`/api/feed/achievement`, { method: 'POST', body: JSON.stringify({ achievementId }) }),

  getAnalyticsForIdea: (ideaId: string): Promise<any> => apiRequest<any>(`/api/ideas/${ideaId}/analytics`),

  endorseSkill: (targetUserId: string, skillName: string): Promise<User> =>
    apiRequest<User>(`/api/users/${targetUserId}/skills/endorse`, { method: 'POST', body: JSON.stringify({ skillName }) }),

  submitReport: (reportData: Omit<Report, 'reportId' | 'reporterId' | 'createdAt' | 'status'>): Promise<Report> =>
    apiRequest<Report>(`/api/reports`, { method: 'POST', body: JSON.stringify(reportData) }),

  addMilestone: (ideaId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/api/ideas/${ideaId}/milestones`, { method: 'POST', body: JSON.stringify(milestoneData) }),
  editMilestone: (ideaId: string, milestoneId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/api/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(milestoneData) }),
  deleteMilestone: (ideaId: string, milestoneId: string): Promise<void> =>
    apiRequest<void>(`/api/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'DELETE' }),
  completeMilestone: (ideaId: string, milestoneId: string): Promise<any> =>
    apiRequest<any>(`/api/ideas/${ideaId}/milestones/${milestoneId}/complete`, { method: 'POST' }),
  updateKanbanBoard: (ideaId: string, boardData: KanbanBoard): Promise<KanbanResponse> =>
    apiRequest<KanbanResponse>(`/api/ideas/${ideaId}/kanban`, { method: 'PUT', body: JSON.stringify(boardData) }),

  getRecommendedCollaborators: (ideaId: string): Promise<RecommendedCollaborator[]> =>
    apiRequest<RecommendedCollaborator[]>(`/api/ideas/${ideaId}/recommendations/collaborators`),

  analyzeIdea: (ideaData: { title: string; description: string; category?: string; ideaId?: string }): Promise<AiAnalysisResponse> =>
    apiRequest<AiAnalysisResponse>('/api/ai/analyze-idea', { method: 'POST', body: JSON.stringify(ideaData) }),
  refineSummary: (data: { summary: string }): Promise<RefineSummaryResponse> =>
    apiRequest<RefineSummaryResponse>(`/api/ai/refine-summary`, { method: 'POST', body: JSON.stringify(data) }),
  getIdeaSuggestions: (): Promise<AiSuggestionsResponse> =>
    apiRequest<AiSuggestionsResponse>('/api/ai/idea-suggestions'),

  // ============================================
  // NOTIFICATIONS
  // ============================================
  getNotificationPreferences: (): Promise<any[]> =>
    apiRequest<any[]>('/api/notifications/preferences'),
  updateNotificationPreference: (channel: string, category: string, enabled: boolean, frequency: string): Promise<any> =>
    apiRequest<any>('/api/notifications/preferences', { method: 'POST', body: JSON.stringify({ channel, category, enabled, frequency }) }),
  getUnreadNotifications: (): Promise<any[]> =>
    apiRequest<any[]>('/api/notifications/unread'),
  getNotificationsByCategory: (category: string): Promise<any[]> =>
    apiRequest<any[]>(`/api/notifications/category/${category}`),
  markNotificationAsRead: (notificationId: number): Promise<any> =>
    apiRequest<any>(`/api/notifications/${notificationId}/read`, { method: 'POST' }),
  markAllNotificationsAsRead: (): Promise<any> =>
    apiRequest<any>('/api/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (notificationId: number): Promise<void> =>
    apiRequest<void>(`/api/notifications/${notificationId}`, { method: 'DELETE' }),

  // ============================================
  // ADVANCED SEARCH
  // ============================================
  searchIdeas: (query: string, filters?: any): Promise<any[]> =>
    apiRequest<any[]>('/api/search/ideas', { method: 'POST', body: JSON.stringify({ q: query, ...filters }) }),
  searchUsersByQuery: (query: string): Promise<any[]> =>
    apiRequest<any[]>(`/api/search/users?q=${encodeURIComponent(query)}`),
  getSearchHistory: (): Promise<any[]> =>
    apiRequest<any[]>('/api/search/history'),
  clearSearchHistory: (): Promise<void> =>
    apiRequest<void>('/api/search/history', { method: 'DELETE' }),
  getSearchSuggestions: (query: string): Promise<string[]> =>
    apiRequest<string[]>(`/api/search/suggestions?q=${encodeURIComponent(query)}`),
  createSavedSearch: (name: string, query: string, filters: any): Promise<any> =>
    apiRequest<any>('/api/search/saved', { method: 'POST', body: JSON.stringify({ name, query, filters }) }),
  getSavedSearches: (): Promise<any[]> =>
    apiRequest<any[]>('/api/search/saved'),
  runSavedSearch: (searchId: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/search/saved/${searchId}/run`),
  deleteSavedSearch: (searchId: number): Promise<void> =>
    apiRequest<void>(`/api/search/saved/${searchId}`, { method: 'DELETE' }),

  // ============================================
  // TRENDING & RECOMMENDATIONS
  // ============================================
  getTrendingIdeas: (period?: string, limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/trending/ideas?period=${period || 'today'}&limit=${limit || 10}`),
  getHotRightNow: (limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/trending/hot-now?limit=${limit || 10}`),
  getPopularThisWeek: (limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/trending/popular-week?limit=${limit || 10}`),
  getRecommendedIdeas: (limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/recommendations/ideas?limit=${limit || 10}`),
  getRecommendedUsers: (limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/recommendations/users?limit=${limit || 5}`),
  getCuratorPicks: (limit?: number): Promise<any[]> =>
    apiRequest<any[]>(`/api/curator-picks?limit=${limit || 10}`),
  addCuratorPick: (ideaId: string, reason: string): Promise<any> =>
    apiRequest<any>('/api/curator-picks', { method: 'POST', body: JSON.stringify({ ideaId, reason }) }),
  removeCuratorPick: (ideaId: string): Promise<void> =>
    apiRequest<void>(`/api/curator-picks/${ideaId}`, { method: 'DELETE' }),

  // checkBackendHealth,
};

export default api;