import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { blogController } from "./blog.controller.js";
import {
  validateCreateBlog,
  validateUpdateBlog,
} from "./blog.middleware.js";

const router = Router();

router.post(
  "/",
  upload.fields([
    {
      name: "banner",
      maxCount: 1,
    },
    {
      name: "brochurePdf",
      maxCount: 1,
    },
  ]),
  validateCreateBlog,
  blogController.createBlog
);

router.put(
  "/:id",
  upload.fields([
    {
      name: "banner",
      maxCount: 1,
    },
    {
      name: "brochurePdf",
      maxCount: 1,
    },
  ]),
  validateUpdateBlog,
  blogController.updateBlog
);

router.get("/", blogController.getBlogs);

router.get("/slug/:slug", blogController.getBlogBySlug);

router.get("/:id", blogController.getBlogById);

router.delete("/:id", blogController.deleteBlog);

export default router;