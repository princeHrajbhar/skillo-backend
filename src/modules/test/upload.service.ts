import cloudinary from '../../config/cloudinary.config.js';

export const uploadImage = async (file: Express.Multer.File) => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: 'test',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
