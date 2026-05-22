import { Request, Response, NextFunction } from 'express';
import { query } from '../db/database';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Supports roles: admin, moderator, creator, contributor, user
 */

export type UserRole = 'admin' | 'moderator' | 'creator' | 'contributor' | 'user';

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
    admin: 4,
    moderator: 3,
    creator: 2,
    contributor: 1,
    user: 0,
};

/**
 * Check if user has minimum role level
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Get user's current role
            const result = await query(
                `SELECT role FROM users WHERE id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userRole = (result.rows[0].role || 'user') as UserRole;
            (req as any).user.role = userRole;

            // Check if user's role is in allowed roles
            if (allowedRoles.includes(userRole)) {
                return next();
            }

            return res.status(403).json({
                error: 'Insufficient permissions',
                requiredRoles: allowedRoles,
                userRole,
            });
        } catch (error) {
            console.error('RBAC error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

/**
 * Check if user has minimum role hierarchy level
 * Useful for: requireMinRole('creator') - allows admin, moderator, creator
 */
export const requireMinRole = (minRole: UserRole) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await query(
                `SELECT role FROM users WHERE id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userRole = (result.rows[0].role || 'user') as UserRole;
            (req as any).user.role = userRole;

            const userHierarchy = ROLE_HIERARCHY[userRole];
            const requiredHierarchy = ROLE_HIERARCHY[minRole];

            if (userHierarchy >= requiredHierarchy) {
                return next();
            }

            return res.status(403).json({
                error: 'Insufficient permissions',
                requiredRole: minRole,
                userRole,
            });
        } catch (error) {
            console.error('RBAC error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

/**
 * Check if user is project owner or admin
 */
export const requireOwnerOrAdmin = async (
    userId: string,
    projectId: string
): Promise<boolean> => {
    try {
        const userResult = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) return false;

        const userRole = userResult.rows[0].role as UserRole;
        if (userRole === 'admin') return true;

        const projectResult = await query(
            `SELECT ownerId FROM ideas WHERE ideaId = $1`,
            [projectId]
        );

        return projectResult.rows.length > 0 && projectResult.rows[0].ownerId === userId;
    } catch (error) {
        console.error('Owner check error:', error);
        return false;
    }
};

/**
 * Assign role to user
 */
export const assignRole = async (userId: string, role: UserRole): Promise<void> => {
    try {
        if (!['admin', 'moderator', 'creator', 'contributor', 'user'].includes(role)) {
            throw new Error('Invalid role');
        }

        await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);

        // Log the role change
        await logAuditEvent({
            userId,
            action: 'ROLE_CHANGE',
            resourceType: 'USER',
            resourceId: userId,
            details: { newRole: role },
        });
    } catch (error) {
        console.error('Assign role error:', error);
        throw error;
    }
};

/**
 * Audit Logging System
 * Logs all sensitive actions for compliance and debugging
 */

export interface AuditEvent {
    userId: string;
    action: string; // e.g., 'CREATE_IDEA', 'DELETE_COMMENT', 'VIEW_ANALYTICS'
    resourceType: string; // e.g., 'IDEA', 'COMMENT', 'USER'
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an audit event
 */
export const logAuditEvent = async (event: AuditEvent): Promise<void> => {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                event.userId,
                event.action,
                event.resourceType,
                event.resourceId,
                JSON.stringify(event.details || {}),
                event.ipAddress || 'unknown',
                event.userAgent || 'unknown',
            ]
        );
    } catch (error) {
        console.error('Audit log error:', error);
        // Don't throw - logging errors shouldn't break functionality
    }
};

/**
 * Middleware to automatically log API actions
 */
export const auditLog = (action: string, resourceType: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Store action info for later logging after response
        (req as any).auditInfo = {
            action,
            resourceType,
        };
        next();
    };
};

/**
 * Get audit logs for a resource
 */
export const getAuditLogs = async (
    resourceType: string,
    resourceId: string
): Promise<AuditEvent[]> => {
    try {
        const result = await query(
            `SELECT user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
             FROM audit_logs
             WHERE resource_type = $1 AND resource_id = $2
             ORDER BY created_at DESC
             LIMIT 100`,
            [resourceType, resourceId]
        );

        return result.rows.map((row: any) => ({
            userId: row.user_id,
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            details: JSON.parse(row.details),
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
        }));
    } catch (error) {
        console.error('Get audit logs error:', error);
        throw error;
    }
};

/**
 * Get user's action history
 */
export const getUserActionHistory = async (userId: string, limit: number = 50) => {
    try {
        const result = await query(
            `SELECT action, resource_type, resource_id, details, created_at
             FROM audit_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows.map((row: any) => ({
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            details: JSON.parse(row.details),
            timestamp: row.created_at,
        }));
    } catch (error) {
        console.error('Get user history error:', error);
        throw error;
    }
};

export default {
    requireRole,
    requireMinRole,
    requireOwnerOrAdmin,
    assignRole,
    logAuditEvent,
    auditLog,
    getAuditLogs,
    getUserActionHistory,
};
