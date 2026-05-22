import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import notificationService from '../services/notificationService';
import searchService from '../services/searchService';
import trendingService from '../services/trendingService';

const router: Router = express.Router();

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

// Get notification preferences for user
router.get('/notifications/preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const preferences = await notificationService.getNotificationPreferences(userId);
    res.json({ success: true, data: preferences });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update notification preference
router.post('/notifications/preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channel, category, enabled, frequency } = req.body;

    const result = await notificationService.updateNotificationPreference(
      userId,
      channel,
      category,
      enabled,
      frequency
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread notifications
router.get('/notifications/unread', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notifications = await notificationService.getUnreadNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get notifications by category
router.get('/notifications/category/:category', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { category } = req.params;
    const notifications = await notificationService.getNotificationsByCategory(userId, category);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await notificationService.markNotificationAsRead(parseInt(id));
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await notificationService.markAllNotificationsAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete('/notifications/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(parseInt(id));
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SEARCH ROUTES
// ============================================

// Search ideas
router.get('/search/ideas', async (req: Request, res: Response) => {
  try {
    const { q, category, minLikes, minComments, status, sortBy, limit } = req.body;

    const filters = {
      category,
      minLikes: minLikes ? parseInt(minLikes) : undefined,
      minComments: minComments ? parseInt(minComments) : undefined,
      status,
      sortBy,
      limit: limit ? parseInt(limit) : 20,
    };

    const results = await searchService.searchIdeas(q, filters);
    const userId = (req as any).userId;

    // Log search in history if user is authenticated
    if (userId) {
      await searchService.addSearchHistory(userId, q, filters, results?.length || 0);
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search users
router.get('/search/users', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const results = await searchService.searchUsers(q as string);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get search history
router.get('/search/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const history = await searchService.getSearchHistory(userId);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear search history
router.delete('/search/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await searchService.clearSearchHistory(userId);
    res.json({ success: true, message: 'Search history cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get search suggestions/autocomplete
router.get('/search/suggestions', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSearchSuggestions(q as string);
    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save search
router.post('/search/saved', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, query, filters } = req.body;
    const saved = await searchService.createSavedSearch(userId, name, query, filters);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get saved searches
router.get('/search/saved', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const saved = await searchService.getSavedSearches(userId);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run saved search
router.get('/search/saved/:id/run', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const results = await searchService.runSavedSearch(parseInt(id));
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete saved search
router.delete('/search/saved/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await searchService.deleteSavedSearch(parseInt(id));
    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// TRENDING & RECOMMENDATIONS ROUTES
// ============================================

// Get trending ideas
router.get('/trending/ideas', async (req: Request, res: Response) => {
  try {
    const { period, limit } = req.query;
    const ideas = await trendingService.getTrendingIdeas(
      (period as string) || 'today',
      limit ? parseInt(limit as string) : 10
    );
    res.json({ success: true, data: ideas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get hot right now (last 24h most engaged)
router.get('/trending/hot-now', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const ideas = await trendingService.getHotRightNow(limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: ideas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get popular this week
router.get('/trending/popular-week', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const ideas = await trendingService.getPopularThisWeek(limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: ideas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recommended ideas for user
router.get('/recommendations/ideas', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit } = req.query;

    // Generate recommendations if not already done today
    await trendingService.generateIdeaRecommendations(userId);

    const ideas = await trendingService.getRecommendedIdeas(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: ideas });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recommended users
router.get('/recommendations/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit } = req.query;

    // Generate recommendations if not already done today
    await trendingService.generateUserRecommendations(userId);

    const users = await trendingService.getRecommendedUsers(
      userId,
      limit ? parseInt(limit as string) : 5
    );

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get curator picks
router.get('/curator-picks', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const picks = await trendingService.getCuratorPicks(limit ? parseInt(limit as string) : 10);
    res.json({ success: true, data: picks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Add curator pick
router.post('/curator-picks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ideaId, reason } = req.body;

    // TODO: Add admin check

    const pick = await trendingService.addCuratorPick(userId, ideaId, reason);
    res.json({ success: true, data: pick });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Remove curator pick
router.delete('/curator-picks/:ideaId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ideaId } = req.params;

    // TODO: Add admin check

    await trendingService.removeCuratorPick(userId, ideaId);
    res.json({ success: true, message: 'Curator pick removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
