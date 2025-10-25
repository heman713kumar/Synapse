// frontend/src/services/backendApiService.ts
import {
  User, Idea, FeedItem, Comment, CollaborationRequest, Notification,
  ProgressStage, Feedback, Milestone, KanbanBoard, Report,
  NotificationSettings, AchievementId, IdeaNode, IdeaBoardVersion, NodeComment,
  BlockchainRecord, Conversation, Message, UserAchievement, RecommendedCollaborator,
  ForumMessage // Make sure ForumMessage is imported if used elsewhere, although not directly here
} from '../types';

// Use environment variable for API URL - FIXED for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://synapse-backend-api.onrender.com/api';

// Internal variable to hold the token, initialized from localStorage
let authToken: string | null = localStorage.getItem('authToken');

// --- Helper Types (Keep as defined previously) ---
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
  // Use the internal authToken variable consistently
  const token = authToken;
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), // Don't set Content-Type for FormData
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // Add token if it exists
    ...options.headers,
  };

  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type');

    // Handle No Content response FIRST
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`✅ API Success (${response.status} No Content): ${url}`);
      return {} as T;
    }

    // Check for non-OK status AFTER 204 check
    if (!response.ok) {
        let errorMessage = `API error (${response.status}): ${response.statusText || 'Request Failed'}`;
        let errorDetails: any = { status: response.status };

        // Try to parse JSON error details
        if (contentType && contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorDetails = { ...errorDetails, ...errorData };
            } catch { /* Ignore JSON parse error */ }
        } else { // Try to read text error details
            try {
                const textError = await response.text();
                if (textError) { errorMessage += ` - ${textError.substring(0, 100)}`; }
            } catch { /* Ignore text parse error */ }
        }

        console.error(`❌ API Failed (${response.status}): ${url}`, errorMessage, errorDetails || '');

        // Handle Auth errors: Clear token & reload/redirect
        if (response.status === 401 || response.status === 403) {
            console.warn("Authentication error detected. Clearing token and local user.");
            authToken = null; // Clear internal token
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.reload(); // Force reload to trigger login check in App.tsx
        }
        const error = new Error(errorMessage);
        (error as any).details = errorDetails;
        throw error;
    }

    // Handle successful JSON response
    if (!contentType || !contentType.includes('application/json')) {
      // Log warning but attempt to parse anyway, might fail if truly not JSON
      console.warn(`⚠️ API Warning: Non-JSON response received from ${url}. Content-Type: ${contentType}`);
    }

    // Assume JSON response if OK and not 204
    const data = await response.json();
    console.log(`✅ API Success (${response.status}): ${url}`);
    return data;

  } catch (error: any) {
    console.error(`❌ API Network/Fetch Exception: ${options.method || 'GET'} ${endpoint}`, error);
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      throw new Error('Network error: Could not connect to the API server. Is it running?');
    }
    throw error; // Re-throw other errors
  }
}

// --- Health check ---
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const backendBaseUrl = (API_BASE_URL).replace('/api', ''); // Derive from API_BASE_URL
    const healthUrl = `${backendBaseUrl}/health`;
    const response = await fetch(healthUrl, { method: 'GET' });
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error);
    return false;
  }
};


