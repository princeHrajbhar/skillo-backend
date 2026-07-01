// modules/course/course.validation.ts
import { z } from 'zod';

// Helper for optional string arrays
const optionalStringArray = () =>
  z
    .union([
      z.string().transform((val) => (val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [])),
      z.array(z.string()),
      z.undefined(),
    ])
    .optional();

// Helper for required string arrays
const stringArray = () =>
  z
    .union([
      z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
      z.array(z.string()),
    ])
    .default([]);

export const createCourseInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  shortDescription: z.string().min(1, 'Short description is required'),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  discountedPrice: z.coerce.number().min(0).optional().default(0),
  currency: z.string().default('INR'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: stringArray(),
  status: z.enum(['upcoming', 'active', 'ended']).default('upcoming'),
  urls: optionalStringArray(),
  cms: z.string().optional(),
  faqs: z
    .union([
      z.string().transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }),
      z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })),
      z.undefined(),
    ])
    .optional()
    .default([]),
  resources: z
    .union([
      z.string().transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }),
      z.array(z.object({
        name: z.string(),
        type: z.enum(['pdf', 'image']),
      })),
      z.undefined(),
    ])
    .optional()
    .default([]),
});

export const updateCourseSchema = createCourseInputSchema.partial();

export const courseParamsSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
});

export const courseSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;