// frontend/src/services/backendApiService.ts
import {
  User, Idea, FeedItem, Comment, CollaborationRequest, Notification,
  ProgressStage, Feedback, Milestone, KanbanBoard, Report,
  NotificationSettings, AchievementId, IdeaNode, IdeaBoardVersion, NodeComment,
  BlockchainRecord, Conversation, Message, UserAchievement, RecommendedCollaborator,
  ForumMessage
} from '../types';

// --- FIX 1: Set API_BASE_URL to the server root (no /api suffix) ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://synapse-backend-api.onrender.com';
console.log('🔍 API_BASE_URL:', API_BASE_URL); // Debug line to verify the URL

// Internal variable to hold the token, initialized from localStorage
let authToken: string | null = localStorage.getItem('authToken');

// --- Helper Types (omitted for brevity, assume they are correct) ---
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
// --- End Helper Types ---

// --- Enhanced generic API request helper ---
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Remove trailing slash from base if present, and ensure endpoint has a leading slash
  const base = API_BASE_URL.replace(/\/$/, ''); 
  const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${finalEndpoint}`;
  
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
    
    // For endpoints expecting JSON
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Success (${response.status}): ${url}`);
      return data;
    }

    // Handle non-JSON responses if necessary (e.g., text)
    console.warn(`⚠️ API Warning: Non-JSON response from ${url}. Content-Type: ${contentType}`);
    return {} as T; // Default empty object for non-JSON success


  } catch (error: any) {
    console.error(`❌ API Network/Fetch Exception: ${options.method || 'GET'} ${finalEndpoint}`, error);
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Network'))) {
      throw new Error('Network error: Could not connect to the API server. Please check your internet connection and ensure the backend is running.');
    }
    throw error;
  }
}

// --- Health check function (FIX: Probe the correct /health endpoint) ---
const checkBackendHealth = async (): Promise<boolean> => {
  // Use the root URL (API_BASE_URL stripped of any VITE_API_URL prefix) 
  const backendRootUrl = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, ''); 
  
  // FIX: Target the correct /health endpoint as defined in the backend code
  const healthUrl = `${backendRootUrl}/health`;

  try {
    console.log(`🩺 Health Check: GET ${healthUrl}`);
    // Use standard fetch directly
    const response = await fetch(healthUrl, { method: 'GET' });
    
    // The health check is successful if the status is 200-299
    const isHealthy = response.ok; 
    console.log(`🩺 Health Check Result (${response.status}): ${isHealthy ? 'Healthy' : 'Unhealthy'}`);

    return isHealthy;

  } catch (error) {
    console.error('Backend health check failed (Network or CORS error):', error);
    return false;
  }
};


