// C:\Users\hemant\Downloads\synapse\backend\src\db\migrate.ts
import { pool } from './database.js';

async function migrate() {
  // ... (migration logic remains the same) ...
  try {
    console.log('Starting database migration...');
    // ... (CREATE TYPE / CREATE TABLE queries) ...
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    // Ensure process exits with error code if run directly
    if (process.env.NODE_ENV !== 'test') { // Avoid exiting during tests
        await pool.end().catch(err: any => console.error("Error ending pool:", err));
        process.exit(1);
    } else {
        throw error; // Rethrow for testing frameworks
    }
  } finally {
    // Only end pool if not testing and not already exited due to error
     if (process.env.NODE_ENV !== 'test') {
        await pool.end().catch(err: any => console.error("Error ending pool:", err));
     }
  }
}

// Call migrate directly - intended to be run as a script
migrate().then(() => {
    console.log("Migration script finished.");
     // Exit successfully if not testing
    if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
    }
}).catch(err => {
    // Error is already handled inside migrate() for direct execution
    // console.error is sufficient here if migrate rethrows for testing
    console.error("Migration script failed:", err);
});

// Export for potential programmatic use (optional)
export { migrate };