// modules/course/course.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  createCourseInputSchema,
  updateCourseSchema,
  courseParamsSchema,
  courseSlugSchema,
} from "./course.validation.js";
import {
  createCourseService,
  getAllCoursesService,
  getCourseBySlugService,
  getCourseByIdService,
  updateCourseService,
  deleteCourseService,
} from "./course.service.js";

// Helper function to safely convert to array
const toArray = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('📦 Create course request body:', req.body);
    console.log('📁 Files:', req.files);

    // Parse body for FormData
    const body = createCourseInputSchema.parse(req.body);

    const files = req.files as {
      bannerImage?: Express.Multer.File[];
      resources?: Express.Multer.File[];
    };

    // Transform keywords and urls to arrays using helper function
    const transformedBody = {
      ...body,
      keywords: toArray(body.keywords),
      urls: toArray(body.urls),
    };

    const course = await createCourseService(transformedBody, files);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error('❌ Create course error:', error);
    next(error);
  }
};

export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await getAllCoursesService();
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = courseSlugSchema.parse(req.params);
    const course = await getCourseBySlugService(slug);
    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = courseParamsSchema.parse(req.params);
    const course = await getCourseByIdService(id);
    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔄 Update course request params:', req.params);
    console.log('📦 Update course body:', req.body);
    console.log('📁 Update files:', req.files);

    const { id } = courseParamsSchema.parse(req.params);
    
    // Parse body - allow partial updates
    const body = updateCourseSchema.parse(req.body);

    const files = req.files as {
      bannerImage?: Express.Multer.File[];
      resources?: Express.Multer.File[];
    };

    // Transform keywords and urls to arrays using helper function
    const transformedBody = {
      ...body,
      keywords: body.keywords !== undefined ? toArray(body.keywords) : undefined,
      urls: body.urls !== undefined ? toArray(body.urls) : undefined,
    };

    const course = await updateCourseService(id, transformedBody, files);

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error('❌ Update course error:', error);
    next(error);
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = courseParamsSchema.parse(req.params);
    await deleteCourseService(id);
    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};