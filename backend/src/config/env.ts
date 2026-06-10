import "dotenv/config";

// Centralized environment configuration for the backend.
// Loaded once at startup; everything else imports from here.
export const env = {
  port: Number(process.env.PORT) || 4000,
  // Comma-separated list of allowed CORS origins (the frontend dev URL).
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV || "development",
};
