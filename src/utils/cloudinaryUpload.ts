import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";

export interface CloudinaryFile {
  url: string;
  publicId: string;
}

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryFile> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};