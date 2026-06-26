import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  originalName: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  folder: string;

  resourceType: string;
 format: string;
 width?: number;
 height?: number;
 duration?: number;
 pages?: number;
 uploadedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    originalName: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    folder: {
      type: String,
      default: 'uploads',
    },

    resourceType: {
      type: String,
      required: true,
    },

    format: {
      type: String,
      required: true,
    },

    width: Number,

    height: Number,

    duration: Number,

    pages: Number,

    uploadedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FileModel = mongoose.model<IFile>('File', fileSchema);