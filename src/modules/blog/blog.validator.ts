// recorded-course\skillo-backend\src\modules\blog\blog.validator.ts
import { z } from "zod";

// FAQ Validation
export const FAQSchema = z.object({
  question: z.string().min(1, "Question is required").trim(),
  answer: z.string().min(1, "Answer is required").trim(),
});

// Social Media Link Validation
export const SocialMediaLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required").trim(),
  url: z.string().url("Invalid URL format").trim(),
});

// Resource Link Validation
export const ResourceLinkSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  url: z.string().url("Invalid URL format").trim(),
});

// Create Blog Validation
export const createBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long").trim(),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, and hyphens only)")
    .trim(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  category: z.string().min(1, "Category is required").trim(),
  keyword: z.array(z.string().trim()).default([]),
  postingDate: z.string().datetime().optional(),
  postedBy: z.string().min(1, "PostedBy is required").trim(),
  socialMediaLinks: z.array(SocialMediaLinkSchema).default([]),
  resourceLinks: z.array(ResourceLinkSchema).default([]),
  faq: z.array(FAQSchema).default([]),
  seoTitle: z.string().trim().default(""),
  seoDescription: z.string().trim().default(""),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: z.enum(["draft", "published"]).default("draft"),
});

// Update Blog Validation
export const updateBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long").trim().optional(),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase, numbers, and hyphens only)")
    .trim()
    .optional(),
  description: z.string().min(10, "Description must be at least 10 characters").trim().optional(),
  category: z.string().min(1, "Category is required").trim().optional(),
  keyword: z.array(z.string().trim()).optional(),
  postingDate: z.string().datetime().optional(),
  postedBy: z.string().min(1, "PostedBy is required").trim().optional(),
  socialMediaLinks: z.array(SocialMediaLinkSchema).optional(),
  resourceLinks: z.array(ResourceLinkSchema).optional(),
  faq: z.array(FAQSchema).optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  content: z.string().min(10, "Content must be at least 10 characters").optional(),
  status: z.enum(["draft", "published"]).optional(),
});

// Get Blog by ID Validation
export const getBlogSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid blog ID"),
});

// Delete Blog Validation
export const deleteBlogSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid blog ID"),
});

// Get Blogs Query Validation
export const getBlogsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(["draft", "published"]).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "postingDate", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Params with ID validation
export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid blog ID"),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type GetBlogInput = z.infer<typeof getBlogSchema>;
export type DeleteBlogInput = z.infer<typeof deleteBlogSchema>;
export type GetBlogsInput = z.infer<typeof getBlogsSchema>;
export type IdParam = z.infer<typeof idParamSchema>;