import { query } from '../db/database';

/**
 * Trending & Content Curation Service
 * Algorithm for trending scores, recommendations, and curator picks
 */

// ============================================
// TRENDING CONTENT
// ============================================

export async function calculateTrendingScore(ideaId: string): Promise<number> {
  try {
    const result = await query(
      `SELECT likes_count, comments_count, created_at, view_count FROM ideas WHERE id = $1`,
      [ideaId]
    );

    if (result.rows.length === 0) return 0;

    const idea = result.rows[0];
    const age = Date.now() - new Date(idea.created_at).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const freshness = Math.max(0, 10 - age / oneDay);

    const score = Number(
      (idea.likes_count || 0) * 0.3 +
      (idea.comments_count || 0) * 0.4 +
      (idea.view_count || 0) * 0.2 +
      freshness * 0.1
    );

    return score;
  } catch (error) {
    console.error('Error calculating trending score:', error);
    return 0;
  }
}

export async function updateTrendingContent(period: string = 'today'): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id FROM ideas WHERE status = 'published' LIMIT 100`,
      []
    );

    const trendingData: any[] = [];
    for (const row of result.rows) {
      const score = await calculateTrendingScore(row.id);
      trendingData.push({
        idea_id: row.id,
        trending_score: score,
        period,
        updated_at: new Date().toISOString(),
      });
    }

    trendingData.sort((a, b) => b.trending_score - a.trending_score);
    trendingData.forEach((item: any, index: number) => {
      item.rank_position = index + 1;
    });

    if (trendingData.length > 0) {
      for (const item of trendingData) {
        await query(
          `INSERT INTO trending_content (idea_id, trending_score, period, updated_at)
           VALUES ($1, $2, $3, $4) ON CONFLICT (idea_id) DO UPDATE SET trending_score = $2, updated_at = $4`,
          [item.idea_id, item.trending_score, period, item.updated_at]
        );
      }
    }

    return trendingData;
  } catch (error) {
    console.error('Error updating trending content:', error);
    return [];
  }
}

export async function getTrendingIdeas(period: string = 'today', limit: number = 10): Promise<any[]> {
  try {
    const result = await query(
      `SELECT tc.idea_id, tc.trending_score 
       FROM trending_content tc WHERE tc.period = $1 
       ORDER BY tc.trending_score DESC LIMIT $2`,
      [period, limit]
    );

    if (result.rows.length === 0) return [];

    const ideaIds = result.rows.map((item: any) => item.idea_id);
    const ideasResult = await query(
      `SELECT * FROM ideas WHERE id = ANY($1)`,
      [ideaIds]
    );

    return ideasResult.rows;
  } catch (error) {
    console.error('Error getting trending ideas:', error);
    return [];
  }
}

export async function getHotRightNow(limit: number = 10): Promise<any[]> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await query(
      `SELECT * FROM ideas WHERE created_at >= $1 AND status = 'published' 
       ORDER BY likes_count DESC LIMIT $2`,
      [oneDayAgo, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting hot right now:', error);
    return [];
  }
}

export async function generateIdeaRecommendations(userId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id FROM ideas LIMIT 10`,
      []
    );

    return result.rows;
  } catch (error) {
    console.error('Error generating idea recommendations:', error);
    return [];
  }
}

export async function generateUserRecommendations(userId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id FROM users LIMIT 5`,
      []
    );

    return result.rows;
  } catch (error) {
    console.error('Error generating user recommendations:', error);
    return [];
  }
}

export async function addCuratorPick(
  curatorId: string,
  ideaId: string,
  reason: string
): Promise<any> {
  try {
    const result = await query(
      `INSERT INTO curator_picks (curator_id, idea_id, reason) VALUES ($1, $2, $3) RETURNING *`,
      [curatorId, ideaId, reason]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error adding curator pick:', error);
    return null;
  }
}

export async function removeCuratorPick(
  curatorId: string,
  ideaId: string
): Promise<void> {
  try {
    await query(
      `DELETE FROM curator_picks WHERE curator_id = $1 AND idea_id = $2`,
      [curatorId, ideaId]
    );
  } catch (error) {
    console.error('Error removing curator pick:', error);
  }
}

export async function getCuratorPicks(limit: number = 20): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM curator_picks ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting curator picks:', error);
    return [];
  }
}

export async function getPopularThisWeek(limit: number = 10): Promise<any[]> {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await query(
      `SELECT * FROM ideas WHERE created_at >= $1 AND status = 'published' 
       ORDER BY likes_count DESC LIMIT $2`,
      [oneWeekAgo, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting popular this week:', error);
    return [];
  }
}

export async function getRecommendedIdeas(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM ideas WHERE id IN (
       SELECT recommended_idea_id FROM idea_recommendations WHERE user_id = $1)
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting recommended ideas:', error);
    return [];
  }
}

export async function getRecommendedUsers(userId: string, limit: number = 5): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM users WHERE id IN (
       SELECT recommended_user_id FROM user_recommendations WHERE user_id = $1)
       ORDER BY id DESC LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting recommended users:', error);
    return [];
  }
}

export default {
  calculateTrendingScore,
  updateTrendingContent,
  getTrendingIdeas,
  getHotRightNow,
  generateIdeaRecommendations,
  generateUserRecommendations,
  addCuratorPick,
  removeCuratorPick,
  getCuratorPicks,
  getPopularThisWeek,
  getRecommendedIdeas,
  getRecommendedUsers,
};
