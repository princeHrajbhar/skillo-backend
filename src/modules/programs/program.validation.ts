// program.validation.ts
import { z } from 'zod';

const cloudinaryFileSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

const lessonSchema = z.object({
  title: z.string().min(1),
  duration: z.string().optional(),
});

const moduleSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonSchema).default([]),
});

const instructorSchema = z.object({
  name: z.string().min(1),
  image: cloudinaryFileSchema.optional(),
  bio: z.string().optional(),
});

const programSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).toLowerCase(),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),

  duration: z.string().min(1),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  language: z.string().optional().default('English'),
  mode: z.enum(['Online', 'Offline', 'Hybrid']).optional(),
  certification: z.boolean().optional(),

  price: z.number().min(0),
  discountedPrice: z.number().min(0).optional(),
  currency: z.string().optional(),

  thumbnail: cloudinaryFileSchema.optional(),
  bannerImage: cloudinaryFileSchema.optional(),

  modules: z.array(moduleSchema).optional(),

  skillsYouWillLearn: z.array(z.string()).optional(),
  toolsCovered: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  careerOpportunities: z.array(z.string()).optional(),
  averageSalaryRange: z.string().optional(),

  instructor: instructorSchema,

  placementSupport: z.boolean().optional(),
  internshipIncluded: z.boolean().optional(),
  jobAssistance: z.boolean().optional(),

  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),

  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const createProgramZodSchema = programSchema.superRefine((data, ctx) => {
  if (data.discountedPrice !== undefined && data.discountedPrice > data.price) {
    ctx.addIssue({
      code: 'custom',
      path: ['discountedPrice'],
      message: 'Discounted price cannot exceed price',
    });
  }
});

export const updateProgramZodSchema = programSchema.partial().superRefine((data, ctx) => {
  if (
    data.price !== undefined &&
    data.discountedPrice !== undefined &&
    data.discountedPrice > data.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['discountedPrice'],
      message: 'Discounted price cannot exceed price',
    });
  }
});

export type CreateProgramInput = z.infer<typeof createProgramZodSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramZodSchema>;