// --- API Service Definition (FIX: Endpoints now include the required /api prefix) ---
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
    // FIX: ADDED '/api' prefix
    const response = await apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (response.token) {
        api.setAuthToken(response.token);
    }
    return response;
  },

  signUp: async (userData: any): Promise<RegisterResponse> => {
    // FIX: ADDED '/api' prefix
    const response = await apiRequest<RegisterResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) });
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
    // FIX: ADDED '/api' prefix
    return apiRequest<VerifyTokenResponse>('/api/auth/verify', { method: 'GET', headers });
  },

  // --- Users ---
  getUserById: (userId: string): Promise<User | null> => {
    if (!userId || userId === 'undefined') {
      console.warn(`getUserById called with invalid ID: ${userId}, skipping fetch.`);
      return Promise.resolve(null);
    }
    // FIX: ADDED '/api' prefix
    return apiRequest<User>(`/api/users/${userId}`);
  },

  updateUser: (userData: Partial<User>): Promise<User> =>
    // FIX: ADDED '/api' prefix
    apiRequest<User>(`/api/users/me`, { method: 'PUT', body: JSON.stringify(userData) }),
  markOnboardingComplete: (): Promise<User> =>
    // FIX: ADDED '/api' prefix
    apiRequest<User>(`/api/users/me/onboarding`, { method: 'PATCH' }),
  searchUsers: (params: { search?: string; userType?: string; skills?: string[] }): Promise<User[]> =>
    // FIX: ADDED '/api' prefix
    apiRequest<User[]>(`/api/users?${new URLSearchParams(params as any).toString()}`),
  sendConnectionRequest: (targetUserId: string): Promise<void> =>
    // FIX: ADDED '/api' prefix
    apiRequest(`/api/users/${targetUserId}/connect`, { method: 'POST' }),

  // --- Ideas ---
  getAllIdeas: (params?: { category?: string; stage?: string; search?: string }): Promise<Idea[]> =>
    // FIX: ADDED '/api' prefix
    apiRequest<Idea[]>(`/api/ideas?${new URLSearchParams(params as any).toString()}`),
  getIdeasByOwnerId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/api/ideas?ownerId=${userId}`),
  getIdeasByCollaboratorId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/api/ideas?collaboratorId=${userId}`),
  getIdeaById: (ideaId: string): Promise<Idea> => apiRequest<Idea>(`/api/ideas/${ideaId}`),
  addIdea: (ideaData: any): Promise<CreateIdeaResponse> =>
    apiRequest<CreateIdeaResponse>('/api/ideas', { method: 'POST', body: JSON.stringify(ideaData) }),
  updateIdea: (ideaId: string, ideaData: Partial<Idea>): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}`, { method: 'PUT', body: JSON.stringify(ideaData) }),
  updateIdeaProgressStage: (ideaId: string, stage: ProgressStage): Promise<Idea> =>
    apiRequest<Idea>(`/api/ideas/${ideaId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  castVote: (ideaId: string, type: 'up' | 'down'): Promise<VoteResponse> =>
    apiRequest<VoteResponse>(`/api/ideas/${ideaId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  // --- Feed ---
  // FIX: Added missing '/api' prefix to feed endpoint
  getFeedItems: (): Promise<FeedItem[]> => apiRequest<FeedItem[]>('/api/feed'),

  // --- Comments & Feedback ---
  getCommentsByIdeaId: (ideaId: string): Promise<Comment[]> => apiRequest<Comment[]>(`/api/ideas/${ideaId}/comments`),
  getCommentsByNodeId: (nodeId: string): Promise<NodeComment[]> => apiRequest<NodeComment[]>(`/api/nodes/${nodeId}/comments`),
  postComment: (ideaId: string, text: string): Promise<Comment> =>
    apiRequest<Comment>(`/api/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  getFeedbackByIdeaId: (ideaId: string): Promise<Feedback[]> => apiRequest<Feedback[]>(`/api/ideas/${ideaId}/feedback`),
  submitFeedback: (feedbackData: any): Promise<SubmitFeedbackResponse> =>
    apiRequest<SubmitFeedbackResponse>(`/api/ideas/${feedbackData.ideaId}/feedback`, { method: 'POST', body: JSON.stringify(feedbackData) }),

  // --- Collaboration ---
  getCollaborationRequestsByIdeaId: (ideaId: string): Promise<CollaborationRequest[]> =>
    apiRequest<CollaborationRequest[]>(`/api/ideas/${ideaId}/collaboration-requests`),
  submitCollaborationRequest: (requestData: any): Promise<CollaborationRequest> =>
    apiRequest<CollaborationRequest>(`/api/collaborations`, { method: 'POST', body: JSON.stringify(requestData) }),
  updateCollaborationRequestStatus: (collabId: string, status: 'approved' | 'rejected'): Promise<UpdateStatusResponse> =>
    apiRequest<UpdateStatusResponse>(`/api/collaborations/${collabId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCollaborationsByUserId: (userId: string): Promise<any[]> => apiRequest<any[]>(`/api/collaborations/user/${userId}`),

  // --- Idea Board ---
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

  // --- Connections & Messaging ---
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

  // --- Notifications ---
  getNotificationsByUserId: (): Promise<Notification[]> =>
    apiRequest<Notification[]>(`/api/users/me/notifications`),
  markAllNotificationsAsRead: (): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/api/users/me/notifications/read-all`, { method: 'POST' }),
  updateNotificationSettings: (settings: NotificationSettings): Promise<User> =>
    apiRequest<User>(`/api/users/me/settings/notifications`, { method: 'PUT', body: JSON.stringify(settings) }),

  // --- Forum ---
  getForumMessages: (ideaId: string): Promise<ForumMessage[]> => apiRequest<ForumMessage[]>(`/api/ideas/${ideaId}/forum/messages`),
  postForumMessage: (ideaId: string, text: string): Promise<ForumMessage> =>
    apiRequest<ForumMessage>(`/api/ideas/${ideaId}/forum/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  addForumMember: (ideaId: string, userIdToAdd: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/api/ideas/${ideaId}/forum/members`, { method: 'POST', body: JSON.stringify({ userId: userIdToAdd }) }),
  removeForumMember: (ideaId: string, userIdToRemove: string): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/api/ideas/${ideaId}/forum/members/${userIdToRemove}`, { method: 'DELETE' }),
  deleteForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/api/forum/messages/${messageId}`, { method: 'DELETE' }),
  pinForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/api/forum/messages/${messageId}/pin`, { method: 'POST' }),

  // --- Achievements & Gamification ---
  getUserAchievements: (userId: string): Promise<UserAchievement[]> => apiRequest<UserAchievement[]>(`/api/users/${userId}/achievements`),
  shareAchievementToFeed: (achievementId: AchievementId): Promise<void> =>
    apiRequest<void>(`/api/feed/achievement`, { method: 'POST', body: JSON.stringify({ achievementId }) }),

  // --- Analytics ---
  getAnalyticsForIdea: (ideaId: string): Promise<any> => apiRequest<any>(`/api/ideas/${ideaId}/analytics`),

  // --- Skills & Endorsements ---
  endorseSkill: (targetUserId: string, skillName: string): Promise<User> =>
    apiRequest<User>(`/api/users/${targetUserId}/skills/endorse`, { method: 'POST', body: JSON.stringify({ skillName }) }),

  // --- Reports ---
  submitReport: (reportData: Omit<Report, 'reportId' | 'reporterId' | 'createdAt' | 'status'>): Promise<Report> =>
    apiRequest<Report>(`/api/reports`, { method: 'POST', body: JSON.stringify(reportData) }),

  // --- Milestones & Kanban ---
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

  // --- AI Recommendations ---
  getRecommendedCollaborators: (ideaId: string): Promise<RecommendedCollaborator[]> =>
    apiRequest<RecommendedCollaborator[]>(`/api/ideas/${ideaId}/recommendations/collaborators`),

  // --- AI functions ---
  analyzeIdea: (ideaData: { title: string; description: string; category?: string; ideaId?: string }): Promise<AiAnalysisResponse> =>
    apiRequest<AiAnalysisResponse>('/api/ai/analyze-idea', { method: 'POST', body: JSON.stringify(ideaData) }),
  refineSummary: (data: { summary: string }): Promise<RefineSummaryResponse> =>
    apiRequest<RefineSummaryResponse>(`/api/ai/refine-summary`, { method: 'POST', body: JSON.stringify(data) }),
  getIdeaSuggestions: (): Promise<AiSuggestionsResponse> =>
    apiRequest<AiSuggestionsResponse>('/api/ai/idea-suggestions'),

  // --- EXPORT checkBackendHealth ---
  checkBackendHealth,
};

export default api;