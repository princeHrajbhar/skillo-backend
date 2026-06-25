import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";

export interface CloudinaryFile {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  createdAt: string;
}

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryFile> => {
  if (!file) {
    throw new Error("No file provided");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          originalFilename:
            result.original_filename || file.originalname,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          pages: result.pages,
          createdAt: result.created_at,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder: string
): Promise<CloudinaryFile[]> => {
  if (!files?.length) return [];

  return Promise.all(files.map((file) => uploadFile(file, folder)));
};

export const deleteFile = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<void> => {
  if (!publicId) return;

  const types =
    resourceType === "auto"
      ? ["image", "video", "raw"]
      : [resourceType];

  for (const type of types) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type as any,
      });

      if (result.result === "ok") {
        return;
      }
    } catch {}
  }
};