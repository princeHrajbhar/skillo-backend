import { Router } from 'express';
import { testUpload } from './upload.controller.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.post('/test-upload', upload.single('image'), testUpload);

export default router;
