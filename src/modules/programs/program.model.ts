// program.model.ts
import mongoose, { Schema, model } from "mongoose";
import { IProgram } from "./program.type.js";

const sanitizeStringArray = (
  value: string[]
): string[] => {
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
};

const CloudinaryFileSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const LessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ModuleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const InstructorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: CloudinaryFileSchema },
    bio: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ProgramSchema = new Schema<IProgram>(
  {
    // Basic Information
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true, default: "" },
    shortDescription: { type: String, required: true, trim: true },
    fullDescription: { type: String, required: true, trim: true },

    // Course Details
    duration: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    language: { type: String, default: "English", trim: true },
    mode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },
    certification: { type: Boolean, default: true },

    // Pricing
    price: { type: Number, required: true, min: 0 },
    discountedPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator(value: number) {
          return value <= this.price;
        },
        message: "Discounted price cannot exceed price",
      },
    },
    currency: { type: String, default: "INR", trim: true, uppercase: true },

    // Media
    thumbnail: { type: CloudinaryFileSchema },
    bannerImage: { type: CloudinaryFileSchema },

    // Curriculum
    modules: { type: [ModuleSchema], default: [] },

    // Learning Outcomes
    skillsYouWillLearn: { type: [String], default: [], set: sanitizeStringArray },
    toolsCovered: { type: [String], default: [], set: sanitizeStringArray },

    // Eligibility
    prerequisites: { type: [String], default: [], set: sanitizeStringArray },
    targetAudience: { type: [String], default: [], set: sanitizeStringArray },

    // Career
    careerOpportunities: { type: [String], default: [], set: sanitizeStringArray },
    averageSalaryRange: { type: String, default: "", trim: true },

    // Instructor
    instructor: { type: InstructorSchema, required: true },

    // Placement
    placementSupport: { type: Boolean, default: false },
    internshipIncluded: { type: Boolean, default: false },
    jobAssistance: { type: Boolean, default: false },

    // SEO
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    keywords: { type: [String], default: [], set: sanitizeStringArray },

    // Statistics
    enrolledStudents: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },

    // Status
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
    minimize: false,
  }
);

ProgramSchema.index({ title: "text", shortDescription: "text" });
ProgramSchema.index({ category: 1, active: 1 });
ProgramSchema.index({ featured: 1, active: 1 });

const Program =
  mongoose.models.Program || model<IProgram>("Program", ProgramSchema);

export default Program;