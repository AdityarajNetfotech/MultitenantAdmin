// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

/**
 * Upload file buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {String} folder - Cloudinary folder name
 */
export const uploadBuffer = (buffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;

/*
Usage example in controllers:

import cloudinary from '../utils/cloudinary.js';

const uploaded = await cloudinary.uploader.upload(filePath, { folder: 'recruiter' });
*/

