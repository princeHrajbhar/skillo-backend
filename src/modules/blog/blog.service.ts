import BlogPageModel from "./blog.model.js";
import { uploadFile } from "../../utils/cloudinaryUpload.js";
import {  deleteFile } from "../../utils/cloudinaryDelete.js";

export class BlogService {
  async createBlog(
    payload: any,
    files?: {
      banner?: Express.Multer.File[];
      brochurePdf?: Express.Multer.File[];
    }
  ) {
    let banner;
    let brochurePdf;

    try {
      if (!files?.banner?.[0]) {
        throw new Error("Banner is required");
      }

      banner = await uploadFile(files.banner[0], "blogs/banner");

      if (files?.brochurePdf?.[0]) {
        brochurePdf = await uploadFile(
          files.brochurePdf[0],
          "blogs/brochure"
        );
      }

      const blog = await BlogPageModel.create({
        ...payload,

        banner: {
          public_id: banner.publicId,
          secure_url: banner.url,
        },

        brochurePdf: brochurePdf
          ? {
              public_id: brochurePdf.publicId,
              secure_url: brochurePdf.url,
            }
          : undefined,

        publishedAt:
          payload.status === "published" ? new Date() : null,
      });

      return blog;
    } catch (error) {
      if (banner?.publicId) {
        await deleteFile(banner.publicId);
      }

      if (brochurePdf?.publicId) {
        await deleteFile(brochurePdf.publicId);
      }

      throw error;
    }
  }

  async updateBlog(
    id: string,
    payload: any,
    files?: {
      banner?: Express.Multer.File[];
      brochurePdf?: Express.Multer.File[];
    }
  ) {
    const blog = await BlogPageModel.findById(id);

    if (!blog) {
      throw new Error("Blog not found");
    }

    if (files?.banner?.[0]) {
      if (blog.banner?.public_id) {
        await deleteFile(blog.banner.public_id);
      }

      const uploaded = await uploadFile(
        files.banner[0],
        "blogs/banner"
      );

      blog.banner = {
        public_id: uploaded.publicId,
        secure_url: uploaded.url,
      };
    }

    if (files?.brochurePdf?.[0]) {
      if (blog.brochurePdf?.public_id) {
        await deleteFile(blog.brochurePdf.public_id);
      }

      const uploaded = await uploadFile(
        files.brochurePdf[0],
        "blogs/brochure"
      );

      blog.brochurePdf = {
        public_id: uploaded.publicId,
        secure_url: uploaded.url,
      };
    }

    Object.assign(blog, payload);

    if (
      payload.status === "published" &&
      !blog.publishedAt
    ) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    return blog;
  }

  async getBlogs(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.blogCategory) {
      filter.blogCategory = query.blogCategory;
    }

    const [blogs, total] = await Promise.all([
      BlogPageModel.find(filter)
        .populate("blogCategory")
        .populate("postedBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      BlogPageModel.countDocuments(filter),
    ]);

    return {
      blogs,
      total,
      page,
      limit,
    };
  }

  async getBlogById(id: string) {
    return BlogPageModel.findById(id)
      .populate("blogCategory")
      .populate("postedBy");
  }

  async getBlogBySlug(slug: string) {
    return BlogPageModel.findOne({ slug })
      .populate("blogCategory")
      .populate("postedBy");
  }

  async deleteBlog(id: string) {
    const blog = await BlogPageModel.findById(id);

    if (!blog) {
      throw new Error("Blog not found");
    }

    if (blog.banner?.public_id) {
      await deleteFile(blog.banner.public_id);
    }

    if (blog.brochurePdf?.public_id) {
      await deleteFile(blog.brochurePdf.public_id);
    }

    await blog.deleteOne();

    return true;
  }
}

export const blogService = new BlogService();