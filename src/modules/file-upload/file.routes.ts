import { Router, Request, Response } from 'express';
import { upload } from '../../middleware/upload.js';
import { uploadFile, deleteFile } from '../../utils/fileUpload.js';

import { FileModel } from './file.model.js';

const router = Router();

/**
 * Upload File
 * POST /api/files
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    const uploaded = await uploadFile(req.file, 'uploads');

    const file = await FileModel.create({
      originalName: req.file.originalname,
      url: uploaded.url,
      publicId: uploaded.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      folder: 'uploads',
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
});

/**
 * Get All Files
 * GET /api/files
 */
router.get('/', async (_req, res) => {
  try {
    const files = await FileModel.find().sort({
      createdAt: -1,
    });

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
 * Get Single File
 * GET /api/files/:id
 */
router.get('/:id', async (req, res) => {
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
 * Update File
 * PUT /api/files/:id
 */
router.put('/:id', upload.single('file'), async (req, res) => {
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

    existing.originalName = req.file.originalname;
    existing.url = uploaded.url;
    existing.publicId = uploaded.publicId;
    existing.mimeType = req.file.mimetype;
    existing.size = req.file.size;

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
});

/**
 * Delete File
 * DELETE /api/files/:id
 */
router.delete('/:id', async (req, res) => {
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
});

export default router;
