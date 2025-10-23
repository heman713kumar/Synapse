// C:\Users\hemant\Downloads\synapse\backend\src\db\updateUsersTable.ts
import { pool } from './database.js';

const updateUsersTable = async () => {
  // ... (update logic remains the same) ...
  try {
    console.log('🔄 Updating users table...');
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);
    console.log('✅ Users table updated successfully!');
  } catch (error) {
    console.error('❌ Error updating users table:', error);
    throw error; // Rethrow
  }
};

// Call update directly - intended to be run as a script
updateUsersTable()
    .then(async () => {
        console.log('🎉 Users table update completed!');
        await pool.end().catch((err: any) => console.error("Error ending pool:", err));
        if (process.env.NODE_ENV !== 'test') process.exit(0);
    })
    .catch(async error => {
        console.error('💥 Users table update failed:', error);
        await pool.end().catch((err: any) => console.error("Error ending pool:", err));
        if (process.env.NODE_ENV !== 'test') process.exit(1);
    });


// Export for potential programmatic use (optional)
export { updateUsersTable };