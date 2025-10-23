// C:\Users\hemant\Downloads\synapse\backend\src\db\database.ts
import pg from 'pg'; // Use import
import dotenv from 'dotenv'; // Use import
import { parse } from 'pg-connection-string'; // Use import

const { Pool } = pg; // Destructure Pool from the imported pg object

dotenv.config();

// Parse the connection string
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set!");
}
const dbConfig = parse(dbUrl);

// Explicitly define Pool configuration
const poolConfig = {
    user: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.host || '',
    port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
    database: dbConfig.database || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // @ts-ignore - Keep this if needed, but the type might resolve with NodeNext
    family: 4, // Force IPv4
};

// Export the pool instance
export const pool = new Pool(poolConfig);

// Export the testConnection function
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully (using IPv4 preferred)');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Export the query function
export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query in ${duration}ms: ${text.substring(0, 100)}...`); // Log only start of long queries
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Remove module.exports
// module.exports = { pool, testConnection, query };