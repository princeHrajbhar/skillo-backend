import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const contentSectionSchema = z.object({
  htmlContent: z.string().min(1),
});

export const createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),

  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),

  keywords: z.array(z.string()).optional().default([]),

  urls: z.array(z.string()).optional().default([]),

  contentSections: z
    .array(contentSectionSchema)
    .optional()
    .default([]),

  faqs: z.array(faqSchema).optional().default([]),

  blogCategory: z.string().min(1),

  postedBy: z.string().min(1),

  postingDate: z.string().optional(),

  status: z.enum(["draft", "published"]),
});

export const updateBlogSchema = createBlogSchema.partial();

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;