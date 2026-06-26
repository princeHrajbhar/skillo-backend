import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import programRoutes from './modules/programs/program.routes.js';
import uploadRoutes from './modules/test/upload.routes.js';
import fileRoutes from './modules/file-upload/file.routes.js';
import blogRoutes from './modules/blog/blog.route.js';
import { globalErrorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from "./modules/auth/auth.route.js";
import blogcategoryRoutes from "../src/modules/blogCategory/blogCategory.route.js"
import userRoutes from '../src/modules/user/user.route.js'


const app: Application = express();

// ✅ ONLY ONE CORS (correct one)
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(cookieParser()); // ✅ MUST ADD
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Body Parsers
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/programs', programRoutes);
app.use('/api', uploadRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/blogcategory', blogcategoryRoutes);
app.use('/api/v1/user', userRoutes)

/**
 * Health Check
 */
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Skillo Backend is operational',
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

app.use(globalErrorHandler);

export default app;