// --- API Service Definition ---
const api = {
  // --- FIX: Added setAuthToken function ---
  setAuthToken: (newToken: string | null) => {
    authToken = newToken; // Update internal variable
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
        api.setAuthToken(response.token); // Store token internally AND in localStorage
    }
    return response;
   },
  signUp: async (userData: any): Promise<RegisterResponse> => {
    const response = await apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
     if (response.token) {
        api.setAuthToken(response.token); // Store token
    }
    return response;
  },
  // --- FIX: Made tokenToCheck optional ---
  verifyToken: (tokenToCheck?: string): Promise<VerifyTokenResponse> => {
     const headers: HeadersInit = {};
     // Use explicit token only if provided (for initial load check)
     if (tokenToCheck) {
         headers['Authorization'] = `Bearer ${tokenToCheck}`;
     } else if (!authToken) {
         // If no explicit token and no internal token, verification fails immediately
         return Promise.resolve({ valid: false });
     }
     // If internal authToken exists but tokenToCheck wasn't given, apiRequest will add it.
     return apiRequest<VerifyTokenResponse>('/auth/verify', { method: 'GET', headers });
   },

  // --- Users ---
  getUserById: (userId: string): Promise<User> => apiRequest<User>(`/users/${userId}`),
  // --- FIX: Removed userId, uses /users/me ---
  updateUser: (userData: Partial<User>): Promise<User> =>
    apiRequest<User>(`/users/me`, { method: 'PUT', body: JSON.stringify(userData) }),
  // --- FIX: Removed userId, uses /users/me ---
  markOnboardingComplete: (): Promise<User> =>
    apiRequest<User>(`/users/me/onboarding`, { method: 'PATCH' }),
  searchUsers: (params: { search?: string; userType?: string; skills?: string[] }): Promise<User[]> =>
    apiRequest<User[]>(`/users?${new URLSearchParams(params as any).toString()}`),
  // --- FIX: Added sendConnectionRequest ---
  sendConnectionRequest: (targetUserId: string): Promise<void> =>
    apiRequest(`/users/${targetUserId}/connect`, { method: 'POST' }),

  // --- Ideas ---
  getAllIdeas: (params?: { category?: string; stage?: string; search?: string }): Promise<Idea[]> =>
    apiRequest<Idea[]>(`/ideas?${new URLSearchParams(params as any).toString()}`),
  getIdeasByOwnerId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/ideas?ownerId=${userId}`),
  getIdeasByCollaboratorId: (userId: string): Promise<Idea[]> => apiRequest<Idea[]>(`/ideas?collaboratorId=${userId}`),
  getIdeaById: (ideaId: string): Promise<Idea> => apiRequest<Idea>(`/ideas/${ideaId}`),
  addIdea: (ideaData: any): Promise<CreateIdeaResponse> =>
    apiRequest<CreateIdeaResponse>('/ideas', { method: 'POST', body: JSON.stringify(ideaData), }), // Backend gets ownerId
  updateIdea: (ideaId: string, ideaData: Partial<Idea>): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}`, { method: 'PUT', body: JSON.stringify(ideaData) }),
  updateIdeaProgressStage: (ideaId: string, stage: ProgressStage): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  // --- FIX: Removed userId from castVote ---
  castVote: (ideaId: string, type: 'up' | 'down'): Promise<VoteResponse> =>
    apiRequest<VoteResponse>(`/ideas/${ideaId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }) // Backend gets userId from token
    }),

  // --- Feed ---
  getFeedItems: (): Promise<FeedItem[]> => apiRequest<FeedItem[]>('/feed'),

  // --- Comments & Feedback ---
  getCommentsByIdeaId: (ideaId: string): Promise<Comment[]> => apiRequest<Comment[]>(`/ideas/${ideaId}/comments`),
  getCommentsByNodeId: (nodeId: string): Promise<NodeComment[]> => apiRequest<NodeComment[]>(`/nodes/${nodeId}/comments`),
  postComment: (ideaId: string, text: string): Promise<Comment> =>
    apiRequest<Comment>(`/ideas/${ideaId}/comments`, { method: 'POST', body: JSON.stringify({ text }), }), // Backend gets userId
  getFeedbackByIdeaId: (ideaId: string): Promise<Feedback[]> => apiRequest<Feedback[]>(`/ideas/${ideaId}/feedback`),
  submitFeedback: (feedbackData: any): Promise<SubmitFeedbackResponse> =>
    apiRequest<SubmitFeedbackResponse>(`/ideas/${feedbackData.ideaId}/feedback`, { method: 'POST', body: JSON.stringify(feedbackData), }), // Backend gets userId

  // --- Collaboration ---
  getCollaborationRequestsByIdeaId: (ideaId: string): Promise<CollaborationRequest[]> =>
    apiRequest<CollaborationRequest[]>(`/ideas/${ideaId}/collaboration-requests`),
  submitCollaborationRequest: (requestData: any): Promise<CollaborationRequest> =>
    apiRequest<CollaborationRequest>(`/collaborations`, { method: 'POST', body: JSON.stringify(requestData), }), // Backend gets requesterId
  // --- FIX: Ensure status matches component call ('rejected') ---
  updateCollaborationRequestStatus: (collabId: string, status: 'approved' | 'rejected'): Promise<UpdateStatusResponse> =>
    apiRequest<UpdateStatusResponse>(`/collaborations/${collabId}/status`, { method: 'PATCH', body: JSON.stringify({ status }), }),
  getCollaborationsByUserId: (userId: string): Promise<any[]> => apiRequest<any[]>(`/collaborations/user/${userId}`), // Adjust endpoint if needed

  // --- Idea Board ---
  updateIdeaBoard: (ideaId: string, nodes: IdeaNode[]): Promise<Idea> =>
    apiRequest<Idea>(`/ideas/${ideaId}/board`, { method: 'PUT', body: JSON.stringify({ nodes }) }),
  saveBoardVersion: (ideaId: string, nodes: IdeaNode[], name: string): Promise<IdeaBoardVersion> =>
    apiRequest<IdeaBoardVersion>(`/ideas/${ideaId}/board/versions`, { method: 'POST', body: JSON.stringify({ nodes, name }) }),
  getBoardVersions: (ideaId: string): Promise<IdeaBoardVersion[]> =>
    apiRequest<IdeaBoardVersion[]>(`/ideas/${ideaId}/board/versions`),
  revertToBoardVersion: (ideaId: string, versionId: string): Promise<BoardVersionResponse> =>
    apiRequest<BoardVersionResponse>(`/ideas/${ideaId}/board/versions/${versionId}/revert`, { method: 'POST' }),

  // --- FIX: Added getBlockchainRecordsByIdeaId ---
   getBlockchainRecordsByIdeaId: (ideaId: string): Promise<BlockchainRecord[]> =>
     apiRequest<BlockchainRecord[]>(`/ideas/${ideaId}/blockchain-records`), // Ensure this endpoint exists on backend

  // --- Connections & Messaging ---
  // --- FIX: Modified startConversation to take only otherUserId ---
  startConversation: (otherUserId: string): Promise<StartConversationResponse> =>
    apiRequest<StartConversationResponse>(`/chat/conversations`, {
      method: 'POST',
      body: JSON.stringify({ participants: [otherUserId] }) // Backend adds current user
    }),
  // --- FIX: Removed userId ---
  getConversationsByUserId: (): Promise<Conversation[]> =>
    apiRequest<Conversation[]>(`/chat/conversations`), // Backend gets userId
  getConversationById: (conversationId: string): Promise<Conversation> => // Added for Chat.tsx
    apiRequest<Conversation>(`/chat/conversations/${conversationId}`),
  getMessagesByConversationId: (conversationId: string): Promise<Message[]> =>
    apiRequest<Message[]>(`/chat/conversations/${conversationId}/messages`),
  // --- FIX: Removed senderId, adjusted payload type ---
  sendMessage: (payload: { conversationId: string; text: string; replyToMessageId?: string; media?: any }): Promise<SendMessageResponse> =>
    apiRequest<SendMessageResponse>(`/chat/conversations/${payload.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: payload.text, replyToMessageId: payload.replyToMessageId, media: payload.media }), // Backend gets senderId
    }),
  // --- FIX: Renamed and removed userId ---
  reactToMessage: (messageId: string, emoji: string): Promise<ReactionResponse> => // Use reactToMessage
    apiRequest<ReactionResponse>(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }) // Backend gets userId
    }),
  acceptMessageRequest: (conversationId: string): Promise<AcceptMessageResponse> =>
    apiRequest<AcceptMessageResponse>(`/chat/requests/${conversationId}/accept`, { method: 'POST' }),
  // --- FIX: Use conversationId ---
  markMessagesRead: (conversationId: string): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/chat/conversations/${conversationId}/read`, { method: 'POST' }),

  // --- Notifications ---
  // --- FIX: Removed userId ---
  getNotificationsByUserId: (): Promise<Notification[]> =>
    apiRequest<Notification[]>(`/users/me/notifications`),
  // --- FIX: Removed userId ---
  markAllNotificationsAsRead: (): Promise<MarkReadResponse> =>
    apiRequest<MarkReadResponse>(`/users/me/notifications/read-all`, { method: 'POST', }),
  // --- FIX: Removed userId ---
  updateNotificationSettings: (settings: NotificationSettings): Promise<User> =>
    apiRequest<User>(`/users/me/settings/notifications`, { method: 'PUT', body: JSON.stringify(settings) }),

  // --- Forum ---
  getForumMessages: (ideaId: string): Promise<ForumMessage[]> => apiRequest<ForumMessage[]>(`/ideas/${ideaId}/forum/messages`),
  postForumMessage: (ideaId: string, text: string): Promise<ForumMessage> =>
    apiRequest<ForumMessage>(`/ideas/${ideaId}/forum/messages`, { method: 'POST', body: JSON.stringify({ text }) }), // Backend gets senderId
  addForumMember: (ideaId: string, userIdToAdd: string): Promise<{ success: boolean }> => // Expect specific response
    apiRequest<{ success: boolean }>(`/ideas/${ideaId}/forum/members`, { method: 'POST', body: JSON.stringify({ userId: userIdToAdd }) }),
  removeForumMember: (ideaId: string, userIdToRemove: string): Promise<{ success: boolean }> => // Expect specific response
    apiRequest<{ success: boolean }>(`/ideas/${ideaId}/forum/members/${userIdToRemove}`, { method: 'DELETE' }),
  deleteForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/forum/messages/${messageId}`, { method: 'DELETE' }),
  pinForumMessage: (messageId: string): Promise<void> => apiRequest<void>(`/forum/messages/${messageId}/pin`, { method: 'POST' }),

  // --- Achievements & Gamification ---
  getUserAchievements: (userId: string): Promise<UserAchievement[]> => apiRequest<UserAchievement[]>(`/users/${userId}/achievements`),
  // --- FIX: Removed userId ---
  shareAchievementToFeed: (achievementId: AchievementId): Promise<void> =>
    apiRequest<void>(`/feed/achievement`, { method: 'POST', body: JSON.stringify({ achievementId }) }), // Backend gets userId

  // --- Analytics ---
  getAnalyticsForIdea: (ideaId: string): Promise<any> => apiRequest<any>(`/ideas/${ideaId}/analytics`), // Specify type if known

  // --- Skills & Endorsements ---
  // --- FIX: Removed endorserId ---
  endorseSkill: (targetUserId: string, skillName: string): Promise<User> =>
    apiRequest<User>(`/users/${targetUserId}/skills/endorse`, { method: 'POST', body: JSON.stringify({ skillName }) }), // Backend gets endorserId

  // --- Reports ---
  // --- FIX: Removed reporterId ---
  submitReport: (reportData: Omit<Report, 'reportId' | 'reporterId' | 'createdAt' | 'status'>): Promise<Report> =>
    apiRequest<Report>(`/reports`, { method: 'POST', body: JSON.stringify(reportData) }), // Backend gets reporterId

  // --- Milestones & Kanban ---
  addMilestone: (ideaId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones`, { method: 'POST', body: JSON.stringify(milestoneData) }),
  editMilestone: (ideaId: string, milestoneId: string, milestoneData: any): Promise<MilestoneResponse> =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(milestoneData) }),
  deleteMilestone: (ideaId: string, milestoneId: string): Promise<void> =>
    apiRequest<void>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'DELETE' }),
  completeMilestone: (ideaId: string, milestoneId: string): Promise<any> => // Specify type if known
    apiRequest<any>(`/ideas/${ideaId}/milestones/${milestoneId}/complete`, { method: 'POST' }),
  updateKanbanBoard: (ideaId: string, boardData: KanbanBoard): Promise<KanbanResponse> =>
    apiRequest<KanbanResponse>(`/ideas/${ideaId}/kanban`, { method: 'PUT', body: JSON.stringify(boardData) }),

  // --- AI Recommendations ---
  getRecommendedCollaborators: (ideaId: string): Promise<RecommendedCollaborator[]> => // Use correct type
    apiRequest<RecommendedCollaborator[]>(`/ideas/${ideaId}/recommendations/collaborators`),

  // --- AI functions (Look OK, assuming backend endpoints match) ---
  analyzeIdea: (ideaData: { title: string; description: string; category?: string; ideaId?: string }): Promise<AiAnalysisResponse> =>
    apiRequest<AiAnalysisResponse>('/ai/analyze-idea', { method: 'POST', body: JSON.stringify(ideaData), }),
  refineSummary: (data: { summary: string }): Promise<RefineSummaryResponse> =>
    apiRequest<RefineSummaryResponse>(`/ai/refine-summary`, { method: 'POST', body: JSON.stringify(data) }),
  getIdeaSuggestions: (): Promise<AiSuggestionsResponse> =>
    apiRequest<AiSuggestionsResponse>(`/ai/idea-suggestions`),
};

export default api;