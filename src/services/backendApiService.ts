// frontend/src/services/backendApiService.ts
import {
  User, Idea, FeedItem, Comment, CollaborationRequest, Notification,
  ProgressStage, Feedback, Milestone, KanbanBoard, Report,
  NotificationSettings, AchievementId, IdeaNode, IdeaBoardVersion, NodeComment,
  BlockchainRecord, Conversation, Message, UserAchievement, RecommendedCollaborator,
  ForumMessage
} from '../types';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://synapse-backend-api.onrender.com/api';

// Internal variable to hold the token, initialized from localStorage
let authToken: string | null = localStorage.getItem('authToken');

// --- Helper Types ---
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

// --- Enhanced generic API request helper ---
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authToken;
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 0) {
      throw new Error('Network error: Cannot connect to server. Check if backend is running.');
    }

    const contentType = response.headers.get('content-type');

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`✅ API Success (${response.status} No Content): ${url}`);
      return {} as T;
    }

    if (!response.ok) {
        let errorMessage = `API error (${response.status}): ${response.statusText || 'Request Failed'}`;
        let errorDetails: any = { status: response.status };

        if (contentType && contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorDetails = { ...errorDetails, ...errorData };
            } catch { /* Ignore JSON parse error */ }
        } else {
            try {
                const textError = await response.text();
                if (textError) { errorMessage += ` - ${textError.substring(0, 100)}`; }
            } catch { /* Ignore text parse error */ }
        }

        console.error(`❌ API Failed (${response.status}): ${url}`, errorMessage, errorDetails || '');

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

    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`⚠️ API Warning: Non-JSON response from ${url}. Content-Type: ${contentType}`);
    }

    const data = await response.json();
    console.log(`✅ API Success (${response.status}): ${url}`);
    return data;

  } catch (error: any) {
    console.error(`❌ API Network/Fetch Exception: ${options.method || 'GET'} ${endpoint}`, error);
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Network'))) {
      throw new Error('Network error: Could not connect to the API server. Please check your internet connection and ensure the backend is running.');
    }
    throw error;
  }
}

// --- Health check with better error handling ---
export const checkBackendHealth = async (): Promise<{ status: boolean; message: string }> => {
  try {
    const backendBaseUrl = API_BASE_URL.replace('/api', '');
    const healthUrl = `${backendBaseUrl}/health`;
    const response = await fetch(healthUrl, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      return { status: true, message: 'Backend is healthy' };
    } else {
      return { status: false, message: `Backend responded with status: ${response.status}` };
    }
  } catch (error: any) {
    return { 
      status: false, 
      message: `Backend connection failed: ${error.message || 'Unknown error'}` 
    };
  }
};

