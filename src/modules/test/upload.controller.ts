import { Request, Response } from "express";
import { uploadImage } from "./upload.service.js";

export const testUpload = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const image = await uploadImage(req.file);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: image,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};