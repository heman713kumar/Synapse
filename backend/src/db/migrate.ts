// C:\Users\hemant\Downloads\synapse\backend\src\db\migrate.ts
import { pool } from './database.js';

// Use safe error logging function
const logError = (context: string, error: unknown) => {
    console.error(`[MIGRATION FAILED] ${context}:`, error instanceof Error ? error.message : String(error));
};

// Define core migration logic wrapped in a transaction
async function executeMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        console.log('Starting database migration...');

        // 1. Setup Versioning Table (Idempotent)
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Setup: Migration tracking table confirmed.');
        
        // 2. Define the list of migrations to run
        const migrations = [
            // { name: '001_initial_schema', sql: 'CREATE TYPE user_type AS ENUM (...); CREATE TABLE users (...);' },
            // For example, this is where your schema creation queries would go.
            { name: '001_create_types', 
              sql: `
                DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
                    CREATE TYPE user_type AS ENUM ('thinker', 'doer', 'investor');
                END IF;
                END $$;
              ` 
            },
            { name: '002_create_users_table', 
              sql: `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    display_name VARCHAR(255),
                    avatar_url TEXT,
                    bio TEXT,
                    user_type user_type NOT NULL DEFAULT 'thinker',
                    skills JSONB DEFAULT '[]'::jsonb,
                    interests TEXT[] DEFAULT '{}',
                    onboarding_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
              ` 
            }
        ];
        
        // 3. Check and execute new migrations
        const executedMigrations = await client.query('SELECT name FROM migrations');
        const executedNames = new Set(executedMigrations.rows.map(row => row.name));
        
        for (const mig of migrations) {
            if (!executedNames.has(mig.name)) {
                console.log(`Executing migration: ${mig.name}`);
                await client.query(mig.sql);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [mig.name]);
            } else {
                console.log(`Skipping migration: ${mig.name} (Already executed)`);
            }
        }

        await client.query('COMMIT');
        console.log('✅ Database migration completed successfully!');
        return true; // Indicate success
        
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK').catch(e => logError("ROLLBACK failed", e));
        logError("Migration failed", error);
        throw error; // Rethrow for external handling
        
    } finally {
        client.release();
    }
}

// Wrapper to manage process exit after migration attempt
async function migrate() {
    try {
        await executeMigrations();
        console.log("Migration script finished.");
        // Exit successfully if run directly (not part of a test runner)
        if (process.env.NODE_ENV !== 'test') {
            await pool.end().catch(err => logError("Error ending pool", err));
            process.exit(0);
        }
    } catch (error) {
        logError("Migration script failed completely", error);
        // Ensure pool ends and process exits with failure code
        if (process.env.NODE_ENV !== 'test') {
            await pool.end().catch(err => logError("Error ending pool", err));
            process.exit(1);
        }
    }
}

// Call migrate directly - intended to be run as a script
migrate();
// Export for potential programmatic use (optional)
export { executeMigrations as migrate };