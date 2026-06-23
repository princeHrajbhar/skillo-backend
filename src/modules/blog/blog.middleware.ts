import { Request, Response, NextFunction } from "express";
import { createBlogSchema, updateBlogSchema } from "./blog.validator.js";

export const validateCreateBlog = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body;

    req.body = createBlogSchema.parse(body);

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.errors || error.message,
    });
  }
};

export const validateUpdateBlog = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body;

    req.body = updateBlogSchema.parse(body);

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.errors || error.message,
    });
  }
};