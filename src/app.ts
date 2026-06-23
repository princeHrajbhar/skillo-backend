import express, { Application, Request, Response } from "express";
import cors from "cors";

import programRoutes from "./modules/programs/program.routes.js";
import uploadRoutes from "./modules/test/upload.routes.js";
import fileRoutes from "./modules/file-upload/file.routes.js";
import blogRoutes from "./modules/blog/blog.route.js";

export const app: Application = express();

/**
 * CORS
 */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/**
 * Body Parsers
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */
app.use("/api/v1/programs", programRoutes);
app.use("/api", uploadRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/v1/blogs", blogRoutes);

/**
 * Health Check
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Skillo Backend is operational",
  });
});

/**
 * 404 Handler
 * Express 5 compatible
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});