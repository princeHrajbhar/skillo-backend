import { Router } from "express";
import { blogCategoryController } from "./blogCategory.controller.js";

const router = Router();

router.post(
  "/",
  blogCategoryController.create
);

router.get(
  "/",
  blogCategoryController.getAll
);

router.get(
  "/slug/:slug",
  blogCategoryController.getBySlug
);

router.get(
  "/:id",
  blogCategoryController.getById
);

router.put(
  "/:id",
  blogCategoryController.update
);

router.delete(
  "/:id",
  blogCategoryController.delete
);

export default router;