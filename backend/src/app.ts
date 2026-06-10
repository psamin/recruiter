import express from "express";
import cors from "cors";
import { env } from "./config/env";
import candidatesRoutes from "./routes/candidates.routes";
import sheetsRoutes from "./routes/sheets.routes";

// Builds and configures the Express app (kept separate from the server
// bootstrap so it can be imported in tests without binding a port).
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json());

  // Health check.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // API routes.
  app.use("/api/candidates", candidatesRoutes);
  app.use("/api/sheets", sheetsRoutes);

  // 404 fallback.
  app.use((_req, res) => res.status(404).json({ error: "Not found." }));

  return app;
}
