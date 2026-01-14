// C:\Users\hemant\Downloads\synapse\backend\src\types\express.d.ts

declare global {
  namespace Express {
    // Augment the existing Request interface
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

export {};