import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';
import { logError } from '../logs/logger.js';

// Configuration
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Generates an authenticated, expiring URL for a private cloud resource.
 * Default expiry: 1 hour (3600 seconds).
 */
export const getSignedUrl = (publicId, resourceType = 'video') => {
  try {
    if (!publicId) return null;
    if (!env.CLOUDINARY_CLOUD_NAME) return `https://example.com/mock/${publicId}`;

    const url = cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: resourceType,
        type: 'authenticated', // Require signature
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });
    
    // Cloudinary video requires a slightly different helper for 'authenticated' type
    if (resourceType === 'video') {
       return cloudinary.url(publicId, {
          resource_type: 'video',
          type: 'authenticated',
          sign_url: true,
       });
    }

    return url;
  } catch (error) {
    logError(`Signed URL generation failed for ${publicId}: ${error.message}`);
    return null;
  }
};

/**
 * Uploads a local file buffer to Cloudinary with 'authenticated' access.
 * This ensures the file is NOT publicly accessible by its URL alone.
 */
export const uploadToCloud = async (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: 'authenticated', // ✅ Crucial for signed URL protection
        access_mode: 'authenticated',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
