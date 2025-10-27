import pg from 'pg';
import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

const { Pool } = pg;

dotenv.config();

// --- FIX 1: Ensure the hardcoded fallback includes the required sslmode=disable ---
const defaultDbUrl = 'postgresql://postgres:Mahadev@shiva6563@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=disable';

const dbUrl = process.env.DATABASE_URL || defaultDbUrl;

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
    
    // FIX 2: Explicitly cast dbConfig.query to string to resolve TS2345 error
    const queryAsString = dbConfig.query as string; 
    const urlParams = new URLSearchParams(queryAsString);
    const sslMode = urlParams.get('sslmode');

    // Determine SSL configuration
    // Supabase requires SSL, but local testing requires it to be disabled.
    // The safest way is to check for the explicit 'disable' flag.
    const sslEnabled = sslMode !== 'disable';
    
    // Use the parsed values from the URL
    poolConfig = {
        ...poolConfig,
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host,
        port: dbConfig.port ? parseInt(dbConfig.port, 10) : 5432,
        database: dbConfig.database,
        // FIX 3: Set SSL based on flag. If enabled, use Supabase setting. If disabled, use false.
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