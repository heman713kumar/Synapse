// C:\Users\hemant\Downloads\synapse\backend\src\types\environment.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    CORS_ORIGIN?: string;
    
    // Database
    DATABASE_URL: string;
    REDIS_URL?: string;
    
    // Authentication
    JWT_SECRET: string;
    JWT_EXPIRES_IN?: string; // ✅ FIXED TYPO (was JWT_EXPRES_IN)
    
    // File Storage (R2)
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_DOMAIN?: string;
    
    // AI Services
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    GEMINI_TEMPERATURE?: string;
    GEMINI_TOP_K?: string;
    GEMINI_TOP_P?: string;
    AI_REQUEST_TIMEOUT?: string; // Suggested for AI service timeouts
    
    // Uploads
    UPLOAD_MAX_FILE_SIZE?: string;
    UPLOAD_ALLOWED_MIMES?: string;
  }
}

// Ensure it is treated as a module, but no other global types are defined here
export {};