import { query } from '../db/database';

/**
 * Advanced Search Service
 * Full-text search, filters, saved searches, and search history
 */

// ============================================
// FULL-TEXT SEARCH
// ============================================

export async function searchIdeas(
  queryText: string,
  filters: any = {}
) {
  let sql = `SELECT id, title, description, summary, created_by, likes_count, comments_count, created_at, user_id 
             FROM ideas WHERE 1=1`;
  const params: any[] = [];
  let paramCount = 1;

  // Full-text search on title, description, and summary
  if (queryText) {
    sql += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR summary ILIKE $${paramCount})`;
    params.push(`%${queryText}%`);
    paramCount++;
  }

  // Filter by category/tags
  if (filters.category) {
    sql += ` AND category = $${paramCount}`;
    params.push(filters.category);
    paramCount++;
  }

  // Filter by engagement
  if (filters.minLikes) {
    sql += ` AND likes_count >= $${paramCount}`;
    params.push(filters.minLikes);
    paramCount++;
  }
  if (filters.minComments) {
    sql += ` AND comments_count >= $${paramCount}`;
    params.push(filters.minComments);
    paramCount++;
  }

  // Sort
  const validSortBy = ['created_at', 'likes_count', 'comments_count'];
  const sortBy = validSortBy.includes(filters.sortBy) ? filters.sortBy : 'created_at';
  sql += ` ORDER BY ${sortBy} DESC LIMIT 50`;

  const result = await query(sql, params);
  return result.rows;
}

export async function searchUsers(queryText: string) {
  const result = await query(
    `SELECT id, username, email, profile_picture, bio, followers_count FROM users 
     WHERE username ILIKE $1 OR email ILIKE $1 OR bio ILIKE $1 LIMIT 20`,
    [`%${queryText}%`]
  );
  return result.rows;
}

export async function searchDiscussions(queryText: string) {
  const result = await query(
    `SELECT id, content, created_by, idea_id, created_at FROM discussion_messages 
     WHERE content ILIKE $1 ORDER BY created_at DESC LIMIT 20`,
    [`%${queryText}%`]
  );
  return result.rows;
}

// ============================================
// SEARCH HISTORY
// ============================================

export async function addSearchHistory(
  userId: string,
  queryText: string,
  filters: any = {},
  resultCount: number = 0
) {
  const result = await query(
    `INSERT INTO search_history (user_id, query, filters, result_count) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, queryText, JSON.stringify(filters), resultCount]
  );
  return result.rows[0];
}

export async function getSearchHistory(userId: string, limit: number = 10) {
  const result = await query(
    `SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function clearSearchHistory(userId: string) {
  await query(`DELETE FROM search_history WHERE user_id = $1`, [userId]);
}

// ============================================
// SAVED SEARCHES
// ============================================

export async function createSavedSearch(
  userId: string,
  name: string,
  queryText: string,
  filters: any = {}
) {
  const result = await query(
    `INSERT INTO saved_searches (user_id, name, query, filters) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, queryText, JSON.stringify(filters)]
  );
  return result.rows[0];
}

export async function getSavedSearches(userId: string) {
  const result = await query(
    `SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function updateSavedSearch(
  searchId: string | number,
  name?: string,
  queryText?: string,
  filters?: any
) {
  let sql = `UPDATE saved_searches SET updated_at = NOW()`;
  const params: any[] = [];
  let paramCount = 1;

  if (name) {
    sql += `, name = $${paramCount}`;
    params.push(name);
    paramCount++;
  }
  if (queryText) {
    sql += `, query = $${paramCount}`;
    params.push(queryText);
    paramCount++;
  }
  if (filters) {
    sql += `, filters = $${paramCount}`;
    params.push(JSON.stringify(filters));
    paramCount++;
  }

  sql += ` WHERE id = $${paramCount} RETURNING *`;
  params.push(searchId);

  const result = await query(sql, params);
  return result.rows[0];
}

export async function deleteSavedSearch(searchId: string | number) {
  await query(`DELETE FROM saved_searches WHERE id = $1`, [searchId]);
}

export async function runSavedSearch(searchId: string | number) {
  const searchResult = await query(
    `SELECT * FROM saved_searches WHERE id = $1`,
    [searchId]
  );
  
  if (searchResult.rows.length === 0) {
    throw new Error('Saved search not found');
  }

  const search = searchResult.rows[0];
  const results = await searchIdeas(search.query, JSON.parse(search.filters || '{}'));

  await query(
    `UPDATE saved_searches SET result_count = $1, last_executed_at = NOW() WHERE id = $2`,
    [results.length, searchId]
  );

  return results;
}

// ============================================
// AUTO-COMPLETE / SUGGESTIONS
// ============================================

export async function getSearchSuggestions(queryText: string, limit: number = 5) {
  if (queryText.length < 2) return [];

  const result = await query(
    `SELECT DISTINCT title FROM ideas 
     WHERE title ILIKE $1 OR description ILIKE $1 OR summary ILIKE $1 
     LIMIT $2`,
    [`%${queryText}%`, limit]
  );

  return result.rows.map((item: any) => item.title);
}

export async function getTrendingSearches(limit: number = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await query(
    `SELECT query, COUNT(*) as count FROM search_history 
     WHERE created_at >= $1 GROUP BY query ORDER BY count DESC LIMIT $2`,
    [sevenDaysAgo, limit]
  );

  return result.rows;
}

export default {
  searchIdeas,
  searchUsers,
  searchDiscussions,
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  createSavedSearch,
  getSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
  runSavedSearch,
  getSearchSuggestions,
  getTrendingSearches,
};
