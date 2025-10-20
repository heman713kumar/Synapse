// C:\Users\hemant\Downloads\synapse\backend\src\db\database.ts
import { Pool, QueryResult, QueryResultRow } from 'pg'; // Import QueryResultRow
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  // ... (implementation remains the same) ...
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};


// Query helper with timing and error handling
// FIX: Add 'extends QueryResultRow' constraint to T
export const query = async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> => {
  try {
    const start = Date.now();
    // Pass the generic type T to pool.query
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query in ${duration}ms: ${text}`);
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};