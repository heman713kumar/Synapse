// C:\Users\hemant\Downloads\synapse\src\services\backendApiService.ts
import { User, Idea, FeedItem, Comment, CollaborationRequest, Notification, ProgressStage, Feedback, Milestone, KanbanBoard, Report, NotificationSettings, AchievementId } from '../types'; // Added AchievementId

// Use environment variable for production API URL, fallback to local for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Helper Types (Assuming based on backend API structure) ---
interface LoginResponse { user: any; token: string; message?: string; }
interface RegisterResponse { user: any; token: string; message?: string; error?: string; }
interface CreateIdeaResponse { idea: Idea; unlockedAchievements: string[]; } // Adjusted based on NewIdeaForm
interface UpdateStatusResponse { unlockedAchievements: string[]; }
interface SubmitFeedbackResponse { feedback: Feedback; unlockedAchievements: string[]; }
interface BoardVersionResponse extends Omit<Idea, 'ideaBoard'> { // Assuming endpoint returns full idea without board
    nodes: Idea['ideaBoard']['nodes'];
}


// Enhanced generic API request helper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  // Add Authorization header if token exists (implement token storage/retrieval)
  const token = localStorage.getItem('authToken'); // Example: Retrieve token
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }), // Add token if present
    ...options.headers,
  };

  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, { ...options, headers });

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;

      // Try to extract error message from response body
      if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch { /* Ignore parsing error */ }
      } else {
          try {
              const textError = await response.text();
              if (textError) errorMessage += ` - ${textError}`;
          } catch { /* Ignore reading text error */ }
      }

      console.error(`❌ API Failed: ${url}`, errorMessage);
      throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`✅ API Success (204 No Content): ${url}`);
      return {} as T;
    }

    // Validate JSON response
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`❌ API Failed: Non-JSON response from ${url}`);
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log(`✅ API Success: ${url}`);
    return data;

  } catch (error: any) {
    console.error(`❌ API Exception: ${endpoint}`, error);

    // Enhanced error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }

    // Rethrow original or formatted error
    throw new Error(error.message || 'An unknown API error occurred');
  }
}

// Health check (standalone, not via generic helper for pure status check)
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('/api', '') + '/health';
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error);
    return false;
  }
};

