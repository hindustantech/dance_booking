import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'demo', // Replace with your Cloudinary cloud name
  api_key: '446492991461346',
  api_secret: 'y1YJXSsQihJIKtzOV_zz00VF8TM',
});

export const uploadToCloudinary = async (filePath, folder = 'dancers') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
}; 