import express, { Application, Request, Response } from "express";
import cors from "cors";

import programRoutes from "./modules/programs/program.routes.js";
import uploadRoutes from "./modules/test/upload.routes.js";
import fileRoutes from "./modules/file-upload/file.routes.js";

export const app: Application = express();

/**
 * ✅ CORS - allow all origins
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * Middlewares
 */
app.use(express.json());

/**
 * Routes
 */
app.use("/api/v1/programs", programRoutes);
app.use("/api", uploadRoutes);
app.use("/api/files", fileRoutes);

/**
 * Health check
 */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Skillo Backend is operational",
  });
});