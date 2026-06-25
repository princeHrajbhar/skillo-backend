// program.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProgramService } from './program.service.js';
import { createProgramZodSchema, updateProgramZodSchema } from './program.validation.js';
import { deleteFile,uploadFile } from '../../utils/fileUpload.js';


const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedFiles: { type: string; publicId: string }[] = [];

  try {
    // Parse the payload from form-data
    const payload = JSON.parse(req.body.data || req.body.payload || '{}');

    // Validate with Zod
    const validatedData = createProgramZodSchema.parse(payload);

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Upload thumbnail if present
    if (files?.thumbnail?.[0]) {
      const result = await uploadFile(files.thumbnail[0], 'programs/thumbnails');
      validatedData.thumbnail = result;
      uploadedFiles.push({ type: 'thumbnail', publicId: result.publicId });
    }

    // Upload banner image if present
    if (files?.bannerImage?.[0]) {
      const result = await uploadFile(files.bannerImage[0], 'programs/banners');
      validatedData.bannerImage = result;
      uploadedFiles.push({ type: 'bannerImage', publicId: result.publicId });
    }

    // Upload instructor image if present
    if (files?.instructorImage?.[0] && validatedData.instructor) {
      const result = await uploadFile(files.instructorImage[0], 'programs/instructors');
      validatedData.instructor.image = result;
      uploadedFiles.push({ type: 'instructorImage', publicId: result.publicId });
    }

    // Create program in database
    const result = await ProgramService.createProgram(validatedData);

    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: result,
    });
  } catch (error) {
    // If database save fails, delete all uploaded files from Cloudinary
    if (uploadedFiles.length > 0) {
      const deletionPromises = uploadedFiles.map((file) =>
        deleteFile(file.publicId).catch((err) =>
          console.error(`Failed to delete ${file.type} with publicId ${file.publicId}:`, err),
        ),
      );
      await Promise.allSettled(deletionPromises);
    }
    next(error);
  }
};

const getAllPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProgramService.getAllPrograms();

    res.status(200).json({
      success: true,
      message: 'Programs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProgramById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProgramService.getProgramById(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Program retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProgramBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProgramService.getProgramBySlug(req.params.slug as string);

    res.status(200).json({
      success: true,
      message: 'Program retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProgramService.deleteProgram(req.params.id as string);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Program not found',
      });
      return;
    }

    // Delete associated files from Cloudinary
    if (result.thumbnail?.publicId) {
      await deleteFile(result.thumbnail.publicId).catch((err) =>
        console.error(`Failed to delete thumbnail:`, err),
      );
    }
    if (result.bannerImage?.publicId) {
      await deleteFile(result.bannerImage.publicId).catch((err) =>
        console.error(`Failed to delete bannerImage:`, err),
      );
    }
    if (result.instructor?.image?.publicId) {
      await deleteFile(result.instructor.image.publicId).catch((err) =>
        console.error(`Failed to delete instructor image:`, err),
      );
    }

    res.status(200).json({
      success: true,
      message: 'Program deleted successfully',
      id: result._id,
    });
  } catch (error) {
    next(error);
  }
};

const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedFiles: { type: string; publicId: string }[] = [];
  let oldFiles: { type: string; publicId: string }[] = [];

  try {
    const programId = req.params.id as string;

    // Get existing program to check for old files
    const existingProgram = await ProgramService.getProgramById(programId);
    if (!existingProgram) {
      res.status(404).json({
        success: false,
        message: 'Program not found',
      });
      return;
    }

    // Parse the payload from form-data
    const payload = JSON.parse(req.body.data || req.body.payload || '{}');

    // Validate with Zod
    const validatedData = updateProgramZodSchema.parse(payload);

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Upload thumbnail if present
    if (files?.thumbnail?.[0]) {
      // Store old file info for deletion
      if (existingProgram.thumbnail?.publicId) {
        oldFiles.push({ type: 'thumbnail', publicId: existingProgram.thumbnail.publicId });
      }

      const result = await uploadFile(files.thumbnail[0], 'programs/thumbnails');
      validatedData.thumbnail = result;
      uploadedFiles.push({ type: 'thumbnail', publicId: result.publicId });
    }

    // Upload banner image if present
    if (files?.bannerImage?.[0]) {
      if (existingProgram.bannerImage?.publicId) {
        oldFiles.push({ type: 'bannerImage', publicId: existingProgram.bannerImage.publicId });
      }

      const result = await uploadFile(files.bannerImage[0], 'programs/banners');
      validatedData.bannerImage = result;
      uploadedFiles.push({ type: 'bannerImage', publicId: result.publicId });
    }

    // Upload instructor image if present
    if (files?.instructorImage?.[0] && validatedData.instructor) {
      if (existingProgram.instructor?.image?.publicId) {
        oldFiles.push({
          type: 'instructorImage',
          publicId: existingProgram.instructor.image.publicId,
        });
      }

      const result = await uploadFile(files.instructorImage[0], 'programs/instructors');
      validatedData.instructor = {
        ...existingProgram.instructor,
        ...validatedData.instructor,
        image: result,
      };
      uploadedFiles.push({ type: 'instructorImage', publicId: result.publicId });
    }

    // If instructor data is updated without image
    if (validatedData.instructor && !files?.instructorImage?.[0]) {
      validatedData.instructor = {
        ...existingProgram.instructor,
        ...validatedData.instructor,
      };
    }

    // Update program in database
    const result = await ProgramService.updateProgram(programId, validatedData);

    // If database update successful, delete old files from Cloudinary
    if (result && oldFiles.length > 0) {
      const deletionPromises = oldFiles.map((file) =>
        deleteFile(file.publicId).catch((err) =>
          console.error(`Failed to delete old ${file.type} with publicId ${file.publicId}:`, err),
        ),
      );
      await Promise.allSettled(deletionPromises);
    }

    res.status(200).json({
      success: true,
      message: 'Program updated successfully',
      data: result,
    });
  } catch (error: any) {
    // If database update fails, delete newly uploaded files
    if (uploadedFiles.length > 0) {
      const deletionPromises = uploadedFiles.map((file) =>
        deleteFile(file.publicId).catch((err) =>
          console.error(
            `Failed to delete newly uploaded ${file.type} with publicId ${file.publicId}:`,
            err,
          ),
        ),
      );
      await Promise.allSettled(deletionPromises);
    }

    if (error?.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: error.issues?.[0]?.message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to update program',
    });
  }
};

export const ProgramController = {
  createProgram,
  getAllPrograms,
  getProgramById,
  getProgramBySlug,
  deleteProgram,
  updateProgram,
};