// --- API Service Definition ---
const api = {
  setAuthToken: (newToken: string | null) => {
    authToken = newToken;
    if (newToken) {
        localStorage.setItem('authToken', newToken);
    } else {
        localStorage.removeItem('authToken');
    }
    console.log("Auth token updated in service:", newToken ? 'Set' : 'Cleared');
  },

  // --- Auth ---
  login: async (credentials: { email: string, password: string }): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (response.token) {
        api.setAuthToken(response.token);
    }
    return response;
  },
  
  signUp: async (userData: any): Promise<RegisterResponse> => {
    const response = await apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
    if (response.token) {
        api.setAuthToken(response.token);
    }
    return response;
  },
  
  verifyToken: (tokenToCheck?: string): Promise<VerifyTokenResponse> => {
    const headers: HeadersInit = {};
    if (tokenToCheck) {
        headers['Authorization'] = `Bearer ${tokenToCheck}`;
    } else if (!authToken) {
        return Promise.resolve({ valid: false });
    }
    // This now correctly calls GET /auth/verify
    return apiRequest<VerifyTokenResponse>('/auth/verify', { method: 'GET', headers });
  },

  // --- Users ---
  // --- (FIXED) Added a safety check to prevent calls with undefined ---
  getUserById: (userId: string): Promise<User | null> => {
    if (!userId || userId === 'undefined') {
      console.warn(`getUserById called with invalid ID: ${userId}, skipping fetch.`);
      return Promise.resolve(null); // Return null immediately
    }
    return apiRequest<User>(`/users/${userId}`);
  },
  
  updateUser: (userData: Partial<User>): Promise<User> =>
    apiRequest<User>(`/users/me`, { method: 'PUT', body: JSON.stringify(userData) }),
  markOnboardingComplete: (): Promise<User> =>
    apiRequest<User>(`/users/me/onboarding`, { method: 'PATCH' }),
  searchUsers: (params: { search?: string; userType?: string; skills?: string[] }): Promise<User[]> =>
    apiRequest<User[]>(`/users?${new URLSearchParams(params as any).toString()}`),
  sendConnectionRequest: (targetUserId: string): Promise<void> =>
    apiRequest(`/users/${targetUserId}/connect`, { method: 'POST' }),

  // --- Ideas ---
  getAllIdeas: (params?: { category?: string; stage?: string; search?: string }): Promise<Idea[]> =>
    apiRequest<Idea[]>(`/ideas?${new URLSearchParams(params as any).toString()}`),
  getIdeasByOwnerId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/ideas?ownerId=${userId}`),
  getIdeasByCollaboratorId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/ideas?collaboratorId=${userId}`),
  getIdeaById: (ideaId: string): Promise<Idea> => apiRequest<Idea>(`/ideas/${ideaId}`),
  addIdea: (ideaData: any): Promise<CreateIdeaResponse> =>
    apiRequest<CreateIdeaResponse>('/ideas', { method: 'POST', body: JSON.stringify(ideaData) }),
  updateIdea: (ideaId: string, ideaData: Partial<Idea>): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}`, { method: 'PUT', body: JSON.stringify(ideaData) }),
  updateIdeaProgressStage: (ideaId: string, stage: ProgressStage): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  castVote: (ideaId: string, type: 'up' | 'down'): Promise<VoteResponse> =>
    apiRequest<VoteResponse>(`/ideas/${ideaId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  // --- Feed ---
  getFeedItems: (): Promise<FeedItem[]> => apiRequest<FeedItem[]>('/feed'),

  // --- Comments & Feedback ---
  getCommentsByIdeaId: (ideaId: string): Promise<Comment[]> => apiRequest<Comment[]>(`/ideas/${ideaId}/comments`),
  getCommentsByNodeId: (nodeId: string): Promise<NodeComment[]> => apiRequest<NodeComment[]>(`/nodes/${nodeId}/comments`),
  postComment: (ideaId: string, text: string): Promise<Comment> =>
    apiRequest<Comment>(`/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  getFeedbackByIdeaId: (ideaId: string): Promise<Feedback[]> => apiRequest<Feedback[]>(`/ideas/${ideaId}/feedback`),
  submitFeedback: (feedbackData: any): Promise<SubmitFeedbackResponse> =>
    apiRequest<SubmitFeedbackResponse>(`/ideas/${feedbackData.ideaId}/feedback`, { method: 'POST', body: JSON.stringify(feedbackData) }),

  // --- Collaboration ---
  getCollaborationRequestsByIdeaId: (ideaId: string): Promise<CollaborationRequest[]> =>
    apiRequest<CollaborationRequest[]>(`/ideas/${ideaId}/collaboration-requests`),
  submitCollaborationRequest: (requestData: any): Promise<CollaborationRequest> =>
    apiRequest<CollaborationRequest>(`/collaborations`, { method: 'POST', body: JSON.stringify(requestData) }),
  updateCollaborationRequestStatus: (collabId: string, status: 'approved' | 'rejected'): Promise<UpdateStatusResponse> =>
    apiRequest<UpdateStatusResponse>(`/collaborations/${collabId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCollaborationsByUserId: (userId: string): Promise<any[]> => apiRequest<any[]>(`/collaborations/user/${userId}`),

  // --- Idea Board ---
  updateIdeaBoard: (ideaId: string, nodes: IdeaNode[]): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}/board`, { method: 'PUT', body: JSON.stringify({ nodes }) }),
  saveBoardVersion: (ideaId: string, nodes: IdeaNode[], name: string): Promise<IdeaBoardVersion> =>
    apiRequest<IdeaBoardVersion>(`/ideas/${ideaId}/board/versions`, { method: 'POST', body: JSON.stringify({ nodes, name }) }),
  getBoardVersions: (ideaId: string): Promise<IdeaBoardVersion[]> =>
    apiRequest<IdeaBoardVersion[]>(`/ideas/${ideaId}/board/versions`),
  revertToBoardVersion: (ideaId: string, versionId: string): Promise<BoardVersionResponse> =>
    apiRequest<BoardVersionResponse>(`/ideas/${ideaId}/board/versions/${versionId}/revert`, { method: 'POST' }),

  getBlockchainRecordsByIdeaId: (ideaId: string): Promise<BlockchainRecord[]> =>
    apiRequest<BlockchainRecord[]>(`/ideas/${ideaId}/blockchain-records`),

  // --- Connections & Messaging ---
  startConversation: (otherUserId: string): Promise<StartConversationResponse> =>
    apiRequest<StartConversationResponse>(`/chat/conversations`, {
      method: 'POST',
      body: JSON.stringify({ participants: [otherUserId] })
    }),
  getConversationsByUserId: (): Promise<Conversation[]> =>
    apiRequest<Conversation[]>(`/chat/conversations`),
  getConversationById: (conversationId: string): Promise<Conversation> =>
    apiRequest<Conversation>(`/chat/conversations/${conversationId}`),
  getMessagesByConversationId: (conversationId: string): Promise<Message[]> =>
    apiRequest<Message[]>(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (payload: { conversationId: string; text: string; replyToMessageId?: string; media?: any }): Promise<SendMessageResponse> =>
    apiRequest<SendMessageResponse>(`/chat/conversations/${payload.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: payload.text, replyToMessageId: payload.replyToMessageId, media: payload.media }),
    }),
  reactToMessage: (messageId: string, emoji: string): Promise<ReactionResponse> =>
    apiRequest<ReactionResponse>(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),
  acceptMessageRequest: (conversationId: string): Promise<AcceptMessageResponse> =>
    apiRequest<AcceptMessageResponse>(`/chat/requests/${conversationId}/accept`, { method: 'POST' }),
  markMessagesRead: (conversationId: string): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/chat/conversations/${conversationId}/read`, { method: 'POST' }),

  // --- Notifications ---
  getNotificationsByUserId: (): Promise<Notification[]> =>
    apiRequest<Notification[]>(`/users/me/notifications`),
  markAllNotificationsAsRead: (): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/users/me/notifications/read-all`, { method: 'POST' }),
  updateNotificationSettings: (settings: NotificationSettings): Promise<User> =>
    apiRequest<User>(`/users/me/settings/notifications`, { method: 'PUT', body: JSON.stringify(settings) }),

  // --- Forum ---
  getForumMessages: (ideaId: string): Promise<ForumMessage[]> => apiRequest<ForumMessage[]>(`/ideas/${ideaId}/forum/messages`),
  postForumMessage: (ideaId: string, text: string): Promise<ForumMessage> =>
    apiRequest<ForumMessage>(`/ideas/${ideaId}/forum/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  addForumMember: (ideaId: string, userIdToAdd: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/ideas/${ideaId}/forum/members`, { method: 'POST', body: JSON.stringify({ userId: userIdToAdd }) }),
  removeForumMember: (ideaId: string, userIdToRemove: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/ideas/${ideaId}/forum/members/${userIdToRemove}`, { method: 'DELETE' }),
  deleteForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/forum/messages/${messageId}`, { method: 'DELETE' }),
  pinForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/forum/messages/${messageId}/pin`, { method: 'POST' }),

  // --- Achievements & Gamification ---
  getUserAchievements: (userId: string): Promise<UserAchievement[]> => apiRequest<UserAchievement[]>(`/users/${userId}/achievements`),
  shareAchievementToFeed: (achievementId: AchievementId): Promise<void> =>
    apiRequest<void>(`/feed/achievement`, { method: 'POST', body: JSON.stringify({ achievementId }) }),

  // --- Analytics ---
  getAnalyticsForIdea: (ideaId: string): Promise<any> => apiRequest<any>(`/ideas/${ideaId}/analytics`),

  // --- Skills & Endorsements ---
  endorseSkill: (targetUserId: string, skillName: string): Promise<User> =>
    apiRequest<User>(`/users/${targetUserId}/skills/endorse`, { method: 'POST', body: JSON.stringify({ skillName }) }),

  // --- Reports ---
  submitReport: (reportData: Omit<Report, 'reportId' | 'reporterId' | 'createdAt' | 'status'>): Promise<Report> =>
    apiRequest<Report>(`/reports`, { method: 'POST', body: JSON.stringify(reportData) }),

  // --- Milestones & Kanban ---
  addMilestone: (ideaId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones`, { method: 'POST', body: JSON.stringify(milestoneData) }),
  editMilestone: (ideaId: string, milestoneId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(milestoneData) }),
  deleteMilestone: (ideaId: string, milestoneId: string): Promise<void> =>
    apiRequest<void>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'DELETE' }),
  completeMilestone: (ideaId: string, milestoneId: string): Promise<any> =>
    apiRequest<any>(`/ideas/${ideaId}/milestones/${milestoneId}/complete`, { method: 'POST' }),
  updateKanbanBoard: (ideaId: string, boardData: KanbanBoard): Promise<KanbanResponse> =>
    apiRequest<KanbanResponse>(`/ideas/${ideaId}/kanban`, { method: 'PUT', body: JSON.stringify(boardData) }),

  // --- AI Recommendations ---
  getRecommendedCollaborators: (ideaId: string): Promise<RecommendedCollaborator[]> =>
    apiRequest<RecommendedCollaborator[]>(`/ideas/${ideaId}/recommendations/collaborators`),

  // --- AI functions ---
  analyzeIdea: (ideaData: { title: string; description: string; category?: string; ideaId?: string }): Promise<AiAnalysisResponse> =>
    apiRequest<AiAnalysisResponse>('/ai/analyze-idea', { method: 'POST', body: JSON.stringify(ideaData) }),
  refineSummary: (data: { summary: string }): Promise<RefineSummaryResponse> =>
    apiRequest<RefineSummaryResponse>(`/ai/refine-summary`, { method: 'POST', body: JSON.stringify(data) }),
  getIdeaSuggestions: (): Promise<AiSuggestionsResponse> =>
    apiRequest<AiSuggestionsResponse>(`/ai/idea-suggestions`),
};

export default api;