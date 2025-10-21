import {
  User,
  Idea,
  FeedItem,
  Comment,
  CollaborationRequest,
  Notification,
  ProgressStage,
  Feedback,
  Milestone,
  KanbanBoard,
  Report,
  NotificationSettings,
  AchievementId,
  IdeaNode,
  IdeaBoardVersion,
  NodeComment
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Helper Types ---
interface LoginResponse { user: any; token: string; message?: string; }
interface RegisterResponse { user: any; token: string; message?: string; error?: string; }
interface CreateIdeaResponse { idea: Idea; unlockedAchievements: AchievementId[]; }
interface UpdateStatusResponse { unlockedAchievements: AchievementId[]; }
interface SubmitFeedbackResponse { feedback: Feedback; unlockedAchievements: AchievementId[]; }
interface AiAnalysisResponse { analysis: any; timestamp: string; }
interface AiSuggestionsResponse { suggestions: string[]; basedOn: any; }
interface BoardVersionResponse extends IdeaBoardVersion { nodes: IdeaNode[] }
interface MarkReadResponse { message?: string }
interface VoteResponse extends Idea { }
interface MilestoneResponse extends Milestone { }
interface KanbanResponse extends KanbanBoard { }
interface RefineSummaryResponse { refinedSummary: string }

// --- Enhanced generic API request helper ---
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch { /* Ignore */ }
      } else {
        try {
          const textError = await response.text();
          if (textError) errorMessage += ` - ${textError}`;
        } catch { /* Ignore */ }
      }
      console.error(`❌ API Failed: ${url}`, errorMessage);
      if (response.status === 401 || response.status === 403) {
        console.error("Authentication error. Consider redirecting to login.");
      }
      throw new Error(errorMessage);
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`✅ API Success (${response.status} No Content): ${url}`);
      return {} as T;
    }
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`❌ API Failed: Non-JSON response from ${url}`);
      throw new Error('Server returned non-JSON response');
    }
    const data = await response.json();
    console.log(`✅ API Success (${response.status}): ${url}`);
    return data;
  } catch (error: any) {
    console.error(`❌ API Exception: ${endpoint}`, error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running and reachable.');
    }
    throw new Error(error.message || 'An unknown API error occurred');
  }
}

// --- Health check ---
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');
    const healthUrl = `${backendBaseUrl}/health`;
    const response = await fetch(healthUrl, { method: 'GET' });
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error);
    return false;
  }
};

