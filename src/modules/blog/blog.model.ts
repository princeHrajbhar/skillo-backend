// src/models/blog.model.ts

import {
  Document,
  Model,
  Schema,
  model,
} from "mongoose";

export type BlogStatus = "draft" | "published";

export interface ICloudinaryFile {
  url: string;
  publicId: string;
}

export interface IFAQ {
  question: string;
  answer: string;
}

export interface ISocialMediaLink {
  platform: string;
  url: string;
}

export interface IResourceLink {
  title: string;
  url: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  description: string;

  category: string;

  keyword: string[];

  postingDate: Date;
  postedBy: string;

  socialMediaLinks: ISocialMediaLink[];

  resourceLinks: IResourceLink[];

  banner: ICloudinaryFile;

  files: ICloudinaryFile[];

  faq: IFAQ[];

  seoTitle: string;
  seoDescription: string;

  content: string;

  status: BlogStatus;

  createdAt: Date;
  updatedAt: Date;
}

const CloudinaryFileSchema = new Schema<ICloudinaryFile>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
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

const SocialMediaLinkSchema = new Schema<ISocialMediaLink>(
  {
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const ResourceLinkSchema = new Schema<IResourceLink>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const BlogSchema = new Schema<IBlog>(
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

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    keyword: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    postingDate: {
      type: Date,
      default: Date.now,
    },

    postedBy: {
      type: String,
      required: true,
    },

    socialMediaLinks: {
      type: [SocialMediaLinkSchema],
      default: [],
    },

    resourceLinks: {
      type: [ResourceLinkSchema],
      default: [],
    },

    banner: {
      type: CloudinaryFileSchema,
      required: false,
    },

    files: {
      type: [CloudinaryFileSchema],
      default: [],
    },

    faq: {
      type: [FAQSchema],
      default: [],
    },

    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      default: "",
    },

    content: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Blog: Model<IBlog> = model<IBlog>("Blog", BlogSchema);

export default Blog;