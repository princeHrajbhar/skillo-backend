// course.service.ts
import Course from "./course.model.js";
import {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
} from "../../utils/fileUpload.js";
import { CreateCourseInput, UpdateCourseInput } from "./course.validation.js";

// Define the resource type from the model
interface IResource {
  name: string;
  type: 'pdf' | 'image';
  file: {
    url: string;
    publicId: string;
  };
}

export const createCourseService = async (
  data: CreateCourseInput,
  files: {
    bannerImage?: Express.Multer.File[];
    resources?: Express.Multer.File[];
  }
) => {
  const bannerFile = files?.bannerImage?.[0];
  if (!bannerFile) {
    throw new Error("Banner image is required");
  }

  const bannerImage = await uploadFile(bannerFile, "courses/banners");

  // Initialize resources with proper type
  let resources: IResource[] = [];

  // If we have uploaded resource files
  if (files?.resources?.length) {
    const uploadedResources = await uploadMultipleFiles(
      files.resources,
      "courses/resources"
    );

    // Get resource metadata from the request body
    const resourceMetadata = data.resources || [];

    resources = uploadedResources.map((file, index) => ({
      name: resourceMetadata[index]?.name || 
            files.resources?.[index]?.originalname || 
            `Resource ${index + 1}`,
      type: (resourceMetadata[index]?.type as "pdf" | "image") || "pdf",
      file: {
        url: file.url,
        publicId: file.publicId,
      },
    }));
  }

  // Ensure keywords and urls are arrays
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  const urls = Array.isArray(data.urls) ? data.urls : [];

  // Prepare data for creating course
  const courseData = {
    ...data,
    bannerImage,
    resources,
    keywords,
    urls,
  };

  const course = await Course.create(courseData);
  return course;
};

export const getAllCoursesService = async () => {
  const courses = await Course.find().sort({ createdAt: -1 });
  return courses;
};

export const getCourseBySlugService = async (slug: string) => {
  const course = await Course.findOne({ slug });
  if (!course) {
    throw new Error("Course not found");
  }
  return course;
};

export const getCourseByIdService = async (id: string) => {
  const course = await Course.findById(id);
  if (!course) {
    throw new Error("Course not found");
  }
  return course;
};

export const updateCourseService = async (
  id: string,
  data: UpdateCourseInput,
  files: {
    bannerImage?: Express.Multer.File[];
    resources?: Express.Multer.File[];
  }
) => {
  const existingCourse = await Course.findById(id);
  if (!existingCourse) {
    throw new Error("Course not found");
  }

  let bannerImage = existingCourse.bannerImage;

  // Update banner if new file provided
  if (files?.bannerImage?.[0]) {
    await deleteFile(existingCourse.bannerImage.publicId);
    bannerImage = await uploadFile(files.bannerImage[0], "courses/banners");
  }

  let resources: IResource[] = existingCourse.resources;

  // Update resources if new files provided
  if (files?.resources?.length) {
    // Delete old resources
    for (const resource of existingCourse.resources) {
      await deleteFile(resource.file.publicId);
    }

    // Upload new resources
    const uploadedResources = await uploadMultipleFiles(
      files.resources,
      "courses/resources"
    );

    // Get resource metadata from request body
    const resourceMetadata = data.resources || [];

    resources = uploadedResources.map((file, index) => ({
      name: resourceMetadata[index]?.name || 
            files.resources?.[index]?.originalname || 
            `Resource ${index + 1}`,
      type: (resourceMetadata[index]?.type as "pdf" | "image") || "pdf",
      file: {
        url: file.url,
        publicId: file.publicId,
      },
    }));
  }

  // Ensure keywords and urls are arrays
  const keywords = Array.isArray(data.keywords) ? data.keywords : existingCourse.keywords;
  const urls = Array.isArray(data.urls) ? data.urls : existingCourse.urls;

  // Prepare update data
  const updateData = {
    ...data,
    bannerImage,
    resources,
    keywords,
    urls,
  };

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return updatedCourse;
};

export const deleteCourseService = async (id: string) => {
  const course = await Course.findById(id);
  if (!course) {
    throw new Error("Course not found");
  }

  // Delete banner image
  await deleteFile(course.bannerImage.publicId);

  // Delete all resource files
  for (const resource of course.resources) {
    await deleteFile(resource.file.publicId);
  }

  await Course.findByIdAndDelete(id);
};