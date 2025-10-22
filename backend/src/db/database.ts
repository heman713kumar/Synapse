// C:\Users\hemant\Downloads\synapse\backend\src\db\database.ts
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string'; // Import the parser

dotenv.config();

// Parse the connection string from environment variables
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set!");
}
const dbConfig = parse(dbUrl); // Use the parser

// Explicitly define Pool configuration options
const poolConfig: PoolConfig = {
    user: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.host || '', // Extract host from URL
    port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432, // Extract port
    database: dbConfig.database || '', // Extract database name
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // FIX: Add ts-ignore to bypass strict type check for 'family'
    // @ts-ignore
    family: 4, // Force IPv4
};

// Create the pool with the explicit config
export const pool = new Pool(poolConfig);

// Test database connection
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

// Query helper with timing and error handling
export const query = async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> => {
    try {
        const start = Date.now();
        const res = await pool.query<T>(text, params);
        const duration = Date.now() - start;
        console.log(`📊 Executed query in ${duration}ms: ${text}`);
        return res;
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
};