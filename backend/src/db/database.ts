import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

// Load .env variables (though they are being ignored for DATABASE_URL)
dotenv.config();

// --- FIX: Define the Supabase URL as the immediate source of truth ---
// We use a clean definition that includes the crucial ?sslmode=disable flag.
const SUPABASE_DB_URL = 'postgresql://postgres:Mahadev@shiva6563@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=disable';

// --- FIX: Force the use of the clean Supabase URL in development ---
// We check if the environment is NOT production. If it's development, use our clean definition.
const dbUrl = process.env.NODE_ENV === 'development' 
    ? SUPABASE_DB_URL
    : process.env.DATABASE_URL || SUPABASE_DB_URL; // Fallback to Supabase URL in production if env var is missing

// --- Debugging output (kept for analysis) ---
console.log('🔧 Database Configuration:');
console.log('DATABASE_URL exists:', !!dbUrl);

// Hide password in logs for security
const safeUrl = dbUrl.replace(/:[^:]*@/, ':****@');
console.log('Database URL:', safeUrl);
// --- End Debugging output ---

let poolConfig: any = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

try {
    const dbConfig = parse(dbUrl);
    
    // Explicitly cast dbConfig.query to string to resolve TS2345 error (if it returns unknown)
    const queryAsString = dbConfig.query as string; 
    const urlParams = new URLSearchParams(queryAsString);
    const sslMode = urlParams.get('sslmode');

    // Determine SSL configuration: True unless explicitly disabled in the connection string
    const sslEnabled = sslMode !== 'disable';
    
    // Use the parsed values from the URL
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host,
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database,
        // Configure SSL based on flag. If enabled, use Supabase setting. If disabled, use false.
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    };
    
    // Log the actual config being used
    console.log(`🔗 Final Database Config - Host: ${poolConfig.host}, Port: ${poolConfig.port}, SSL: ${sslEnabled ? 'Enabled' : 'Disabled'}`);
    
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