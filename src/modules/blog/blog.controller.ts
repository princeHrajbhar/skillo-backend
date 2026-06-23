import { Request, Response } from "express";
import { blogService } from "./blog.service.js";

export class BlogController {
  createBlog = async (req: Request, res: Response) => {
    try {
      const blog = await blogService.createBlog(
        req.body,
        req.files as any
      );

      return res.status(201).json({
        success: true,
        data: blog,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateBlog = async (req: Request, res: Response) => {
    try {
      const blog = await blogService.updateBlog(
        String(req.params.id),
        req.body,
        req.files as any
      );

      return res.json({
        success: true,
        data: blog,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  getBlogs = async (req: Request, res: Response) => {
    try {
      const blogs = await blogService.getBlogs(req.query);

      return res.json({
        success: true,
        data: blogs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  getBlogById = async (req: Request, res: Response) => {
    try {
      const blog = await blogService.getBlogById(
        String(req.params.id)
      );

      return res.json({
        success: true,
        data: blog,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  getBlogBySlug = async (req: Request, res: Response) => {
    try {
      const blog = await blogService.getBlogBySlug(
        String(req.params.slug)
      );

      return res.json({
        success: true,
        data: blog,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteBlog = async (req: Request, res: Response) => {
    try {
      await blogService.deleteBlog(
        String(req.params.id)
      );

      return res.json({
        success: true,
        message: "Blog deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}

export const blogController = new BlogController();