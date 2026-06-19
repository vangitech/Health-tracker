import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('FATAL: Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    if (!req?.user?.id) {
      throw new Error('Authentication required for avatar upload');
    }
    return {
      folder: 'sugarcare/avatars',
      allowed_formats: ALLOWED_FORMATS,
      transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      public_id: `user-${req.user.id}-${Date.now()}`,
    };
  },
});

function extractPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(p => p === 'upload');
  if (uploadIndex === -1) return null;
  const publicIdWithVersion = parts.slice(uploadIndex + 2).join('/');
  return publicIdWithVersion.replace(/\.[^.]+$/, '');
}

async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn('Failed to delete old Cloudinary image:', error.message);
  }
}

export { cloudinary, avatarStorage, extractPublicId, deleteImage, ALLOWED_FORMATS, MAX_FILE_SIZE };
