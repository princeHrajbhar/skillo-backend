// app.js
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import programRoutes from './modules/programs/program.routes.js';
import uploadRoutes from './modules/test/upload.routes.js';
import fileRoutes from './modules/file-upload/file.routes.js';
import blogRoutes from './modules/blog/blog.route.js';
import { globalErrorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from "./modules/auth/auth.route.js";
import blogcategoryRoutes from "../src/modules/blogCategory/blogCategory.route.js";
import userRoutes from '../src/modules/user/user.route.js';
import courseRoutes from '../src/modules/course/course.routes.js';

const app: Application = express();

// ─── CORS Configuration ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api', uploadRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/blogcategory', blogcategoryRoutes);
app.use('/api/v1/users', userRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Skillo Backend is operational',
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(globalErrorHandler);

export default app;