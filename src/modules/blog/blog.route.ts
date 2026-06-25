// recorded-course\skillo-backend\src\modules\blog\blog.route.ts
import { Router } from "express";
import multer from "multer";
import blogController from "./blog.controller.js";

const router = Router();

// Multer configuration - just memory storage, no file filter needed
// File validation and upload handled by fileUpload utility
const upload = multer({ storage: multer.memoryStorage() });

// ==================== PUBLIC ROUTES ====================
router.get("/", blogController.getBlogs);
router.get("/stats", blogController.getBlogStats);
router.get("/slug/:slug", blogController.getBlogBySlug);
router.get("/:id", blogController.getBlogById);

// ==================== CREATE BLOG ====================
router.post(
  "/",
  upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'resources', maxCount: 10 }
  ]),
  blogController.createBlog
);

// ==================== UPDATE BLOG ====================
router.put(
  "/:id",
  upload.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'resources', maxCount: 10 }
  ]),
  blogController.updateBlog
);

// ==================== DELETE BLOG ====================
router.delete("/:id", blogController.deleteBlog);

// ==================== BULK DELETE ====================
router.post("/bulk-delete", blogController.deleteMultipleBlogs);

// ==================== UPDATE STATUS ====================
router.patch("/:id/status", blogController.updateBlogStatus);

export default router;