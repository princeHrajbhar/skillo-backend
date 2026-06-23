// src/models/blog-page.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================
   Interfaces
============================ */

export interface ICloudinaryAsset {
  public_id: string;
  secure_url: string;
}

export interface IFAQ {
  question: string;
  answer: string;
}

export interface IContentSection {
  htmlContent: string;
}

export interface IBlogPage extends Document {
  title: string;
  slug: string;

  seoTitle: string;
  seoDescription: string;
  keywords: string[];

  banner: ICloudinaryAsset;

  brochurePdf?: ICloudinaryAsset;

  urls: string[];

  contentSections: IContentSection[];

  faqs: IFAQ[];

  blogCategory: mongoose.Types.ObjectId;

  postedBy: mongoose.Types.ObjectId;

  postingDate: Date;

  status: "draft" | "published";

  publishedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* ============================
   Sub Schemas
============================ */

const CloudinaryAssetSchema = new Schema<ICloudinaryAsset>(
  {
    public_id: {
      type: String,
      required: true,
      trim: true,
    },

    secure_url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const ContentSectionSchema = new Schema<IContentSection>(
  {
    htmlContent: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
  }
);

/* ============================
   Main Blog Schema
============================ */

const BlogPageSchema = new Schema<IBlogPage>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    seoTitle: {
      type: String,
      required: true,
      trim: true,
    },

    seoDescription: {
      type: String,
      required: true,
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    banner: {
      type: CloudinaryAssetSchema,
      required: true,
    },

    brochurePdf: {
      type: CloudinaryAssetSchema,
      default: null,
    },

    urls: {
      type: [String],
      default: [],
    },

    contentSections: {
      type: [ContentSectionSchema],
      default: [],
    },

    faqs: {
      type: [FAQSchema],
      default: [],
    },

    blogCategory: {
      type: Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
    },

    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    postingDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================
   Indexes
============================ */

BlogPageSchema.index({ slug: 1 });
BlogPageSchema.index({ status: 1 });
BlogPageSchema.index({ blogCategory: 1 });
BlogPageSchema.index({ postingDate: -1 });
BlogPageSchema.index({ publishedAt: -1 });

/* ============================
   Model
============================ */

const BlogPageModel: Model<IBlogPage> =
  mongoose.models.BlogPage ||
  mongoose.model<IBlogPage>("BlogPage", BlogPageSchema);

export default BlogPageModel;