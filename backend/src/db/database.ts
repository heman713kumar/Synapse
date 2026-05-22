import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

// Load environment variables from .env file
dotenv.config();

// CRITICAL: Read database URL from environment variable only
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ FATAL ERROR: DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in .env file');
    console.error('Example: postgresql://username:password@host:port/database?sslmode=require');
    process.exit(1);
}

// Security: Hide password in logs
const safeUrl = dbUrl.replace(/:[^:]*@/, ':****@');
console.log('🔧 Database Configuration:');
console.log('Connected to:', safeUrl);

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

try {
    const dbConfig = parse(dbUrl);
    
    // Determine SSL mode from URL or use secure default
    const urlParams = new URLSearchParams((dbConfig.query as string) || '');
    const sslMode = urlParams.get('sslmode');
    const sslEnabled = sslMode !== 'disable';
    
    // Use the parsed values from the URL
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host,
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database,
        // Force SSL in production, allow flexible SSL in development
        ssl: process.env.NODE_ENV === 'production' 
            ? { rejectUnauthorized: true }
            : sslEnabled 
                ? { rejectUnauthorized: false }
                : false,
    };
    
    // Log the actual config being used
    const sslStatus = process.env.NODE_ENV === 'production' 
        ? 'SSL Enabled (Production - Strict)'
        : sslEnabled 
            ? 'SSL Enabled'
            : 'SSL Disabled';
    console.log(`🔗 Final Database Config - Host: ${poolConfig.host}, Port: ${poolConfig.port}, ${sslStatus}`);
    
} catch (parseError) {
    console.error('❌ Failed to parse DATABASE_URL:', parseError);
    process.exit(1);
}

// Export the pool instance
export const pool = new Pool(poolConfig);

// Export the testConnection function
export const testConnection = async (): Promise<boolean> => {
  let client;
  try {
    console.log('🔄 Attempting database connection...');
    client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`📊 Database time: ${result.rows[0].current_time}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error address:', error.address);
    console.error('Error port:', error.port);
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Export the query function
export const query = async (text: string, params?: any[]) => {
  let client;
  try {
    client = await pool.connect();
    const start = Date.now();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query in ${duration}ms: ${text.substring(0, 100)}...`);
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};