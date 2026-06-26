import mongoose, { Schema, model } from 'mongoose';
import {
  ICloudinaryFile,
  IFAQ,
  ICourse,
  IResource,
} from './course.type.js';

const sanitizeStringArray = (value: string[]): string[] => {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
};

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

const ResourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },

    file: {
      type: CloudinaryFileSchema,
      required: true,
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

const CourseSchema = new Schema<ICourse>(
  {
    // Basic Information
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
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    subCategory: {
      type: String,
      default: '',
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator(this: ICourse, value: number) {
          return value <= this.price;
        },
        message: 'Discounted price cannot exceed price',
      },
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    // Banner
    bannerImage: {
      type: CloudinaryFileSchema,
      required: true,
    },

    // SEO
    metaTitle: {
      type: String,
      default: '',
      trim: true,
    },

    metaDescription: {
      type: String,
      default: '',
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
      set: sanitizeStringArray,
    },

    // Status
    status: {
      type: String,
      enum: ['upcoming', 'active', 'ended'],
      default: 'upcoming',
      index: true,
    },

    // External URLs
    urls: {
      type: [String],
      default: [],
      set: sanitizeStringArray,
    },

    // Resources
    resources: {
      type: [ResourceSchema],
      default: [],
    },

    // CMS HTML
    cms: {
      type: String,
      default: '',
    },

    // FAQs
    faqs: {
      type: [FAQSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
    minimize: false,
  }
);

// Indexes
CourseSchema.index({
  title: 'text',
  shortDescription: 'text',
});

CourseSchema.index({
  category: 1,
  status: 1,
});

const Course =
  mongoose.models.Course ||
  model<ICourse>('Course', CourseSchema);

export default Course;