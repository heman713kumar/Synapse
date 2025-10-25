import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

dotenv.config();

// Parse the connection string
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.warn("⚠️ DATABASE_URL environment variable is not set!");
}

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

if (dbUrl) {
    try {
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

        console.log(`🔗 Database config: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        
    } catch (parseError) {
        console.error('❌ Failed to parse DATABASE_URL:', parseError);
    }
} else {
    console.log('🚫 Running without database - DATABASE_URL not set');
}

// Export the pool instance
export const pool = new Pool(poolConfig);

// Export the testConnection function
export const testConnection = async (): Promise<boolean> => {
  if (!dbUrl) {
    console.log('⚠️ No DATABASE_URL set, skipping database connection');
    return false;
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`📊 Database time: ${result.rows[0].current_time}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    
    // More specific error handling
    if (error.code === 'ENETUNREACH') {
        console.error('🌐 Network unreachable - check database host/port');
    } else if (error.code === 'ECONNREFUSED') {
        console.error('🚫 Connection refused - database may not be running');
    } else if (error.code === 'ETIMEDOUT') {
        console.error('⏰ Connection timeout - check network/firewall');
    }
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Export the query function with better error handling
export const query = async (text: string, params?: any[]) => {
  if (!dbUrl) {
    throw new Error('Database not configured - DATABASE_URL environment variable is required');
  }
  
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