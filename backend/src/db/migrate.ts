import { pool } from './database';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Migration runner.
 *
 * Two sources of migrations, applied in this order:
 *   1. INLINE — small bootstrap steps defined in this file (create types,
 *      create users table). These exist because file 001 ALTERs the users
 *      table and so something must create it first.
 *   2. FILE — every .sql file under backend/migrations/ and
 *      backend/src/db/migrations/, sorted alphabetically by basename. Each
 *      file is applied as a single statement (Postgres handles multi-statement
 *      strings just fine through node-pg).
 *
 * The `migrations` tracking table records which have run. Re-running this
 * script is safe — applied migrations are skipped.
 */

const logError = (context: string, error: unknown) => {
    console.error(`[MIGRATION FAILED] ${context}:`, error instanceof Error ? error.message : String(error));
};

interface MigrationStep { name: string; sql: string; source: 'inline' | 'file'; filePath?: string; }

const INLINE_STEPS: MigrationStep[] = [
    {
        name: 'inline_001_create_types',
        source: 'inline',
        sql: `
            DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
                CREATE TYPE user_type AS ENUM ('thinker', 'doer', 'investor');
            END IF;
            END $$;
        `,
    },
    {
        name: 'inline_002_create_users_table',
        source: 'inline',
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
        `,
    },
];

const MIGRATION_DIRS = [
    path.resolve(__dirname, '../../migrations'),         // backend/migrations
    path.resolve(__dirname, './migrations'),              // backend/src/db/migrations
];

function collectFileSteps(): MigrationStep[] {
    const steps: MigrationStep[] = [];
    for (const dir of MIGRATION_DIRS) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
        for (const f of files) {
            const filePath = path.join(dir, f);
            const sql = fs.readFileSync(filePath, 'utf8');
            // Namespace by filename — globally unique across both folders is desired,
            // so include the basename only (collisions across folders would be a bug).
            steps.push({
                name: `file_${path.basename(f, '.sql')}`,
                source: 'file',
                sql,
                filePath,
            });
        }
    }
    return steps;
}

async function executeMigrations() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            );
        `);

        const executed = await client.query<{ name: string }>('SELECT name FROM migrations');
        const done = new Set(executed.rows.map((r) => r.name));

        const allSteps: MigrationStep[] = [...INLINE_STEPS, ...collectFileSteps()];
        let applied = 0;

        for (const step of allSteps) {
            if (done.has(step.name)) {
                console.log(`✓ Skip (already applied): ${step.name}`);
                continue;
            }
            const label = step.source === 'file' ? `${step.name}  (${step.filePath})` : step.name;
            console.log(`→ Applying ${label}`);
            await client.query(step.sql);
            await client.query('INSERT INTO migrations (name) VALUES ($1)', [step.name]);
            applied++;
        }

        await client.query('COMMIT');
        console.log(`✅ Migration finished. ${applied} new step(s) applied, ${done.size + applied - applied} previously applied, ${allSteps.length} total.`);
        return true;
    } catch (error) {
        await client.query('ROLLBACK').catch((e) => logError('ROLLBACK failed', e));
        logError('Migration failed', error);
        throw error;
    } finally {
        client.release();
    }
}

async function migrate() {
    try {
        await executeMigrations();
        if (process.env.NODE_ENV !== 'test') {
            await pool.end().catch((err) => logError('Error ending pool', err));
            process.exit(0);
        }
    } catch (error) {
        logError('Migration script failed completely', error);
        if (process.env.NODE_ENV !== 'test') {
            await pool.end().catch((err) => logError('Error ending pool', err));
            process.exit(1);
        }
    }
}

// Run when invoked directly (npm run migrate) — guards against accidental
// import-time execution if anyone ever pulls executeMigrations programmatically.
if (require.main === module) {
    migrate();
}

export { executeMigrations as migrate };
