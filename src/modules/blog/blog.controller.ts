// recorded-course\skillo-backend\src\modules\blog\blog.controller.ts
import { Request, Response, NextFunction } from "express";
import blogService from "./blog.service.js";
import {
  createBlogSchema,
  updateBlogSchema,
  getBlogsSchema,
  idParamSchema,
} from "./blog.validator.js";

class BlogController {
  async createBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createBlogSchema.parse(req.body);

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bannerFile = files?.banner?.[0];
      const resourceFiles = files?.resources || [];

      const blog = await blogService.createBlog(
        validatedData,
        bannerFile,
        resourceFiles
      );

      res.status(201).json({
        success: true,
        message: "Blog created successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getBlogsSchema.parse(req.query);
      const result = await blogService.getBlogs(validatedQuery);

      res.status(200).json({
        success: true,
        message: "Blogs fetched successfully",
        data: result.blogs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogById(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = idParamSchema.parse(req.params);
      const blog = await blogService.getBlogById(validatedParams.id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Blog fetched successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Slug is required",
        });
      }

      const blog = await blogService.getBlogBySlug(String(slug));

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Blog fetched successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = idParamSchema.parse(req.params);
      const validatedData = updateBlogSchema.parse(req.body);

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bannerFile = files?.banner?.[0];
      const resourceFiles = files?.resources || [];

      const blog = await blogService.updateBlog(
        validatedParams.id,
        validatedData,
        bannerFile,
        resourceFiles
      );

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Blog updated successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = idParamSchema.parse(req.params);
      const blog = await blogService.deleteBlog(validatedParams.id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Blog deleted successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMultipleBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "IDs array is required",
        });
      }

      const result = await blogService.deleteMultipleBlogs(ids);

      res.status(200).json({
        success: true,
        message: "Blogs deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBlogStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedParams = idParamSchema.parse(req.params);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      if (!["draft", "published"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'draft' or 'published'",
        });
      }

      const blog = await blogService.updateBlogStatus(validatedParams.id, status);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Blog status updated successfully",
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await blogService.getBlogStats();

      res.status(200).json({
        success: true,
        message: "Blog statistics fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BlogController();