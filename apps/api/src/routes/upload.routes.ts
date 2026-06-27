import { Router } from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/ApiError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(ApiError.badRequest('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

router.post('/single', upload.single('file'), uploadController.uploadSingle);
router.post('/multiple', upload.array('files', 5), uploadController.uploadMultiple);

export default router;
