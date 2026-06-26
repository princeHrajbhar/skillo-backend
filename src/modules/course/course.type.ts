import { Types } from 'mongoose';

export interface ICloudinaryFile {
  url: string;
  publicId: string;
}

export interface IResource {
  name: string;
  type: 'pdf' | 'image';
  file: ICloudinaryFile;
}

export interface IFAQ {
  question: string;
  answer: string;
}

export type CourseStatus =
  | 'upcoming'
  | 'active'
  | 'ended';

export interface ICourse {
  // Basic Information
  title: string;
  slug: string;
  category: string;
  subCategory: string;
  shortDescription: string;

  // Pricing
  price: number;
  discountedPrice: number;
  currency: string;

  // Media
  bannerImage: ICloudinaryFile;

  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];

  // Status
  status: CourseStatus;

  // URLs
  urls: string[];

  // Resources
  resources: IResource[];

  // CMS
  cms: string;

  // FAQs
  faqs: IFAQ[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}