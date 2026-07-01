import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "./course.controller.js";



const router = Router();

// Public Routes
router.get("/", getAllCourses);
router.get("/slug/:slug", getCourseBySlug);
router.get("/:id", getCourseById);

// Admin Routes
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "resources", maxCount: 20 },
  ]),
  createCourse
);

router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "resources", maxCount: 20 },
  ]),
  updateCourse
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCourse
);

export default router;