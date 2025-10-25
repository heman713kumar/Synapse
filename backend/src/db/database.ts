import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

dotenv.config();

// Parse the connection string
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:Mahadev@shiva6563@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres';

console.log('🔧 Database Configuration:');
console.log('DATABASE_URL exists:', !!dbUrl);

// Hide password in logs for security
const safeUrl = dbUrl.replace(/:[^:]*@/, ':****@');
console.log('Database URL:', safeUrl);

try {
    const dbConfig = parse(dbUrl);
    console.log('Database Host:', dbConfig.host);
    console.log('Database Port:', dbConfig.port);
    console.log('Database Name:', dbConfig.database);
    console.log('Database User:', dbConfig.user);
} catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error);
}

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

try {
    const dbConfig = parse(dbUrl);
    
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host || 'localhost',
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database || 'postgres',
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    };

    console.log(`🔗 Final Database Config - Host: ${poolConfig.host}, Port: ${poolConfig.port}`);
    
} catch (parseError) {
    console.error('❌ Failed to parse DATABASE_URL:', parseError);
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