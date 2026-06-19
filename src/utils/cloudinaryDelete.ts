import cloudinary from "../config/cloudinary.config.js";

export const deleteFile = async (
  publicId: string
): Promise<void> => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};