// Define the structure for your actual API calls
// Note: These need to align exactly with your backend routes and expected data
export const api = {
  // --- Auth ---
  login: (credentials: { email: string, password: string }) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signUp: (userData: any) => // Use a specific type for signup data
    apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // --- Users ---
  getUserById: (userId: string) => apiRequest<User>(`/users/${userId}`),

  updateUser: (userId: string, userData: Partial<User>) =>
    apiRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  markOnboardingComplete: (userId: string) =>
    apiRequest<User>(`/users/${userId}/onboarding`, {
      method: 'PATCH',
    }),

  // --- Ideas ---
  getAllIdeas: () => apiRequest<Idea[]>('/ideas'), // Assumes GET /api/ideas exists

  getIdeasByOwnerId: (userId: string) => apiRequest<Idea[]>(`/ideas?ownerId=${userId}`), // Needs backend support

  getIdeasByCollaboratorId: (userId: string) => apiRequest<Idea[]>(`/ideas?collaboratorId=${userId}`), // Needs backend support

  getIdeaById: (ideaId: string) => apiRequest<Idea>(`/ideas/${ideaId}`),

  addIdea: (ideaData: any) => // Use specific type
    apiRequest<CreateIdeaResponse>('/ideas', {
      method: 'POST',
      body: JSON.stringify(ideaData),
    }),

   updateIdea: (ideaId: string, ideaData: Partial<Idea>) =>
      apiRequest<Idea>(`/ideas/${ideaId}`, {
        method: 'PUT',
        body: JSON.stringify(ideaData)
      }),

   updateIdeaProgressStage: (ideaId: string, stage: ProgressStage) =>
      apiRequest<Idea>(`/ideas/${ideaId}/stage`, { // Assuming PUT or PATCH endpoint
          method: 'PATCH', // Or PUT
          body: JSON.stringify({ stage })
      }),

   castVote: (ideaId: string, userId: string, type: 'up' | 'down') =>
      apiRequest<Idea>(`/ideas/${ideaId}/vote`, { // Assuming POST endpoint
          method: 'POST',
          body: JSON.stringify({ userId, type })
      }),

   // --- Feed ---
   getFeedItems: () => apiRequest<FeedItem[]>('/feed'), // Assuming GET /api/feed

   // --- Comments & Feedback ---
   getCommentsByIdeaId: (ideaId: string) => apiRequest<Comment[]>(`/ideas/${ideaId}/comments`), // Assuming endpoint

   getCommentsByNodeId: (nodeId: string) => apiRequest<Comment[]>(`/nodes/${nodeId}/comments`), // Assuming endpoint for node comments

   postComment: (ideaId: string, userId: string, text: string) =>
      apiRequest<Comment>(`/ideas/${ideaId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ userId, text }),
      }),

   getFeedbackByIdeaId: (ideaId: string) => apiRequest<Feedback[]>(`/ideas/${ideaId}/feedback`), // Assuming endpoint

   submitFeedback: (feedbackData: any) => // Use specific type
      apiRequest<SubmitFeedbackResponse>(`/ideas/${feedbackData.ideaId}/feedback`, {
          method: 'POST',
          body: JSON.stringify(feedbackData),
      }),

   // --- Collaboration ---
   getCollaborationRequestsByIdeaId: (ideaId: string) =>
      apiRequest<CollaborationRequest[]>(`/ideas/${ideaId}/collaboration-requests`), // Assuming endpoint

   submitCollaborationRequest: (requestData: any) => // Use specific type
      apiRequest<CollaborationRequest>(`/collaborations`, { // Match backend endpoint
          method: 'POST',
          body: JSON.stringify(requestData),
      }),

   updateCollaborationRequestStatus: (requestId: string, status: 'approved' | 'denied') =>
      apiRequest<UpdateStatusResponse>(`/collaborations/${requestId}/status`, { // Assuming PATCH endpoint
          method: 'PATCH',
          body: JSON.stringify({ status }),
      }),

   // --- Idea Board ---
   updateIdeaBoard: (ideaId: string, nodes: Idea['ideaBoard']['nodes']) =>
      apiRequest<Idea>(`/ideas/${ideaId}/board`, { // Assuming PUT/PATCH endpoint
         method: 'PUT',
         body: JSON.stringify({ nodes })
      }),

   saveBoardVersion: (ideaId: string, nodes: Idea['ideaBoard']['nodes'], name: string) =>
       apiRequest<any>(`/ideas/${ideaId}/board/versions`, { // Assuming POST endpoint
           method: 'POST',
           body: JSON.stringify({ nodes, name })
       }),

   getBoardVersions: (ideaId: string) => apiRequest<any[]>(`/ideas/${ideaId}/board/versions`), // Assuming GET endpoint

   revertToBoardVersion: (ideaId: string, versionId: string) =>
       apiRequest<BoardVersionResponse>(`/ideas/${ideaId}/board/versions/${versionId}/revert`, { // Assuming POST endpoint
           method: 'POST'
       }),


   // --- Connections & Messaging ---
   startConversation: (userId1: string, userId2: string) =>
       apiRequest<any>(`/chat/conversations/start`, { // Assuming POST endpoint
           method: 'POST',
           body: JSON.stringify({ participants: [userId1, userId2] })
       }),

   getConversationsByUserId: () => apiRequest<any[]>(`/chat/conversations`), // Removed unused userId parameter

   getMessagesByConversationId: (conversationId: string) => apiRequest<any[]>(`/chat/${conversationId}`), // Match backend endpoint

   sendMessage: (conversationId: string, senderId: string, text: string, options?: any) =>
     apiRequest<any>(`/chat/${conversationId}/messages`, { // Assuming POST endpoint
       method: 'POST',
       body: JSON.stringify({ senderId, text, ...options }),
     }),

   addReactionToMessage: (messageId: string, userId: string, emoji: string) =>
     apiRequest<any>(`/chat/messages/${messageId}/reactions`, { // Assuming POST endpoint
        method: 'POST',
        body: JSON.stringify({ userId, emoji })
     }),

   acceptMessageRequest: (conversationId: string) =>
     apiRequest<any>(`/chat/requests/${conversationId}/accept`, { // Assuming POST endpoint
        method: 'POST'
     }),


   // --- Notifications ---
   getNotificationsByUserId: (userId: string) =>
      apiRequest<Notification[]>(`/users/${userId}/notifications`), // Assuming endpoint

   markAllNotificationsAsRead: (userId: string) =>
      apiRequest<void>(`/users/${userId}/notifications/read`, { // Assuming endpoint
          method: 'PUT', // Or POST/PATCH
      }),

   updateNotificationSettings: (userId: string, settings: NotificationSettings) =>
      apiRequest<User>(`/users/${userId}/settings/notifications`, { // Assuming PUT/PATCH endpoint
          method: 'PUT',
          body: JSON.stringify(settings)
      }),

   // --- Forum ---
   getForumMessages: (ideaId: string) => apiRequest<any[]>(`/ideas/${ideaId}/forum`), // Assuming endpoint
   postForumMessage: (ideaId: string, senderId: string, text: string) =>
       apiRequest<any>(`/ideas/${ideaId}/forum`, { // Assuming endpoint
           method: 'POST',
           body: JSON.stringify({ senderId, text })
       }),
   addForumMember: (ideaId: string, userId: string) =>
       apiRequest<boolean>(`/ideas/${ideaId}/forum/members`, { // Assuming endpoint
           method: 'POST',
           body: JSON.stringify({ userId })
       }),
    removeForumMember: (ideaId: string, userId: string) =>
        apiRequest<boolean>(`/ideas/${ideaId}/forum/members/${userId}`, { // Assuming endpoint
            method: 'DELETE'
        }),
   deleteForumMessage: (messageId: string) =>
       apiRequest<void>(`/forum/messages/${messageId}`, { // Assuming endpoint
           method: 'DELETE'
       }),
   pinForumMessage: (messageId: string) =>
       apiRequest<void>(`/forum/messages/${messageId}/pin`, { // Assuming endpoint
           method: 'POST' // Or PATCH
       }),


   // --- Achievements & Gamification ---
   getUserAchievements: (userId: string) => apiRequest<any[]>(`/users/${userId}/achievements`), // Assuming endpoint
   shareAchievementToFeed: (userId: string, achievementId: AchievementId) =>
       apiRequest<void>(`/feed/achievement`, { // Assuming endpoint
           method: 'POST',
           body: JSON.stringify({ userId, achievementId })
       }),


   // --- Analytics ---
   getAnalyticsForIdea: (ideaId: string) => apiRequest<any>(`/ideas/${ideaId}/analytics`), // Assuming endpoint


   // --- Skills & Endorsements ---
   endorseSkill: (targetUserId: string, endorserUserId: string, skillName: string) =>
       apiRequest<User>(`/users/${targetUserId}/skills/endorse`, { // Assuming endpoint
           method: 'POST',
           body: JSON.stringify({ endorserUserId, skillName })
       }),

   // --- Reports ---
   submitReport: (reportData: Report) =>
      apiRequest<any>(`/reports`, { // Assuming endpoint
          method: 'POST',
          body: JSON.stringify(reportData)
      }),

   // --- Milestones & Kanban ---
   addMilestone: (ideaId: string, milestoneData: any) =>
      apiRequest<Milestone>(`/ideas/${ideaId}/milestones`, { // Assuming endpoint
         method: 'POST',
         body: JSON.stringify(milestoneData)
      }),
   editMilestone: (ideaId: string, milestoneId: string, milestoneData: any) =>
      apiRequest<Milestone>(`/ideas/${ideaId}/milestones/${milestoneId}`, { // Assuming endpoint
         method: 'PUT',
         body: JSON.stringify(milestoneData)
      }),
   deleteMilestone: (ideaId: string, milestoneId: string) =>
      apiRequest<void>(`/ideas/${ideaId}/milestones/${milestoneId}`, { // Assuming endpoint
         method: 'DELETE'
      }),
   completeMilestone: (ideaId: string, milestoneId: string) =>
      apiRequest<any>(`/ideas/${ideaId}/milestones/${milestoneId}/complete`, { // Assuming endpoint
         method: 'POST'
      }),
   updateKanbanBoard: (ideaId: string, boardData: KanbanBoard) =>
      apiRequest<KanbanBoard>(`/ideas/${ideaId}/kanban`, { // Assuming endpoint
         method: 'PUT',
         body: JSON.stringify(boardData)
      }),


   // --- AI Recommendations (example) ---
    getRecommendedCollaborators: (ideaId: string) => apiRequest<any[]>(`/ideas/${ideaId}/recommendations/collaborators`), // Assuming endpoint


};

export default api;