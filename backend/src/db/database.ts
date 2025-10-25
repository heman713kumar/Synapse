// C:\Users\hemant\Downloads\synapse\backend\src\db\database.ts
import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

dotenv.config();

// Parse the connection string
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.warn("⚠️ DATABASE_URL environment variable is not set!");
    // Don't throw error, allow server to start without database
}

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout
};

if (dbUrl) {
    const dbConfig = parse(dbUrl);
    
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host || 'localhost',
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
    
    // Force IPv4 by using the host IP directly if it's a hostname
    if (poolConfig.host && !poolConfig.host.includes('.')) {
        // If it's not an IP address, try to resolve it
        console.log(`Using host: ${poolConfig.host} - if connection fails, check if IPv6 is enabled on your database`);
    }
}

// Export the pool instance
export const pool = new Pool(poolConfig);

// Export the testConnection function
export const testConnection = async (): Promise<boolean> => {
  if (!dbUrl) {
    console.log('⚠️ No DATABASE_URL set, skipping database connection');
    return false;
  }
  
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

// Export the query function
export const query = async (text: string, params?: any[]) => {
  if (!dbUrl) {
    throw new Error('Database not configured');
  }
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query in ${duration}ms: ${text.substring(0, 100)}...`);
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};