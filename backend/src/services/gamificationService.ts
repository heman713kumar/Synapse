import { query } from '../db/database';
import { sendAchievementEmail } from '../services/emailService';

/**
 * Gamification System with Badges and Leaderboards
 */

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'contribution' | 'collaboration' | 'creator' | 'mentor' | 'special';
    requirement: number; // Threshold to unlock
    metric: string; // What metric unlocks this badge
}

// Define all available badges
export const BADGES: Record<string, Badge> = {
    FIRST_IDEA: {
        id: 'first-idea',
        name: 'Idea Starter',
        description: 'Created your first idea',
        icon: '💡',
        category: 'creator',
        requirement: 1,
        metric: 'ideas_created',
    },
    PROLIFIC_CREATOR: {
        id: 'prolific-creator',
        name: 'Prolific Creator',
        description: 'Created 10 ideas',
        icon: '🚀',
        category: 'creator',
        requirement: 10,
        metric: 'ideas_created',
    },
    COLLABORATION_CHAMPION: {
        id: 'collaboration-champion',
        name: 'Collaboration Champion',
        description: 'Collaborated on 5 projects',
        icon: '🤝',
        category: 'collaboration',
        requirement: 5,
        metric: 'collaborations_joined',
    },
    HELPFUL_MENTOR: {
        id: 'helpful-mentor',
        name: 'Helpful Mentor',
        description: 'Received 20 positive feedback',
        icon: '👨‍🏫',
        category: 'mentor',
        requirement: 20,
        metric: 'positive_feedback_count',
    },
    INNOVATION_LEADER: {
        id: 'innovation-leader',
        name: 'Innovation Leader',
        description: 'Had 3 ideas gain 50+ collaborations',
        icon: '🏆',
        category: 'special',
        requirement: 3,
        metric: 'highly_collaborated_ideas',
    },
    CONNECTOR: {
        id: 'connector',
        name: 'Connector',
        description: 'Made 15 connections',
        icon: '🌐',
        category: 'collaboration',
        requirement: 15,
        metric: 'connections_made',
    },
    TRUSTED_CONTRIBUTOR: {
        id: 'trusted-contributor',
        name: 'Trusted Contributor',
        description: 'Maintained 100% collaboration success rate',
        icon: '✨',
        category: 'contribution',
        requirement: 100,
        metric: 'collaboration_success_rate',
    },
};

/**
 * Award a badge to a user
 */
export const awardBadge = async (
    userId: string,
    badgeId: string,
    userEmail: string,
    userName: string
): Promise<boolean> => {
    try {
        const badge = Object.values(BADGES).find((b) => b.id === badgeId);
        if (!badge) {
            console.error(`Badge ${badgeId} not found`);
            return false;
        }

        // Check if user already has this badge
        const existing = await query(
            `SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2`,
            [userId, badgeId]
        );

        if (existing.rows.length > 0) {
            return false; // Already has badge
        }

        // Award badge
        await query(
            `INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES ($1, $2, NOW())`,
            [userId, badgeId]
        );

        // Increment user's badge count
        await query(`UPDATE users SET badges_count = COALESCE(badges_count, 0) + 1 WHERE id = $1`, [
            userId,
        ]);

        // Send achievement email
        try {
            await sendAchievementEmail(userEmail, userName, badge.name, badge.icon);
        } catch (emailError) {
            console.error('Failed to send achievement email:', emailError);
        }

        console.log(`✅ Badge awarded: ${badge.name} to user ${userId}`);
        return true;
    } catch (error) {
        console.error('Award badge error:', error);
        return false;
    }
};

/**
 * Check and award badges based on user activity
 */
