import { Router, Request, Response } from 'express';
import { upload } from '../../middleware/upload.js';
import { uploadFile, deleteFile } from '../../utils/fileUpload.js';
import { FileModel } from './file.model.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * Upload File (Admin Only)
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required',
        });
      }

      const uploaded = await uploadFile(req.file, 'uploads');

      const file = await FileModel.create({
        originalName: uploaded.originalFilename,
        url: uploaded.url,
        publicId: uploaded.publicId,

        mimeType: req.file.mimetype,
        size: uploaded.bytes,

        folder: 'uploads',

        resourceType: uploaded.resourceType,
        format: uploaded.format,

        width: uploaded.width,
        height: uploaded.height,

        duration: uploaded.duration,
        pages: uploaded.pages,

        uploadedAt: new Date(uploaded.createdAt),
      });

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: file,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * Get All Files (Public)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const files = await FileModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get Single File (Public)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const file = await FileModel.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Update File (Admin Only)
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const existing = await FileModel.findById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required',
        });
      }

      await deleteFile(existing.publicId);

      const uploaded = await uploadFile(req.file, 'uploads');

      existing.originalName = uploaded.originalFilename;
      existing.url = uploaded.url;
      existing.publicId = uploaded.publicId;

      existing.mimeType = req.file.mimetype;
      existing.size = uploaded.bytes;

      existing.folder = 'uploads';

      existing.resourceType = uploaded.resourceType;
      existing.format = uploaded.format;

      existing.width = uploaded.width;
      existing.height = uploaded.height;

      existing.duration = uploaded.duration;
      existing.pages = uploaded.pages;

      existing.uploadedAt = new Date(uploaded.createdAt);

      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'File updated successfully',
        data: existing,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * Delete File (Admin Only)
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      const file = await FileModel.findById(req.params.id);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
        });
      }

      await deleteFile(file.publicId);

      await file.deleteOne();

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;