// --- API Service Definition ---
export const api = {
  // --- Auth ---
  login: (credentials: { email: string, password: string }) =>
    apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials), }),

  signUp: (userData: any) =>
    apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(userData), }),

  verifyToken: (token: string) =>
    apiRequest<{ valid: boolean; user?: any }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }), }),

  // --- Users ---
  getUserById: (userId: string) =>
    apiRequest<User>(`/users/${userId}`),

  updateUser: (userId: string, userData: Partial<User>) =>
    apiRequest<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData), }),

  markOnboardingComplete: (userId: string) =>
    apiRequest<User>(`/users/${userId}/onboarding`, { method: 'PATCH', }),

  searchUsers: (params: { search?: string; userType?: string; skills?: string[] }) =>
    apiRequest<User[]>(`/users?${new URLSearchParams(params as any).toString()}`),

  // --- Ideas ---
  getAllIdeas: (params?: { category?: string; stage?: string; search?: string }) =>
    apiRequest<Idea[]>(`/ideas?${new URLSearchParams(params as any).toString()}`),

  getIdeasByOwnerId: (userId: string) =>
    apiRequest<Idea[]>(`/ideas?ownerId=${userId}`),

  getIdeasByCollaboratorId: (userId: string) =>
    apiRequest<Idea[]>(`/ideas?collaboratorId=${userId}`),

  getIdeaById: (ideaId: string) =>
    apiRequest<Idea>(`/ideas/${ideaId}`),

  addIdea: (ideaData: any) =>
    apiRequest<CreateIdeaResponse>('/ideas', { method: 'POST', body: JSON.stringify(ideaData), }),

  updateIdea: (ideaId: string, ideaData: Partial<Idea>) =>
    apiRequest<Idea>(`/ideas/${ideaId}`, { method: 'PUT', body: JSON.stringify(ideaData) }),

  updateIdeaProgressStage: (ideaId: string, stage: ProgressStage) =>
    apiRequest<Idea>(`/ideas/${ideaId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),

  castVote: (ideaId: string, userId: string, type: 'up' | 'down') =>
    apiRequest<VoteResponse>(`/ideas/${ideaId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ userId, type }) // Keep userId for now, backend might use it or token
    }),

  // --- Feed ---
  getFeedItems: () => apiRequest<FeedItem[]>('/feed'),

  // --- Comments & Feedback ---
  getCommentsByIdeaId: (ideaId: string) =>
    apiRequest<Comment[]>(`/ideas/${ideaId}/comments`),

  getCommentsByNodeId: (nodeId: string) =>
    apiRequest<NodeComment[]>(`/nodes/${nodeId}/comments`), // FIX: Removed unused userId parameter

  postComment: (ideaId: string, /* userId: string, */ text: string) =>
    apiRequest<Comment>(`/ideas/${ideaId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }), // Backend gets userId from token
    }),

  getFeedbackByIdeaId: (ideaId: string) =>
    apiRequest<Feedback[]>(`/ideas/${ideaId}/feedback`),

  submitFeedback: (feedbackData: any) =>
    apiRequest<SubmitFeedbackResponse>(`/ideas/${feedbackData.ideaId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData), // Backend gets userId from token
    }),

  // --- Collaboration ---
  getCollaborationRequestsByIdeaId: (ideaId: string) =>
    apiRequest<CollaborationRequest[]>(`/ideas/${ideaId}/collaboration-requests`),

  submitCollaborationRequest: (requestData: any) =>
    apiRequest<CollaborationRequest>(`/collaborations`, {
      method: 'POST',
      body: JSON.stringify(requestData), // Backend gets requesterId from token
    }),

  updateCollaborationRequestStatus: (collabId: string, status: 'approved' | 'rejected' | 'pending') =>
    apiRequest<UpdateStatusResponse>(`/collaborations/${collabId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getCollaborationsByUserId: (userId: string) =>
    apiRequest<any[]>(`/collaborations/user/${userId}`),

  // --- Idea Board ---
  updateIdeaBoard: (ideaId: string, nodes: IdeaNode[]) =>
    apiRequest<Idea>(`/ideas/${ideaId}/board`, { method: 'PUT', body: JSON.stringify({ nodes }) }),

  saveBoardVersion: (ideaId: string, nodes: IdeaNode[], name: string) =>
    apiRequest<IdeaBoardVersion>(`/ideas/${ideaId}/board/versions`, {
      method: 'POST',
      body: JSON.stringify({ nodes, name })
    }),

  getBoardVersions: (ideaId: string) =>
    apiRequest<IdeaBoardVersion[]>(`/ideas/${ideaId}/board/versions`),

  revertToBoardVersion: (ideaId: string, versionId: string) =>
    apiRequest<BoardVersionResponse>(`/ideas/${ideaId}/board/versions/${versionId}/revert`, { method: 'POST' }),

  // --- Connections & Messaging ---
  startConversation: (userId1: string, userId2: string) =>
    apiRequest<any>(`/chat/conversations/start`, {
      method: 'POST',
      body: JSON.stringify({ participants: [userId1, userId2] })
    }),

  getConversationsByUserId: () =>
    apiRequest<any[]>(`/chat/conversations`),

  getMessagesByConversationId: (conversationId: string) =>
    apiRequest<any[]>(`/chat/${conversationId}`), // Needs backend adjustment?

  sendMessage: (conversationId: string, text: string, options?: any) =>
    // SenderId from token
    apiRequest<any>(`/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, ...options }),
    }),

  addReactionToMessage: (messageId: string, emoji: string) =>
    // UserId from token
    apiRequest<any>(`/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    }),

  acceptMessageRequest: (conversationId: string) =>
    apiRequest<any>(`/chat/requests/${conversationId}/accept`, { method: 'POST' }),

  markMessagesRead: (otherUserId: string) =>
    apiRequest<MarkReadResponse>(`/chat/${otherUserId}/read`, { method: 'POST' }),

  // --- Notifications ---
  getNotificationsByUserId: (userId: string) => apiRequest<Notification[]>(`/users/${userId}/notifications`),

  markAllNotificationsAsRead: (userId: string) =>
    apiRequest<MarkReadResponse>(`/users/${userId}/notifications/read`, { method: 'PUT', }),

  updateNotificationSettings: (userId: string, settings: NotificationSettings) =>
    apiRequest<User>(`/users/${userId}/settings/notifications`, { method: 'PUT', body: JSON.stringify(settings) }),

  // --- Forum ---
  getForumMessages: (ideaId: string) =>
    apiRequest<any[]>(`/ideas/${ideaId}/forum/messages`),

  postForumMessage: (ideaId: string, text: string) =>
    // SenderId from token
    apiRequest<any>(`/ideas/${ideaId}/forum/messages`, { method: 'POST', body: JSON.stringify({ text }) }),

  addForumMember: (ideaId: string, userIdToAdd: string) =>
    apiRequest<boolean>(`/ideas/${ideaId}/forum/members`, { method: 'POST', body: JSON.stringify({ userId: userIdToAdd }) }),

  removeForumMember: (ideaId: string, userIdToRemove: string) =>
    apiRequest<boolean>(`/ideas/${ideaId}/forum/members/${userIdToRemove}`, { method: 'DELETE' }),

  deleteForumMessage: (messageId: string) =>
    apiRequest<void>(`/forum/messages/${messageId}`, { method: 'DELETE' }),

  pinForumMessage: (messageId: string) =>
    apiRequest<void>(`/forum/messages/${messageId}/pin`, { method: 'POST' }),

  // --- Achievements & Gamification ---
  getUserAchievements: (userId: string) =>
    apiRequest<any[]>(`/users/${userId}/achievements`),

  shareAchievementToFeed: (/* userId: string, */ achievementId: AchievementId) =>
    // UserId from token
    apiRequest<void>(`/feed/achievement`, { method: 'POST', body: JSON.stringify({ achievementId }) }),

  // --- Analytics ---
  getAnalyticsForIdea: (ideaId: string) =>
    apiRequest<any>(`/ideas/${ideaId}/analytics`),

  // --- Skills & Endorsements ---
  endorseSkill: (targetUserId: string, skillName: string) =>
    // EndorserId from token
    apiRequest<User>(`/users/${targetUserId}/skills/endorse`, {
      method: 'POST',
      body: JSON.stringify({ skillName })
    }),

  // --- Reports ---
  submitReport: (reportData: Omit<Report, 'reporterId' | 'reportId' | 'createdAt' | 'status'>) =>
    // ReporterId from token
    apiRequest<any>(`/reports`, { method: 'POST', body: JSON.stringify(reportData) }),

  // --- Milestones & Kanban ---
  addMilestone: (ideaId: string, milestoneData: any) =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones`, { method: 'POST', body: JSON.stringify(milestoneData) }),

  editMilestone: (ideaId: string, milestoneId: string, milestoneData: any) =>
    apiRequest<MilestoneResponse>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(milestoneData) }),

  deleteMilestone: (ideaId: string, milestoneId: string) =>
    apiRequest<void>(`/ideas/${ideaId}/milestones/${milestoneId}`, { method: 'DELETE' }),

  completeMilestone: (ideaId: string, milestoneId: string) =>
    apiRequest<any>(`/ideas/${ideaId}/milestones/${milestoneId}/complete`, { method: 'POST' }),

  updateKanbanBoard: (ideaId: string, boardData: KanbanBoard) =>
    apiRequest<KanbanResponse>(`/ideas/${ideaId}/kanban`, { method: 'PUT', body: JSON.stringify(boardData) }),

  // --- AI Recommendations ---
  getRecommendedCollaborators: (ideaId: string) =>
    apiRequest<any[]>(`/ideas/${ideaId}/recommendations/collaborators`),

  // --- AI functions previously called directly from frontend ---
  analyzeIdea: (ideaData: { title: string; description: string; category?: string; ideaId?: string }) =>
    apiRequest<AiAnalysisResponse>('/ai/analyze-idea', { method: 'POST', body: JSON.stringify(ideaData), }),

  refineSummary: (data: { summary: string }) =>
    apiRequest<RefineSummaryResponse>(`/ai/refine-summary`, { method: 'POST', body: JSON.stringify(data) }),

  getIdeaSuggestions: () =>
    apiRequest<AiSuggestionsResponse>(`/ai/idea-suggestions`),
};

export default api;
