import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { uploadToCloudinary } from '../integrations/cloudinary';

export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest('No file uploaded');
  const folder = (req.query.folder as string) || 'misc';
  const result = await uploadToCloudinary(file.buffer, folder, file.mimetype);
  sendSuccess(res, result, 'File uploaded', 201);
});

export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) throw ApiError.badRequest('No files uploaded');
  const folder = (req.query.folder as string) || 'misc';
  const results = await Promise.all(files.map((file) => uploadToCloudinary(file.buffer, folder, file.mimetype)));
  sendSuccess(res, results, 'Files uploaded', 201);
});
