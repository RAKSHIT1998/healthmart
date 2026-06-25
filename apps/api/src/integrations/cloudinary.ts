import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/** Uploads a base64 data-URI or remote URL buffer to Cloudinary under the given folder. */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  mimeType = 'image/jpeg',
): Promise<UploadResult> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in .env.',
    );
  }

  const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: `medicare-medical-store/${folder}`,
      resource_type: 'image',
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    logger.error({ err }, 'Cloudinary upload failed');
    throw err;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