export const checkAndAwardBadges = async (userId: string): Promise<string[]> => {
    try {
        // Get user data
        const userResult = await query(
            `SELECT email, display_name, 
                    (SELECT COUNT(*) FROM ideas WHERE ownerId = $1)::int as ideas_created,
                    (SELECT COUNT(*) FROM collaborations WHERE collaborator_id = $1)::int as collaborations_joined,
                    badges_count
             FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) return [];

        const user = userResult.rows[0];
        const awardedBadges: string[] = [];

        // Check each badge
        for (const [key, badge] of Object.entries(BADGES)) {
            let shouldAward = false;

            switch (badge.metric) {
                case 'ideas_created':
                    shouldAward = user.ideas_created >= badge.requirement;
                    break;
                case 'collaborations_joined':
                    shouldAward = user.collaborations_joined >= badge.requirement;
                    break;
                // Add more metrics as needed
            }

            if (shouldAward) {
                const awarded = await awardBadge(
                    userId,
                    badge.id,
                    user.email,
                    user.display_name
                );
                if (awarded) {
                    awardedBadges.push(badge.id);
                }
            }
        }

        return awardedBadges;
    } catch (error) {
        console.error('Check badges error:', error);
        return [];
    }
};

/**
 * Get user's badges
 */
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
    try {
        const result = await query(
            `SELECT badge_id FROM user_badges WHERE user_id = $1 ORDER BY unlocked_at DESC`,
            [userId]
        );

        return result.rows
            .map((row: any) => Object.values(BADGES).find((b) => b.id === row.badge_id))
            .filter((b): b is Badge => !!b);
    } catch (error) {
        console.error('Get user badges error:', error);
        return [];
    }
};

/**
 * Leaderboard: Top creators
 */
export const getTopCreators = async (limit: number = 10) => {
    try {
        const result = await query(
            `SELECT u.id, u.display_name, u.avatar_url, 
                    COUNT(i.id)::int as ideas_count,
                    SUM(COALESCE(i.likesCount, 0))::int as total_likes,
                    COUNT(DISTINCT c.id)::int as total_collaborators
             FROM users u
             LEFT JOIN ideas i ON i.ownerId = u.id
             LEFT JOIN collaborations c ON c.idea_id = i.id
             GROUP BY u.id
             ORDER BY ideas_count DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows.map((row: any) => ({
            userId: row.id,
            name: row.display_name,
            avatarUrl: row.avatar_url,
            ideasCreated: row.ideas_count,
            totalLikes: row.total_likes,
            totalCollaborators: row.total_collaborators,
            rank: 0, // Set after sorting
        }));
    } catch (error) {
        console.error('Top creators error:', error);
        return [];
    }
};

/**
 * Leaderboard: Top collaborators
 */
export const getTopCollaborators = async (limit: number = 10) => {
    try {
        const result = await query(
            `SELECT u.id, u.display_name, u.avatar_url,
                    COUNT(DISTINCT c.id)::int as collaboration_count,
                    COUNT(DISTINCT c.idea_id)::int as projects_contributed,
                    u.badges_count
             FROM users u
             LEFT JOIN collaborations c ON c.collaborator_id = u.id AND c.status = 'approved'
             GROUP BY u.id
             ORDER BY collaboration_count DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows.map((row: any, index: number) => ({
            userId: row.id,
            name: row.display_name,
            avatarUrl: row.avatar_url,
            collaborations: row.collaboration_count,
            projectsContributed: row.projects_contributed,
            badges: row.badges_count || 0,
            rank: index + 1,
        }));
    } catch (error) {
        console.error('Top collaborators error:', error);
        return [];
    }
};

/**
 * Leaderboard: By reputation score
 */
export const getTopByReputation = async (limit: number = 10) => {
    try {
        const result = await query(
            `SELECT u.id, u.display_name, u.avatar_url,
                    (
                        COALESCE((SELECT COUNT(*) FROM ideas WHERE ownerId = u.id), 0) * 10 +
                        COALESCE((SELECT COUNT(*) FROM collaborations WHERE collaborator_id = u.id AND status = 'approved'), 0) * 5 +
                        COALESCE(u.badges_count, 0) * 20
                    )::int as reputation_score
             FROM users u
             ORDER BY reputation_score DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows.map((row: any, index: number) => ({
            userId: row.id,
            name: row.display_name,
            avatarUrl: row.avatar_url,
            reputationScore: row.reputation_score,
            rank: index + 1,
        }));
    } catch (error) {
        console.error('Top by reputation error:', error);
        return [];
    }
};

/**
 * Get user's contribution stats
 */
export const getUserStats = async (userId: string) => {
    try {
        const result = await query(
            `SELECT 
                (SELECT COUNT(*) FROM ideas WHERE ownerId = $1)::int as ideas_created,
                (SELECT COUNT(*) FROM collaborations WHERE collaborator_id = $1 AND status = 'approved')::int as collaborations_completed,
                (SELECT COUNT(*) FROM comments WHERE author_id = $1)::int as comments_posted,
                (SELECT COUNT(*) FROM feedback WHERE created_by = $1)::int as feedback_given,
                (SELECT COUNT(*) FROM connections WHERE requester_id = $1 OR recipient_id = $1)::int as connections_made,
                (SELECT COUNT(*) FROM user_badges WHERE user_id = $1)::int as badges_earned,
                (SELECT SUM(COALESCE(likesCount, 0)) FROM ideas WHERE ownerId = $1)::int as total_likes_received
             FROM users WHERE id = $1`,
            [userId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Get user stats error:', error);
        return null;
    }
};

export default {
    BADGES,
    awardBadge,
    checkAndAwardBadges,
    getUserBadges,
    getTopCreators,
    getTopCollaborators,
    getTopByReputation,
    getUserStats,
};
