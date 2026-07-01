import { Router } from "express";
import multer from "multer";
import blogController from "./blog.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// ==================== PUBLIC ROUTES ====================

// Get all blogs
router.get("/", blogController.getBlogs);

// Get blog statistics
router.get("/stats", blogController.getBlogStats);

// Get blog by slug
router.get("/slug/:slug", blogController.getBlogBySlug);

// Get blog by ID
router.get("/:id", blogController.getBlogById);

// ==================== ADMIN ROUTES ====================

// Create Blog
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "resources", maxCount: 10 },
  ]),
  blogController.createBlog
);

// Update Blog
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "resources", maxCount: 10 },
  ]),
  blogController.updateBlog
);

// Delete Blog
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  blogController.deleteBlog
);

// Bulk Delete Blogs
router.post(
  "/bulk-delete",
  protect,
  authorize("admin"),
  blogController.deleteMultipleBlogs
);

// Update Blog Status
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  blogController.updateBlogStatus
);

export default router;