// C:\Users\hemant\Downloads\synapse\backend\src\db\updateUsersTable.ts
import { pool } from './database.js';

// Use safe error logging function
const logError = (context: string, error: unknown) => {
    console.error(`[UPDATE FAILED] ${context}:`, error instanceof Error ? error.message : String(error));
};


const updateUsersTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🔄 Starting users table update...');
    
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);
    
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    `);
    
    // Add other necessary columns (example)
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
    `);

    await client.query('COMMIT');
    console.log('✅ Users table updated successfully!');
    return true; // Indicate success
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK').catch(e => logError("ROLLBACK failed", e));
    logError("Error updating users table", error);
    throw error; // Rethrow for external handling
    
  } finally {
    client.release();
  }
};

// Wrapper to manage process exit after update attempt
async function runUpdateScript() {
    try {
        await updateUsersTable();
        console.log('🎉 Users table update completed!');
        if (process.env.NODE_ENV !== 'test') {
             await pool.end().catch(err => logError("Error ending pool", err));
             process.exit(0);
        }
    } catch (error) {
        logError("Users table update script failed completely", error);
        // Ensure pool ends and process exits with failure code
        if (process.env.NODE_ENV !== 'test') {
            await pool.end().catch(err => logError("Error ending pool", err));
            process.exit(1);
        }
    }
}


// Call update directly - intended to be run as a script
runUpdateScript();
// Export for potential programmatic use (optional)
export { updateUsersTable };