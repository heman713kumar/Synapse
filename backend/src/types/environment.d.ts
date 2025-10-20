// C:\Users\hemant\Downloads\synapse\backend\src\types\environment.d.ts

// Keep the NodeJS ProcessEnv interface
declare namespace NodeJS {
  interface ProcessEnv {
    // ... (keep existing env variables) ...
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string; // Make PORT optional as it has a default
    CORS_ORIGIN?: string; // Optional
    DATABASE_URL: string;
    REDIS_URL?: string; // Optional
    JWT_SECRET: string;
    JWT_EXPRES_IN?: string; // Optional
    R2_ACCOUNT_ID?: string; // Optional
    R2_ACCESS_KEY_ID?: string; // Optional
    R2_SECRET_ACCESS_KEY?: string; // Optional
    R2_BUCKET_NAME?: string; // Optional
    GEMINI_API_KEY?: string; // Optional
    GEMINI_MODEL?: string; // Optional
  }
}

// --- Add Express Request augmentation here ---
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        // Add other fields from your JWT payload if needed
        iat?: number;
        exp?: number;
      };
    }
  }
}

// Keep your interface definitions (User, Idea, ChatMessage)
// Make sure they align with your actual DB schema from migrate.ts
export interface User {
    // ...
}
export interface Idea {
    // ...
}
// ... other interfaces ...

// Add this export {}; to ensure it's treated as a module
export {};