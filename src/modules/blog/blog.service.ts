// recorded-course\skillo-backend\src\modules\blog\blog.service.ts
import Blog, { IBlog, BlogStatus, ICloudinaryFile } from "./blog.model.js";
import { CreateBlogInput, UpdateBlogInput } from "./blog.validator.js";
import { uploadFile, uploadMultipleFiles, deleteFile } from "../../utils/fileUpload.js";

class BlogService {
  async createBlog(
    data: CreateBlogInput,
    bannerFile?: Express.Multer.File,
    resourceFiles?: Express.Multer.File[]
  ): Promise<IBlog> {
    if (data.slug) {
      const existingBlog = await Blog.findOne({ slug: data.slug });
      if (existingBlog) {
        throw new Error("Slug already exists. Please use a unique slug.");
      }
    }

    let banner: ICloudinaryFile | undefined;
    let uploadedFiles: ICloudinaryFile[] = [];

    if (bannerFile) {
      banner = await uploadFile(bannerFile, "blogs/banners");
    }

    if (resourceFiles && resourceFiles.length > 0) {
      uploadedFiles = await uploadMultipleFiles(resourceFiles, "blogs/resources");
    }

    const blogData = {
      ...data,
      banner: banner || undefined,
      files: uploadedFiles,
    };

    const blog = new Blog(blogData);
    return await blog.save();
  }

  async getBlogs(query: {
    page?: number;
    limit?: number;
    status?: BlogStatus;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort(sort).skip(skip).limit(limit),
      Blog.countDocuments(filter),
    ]);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getBlogById(id: string): Promise<IBlog | null> {
    return await Blog.findById(id);
  }

  async getBlogBySlug(slug: string): Promise<IBlog | null> {
    return await Blog.findOne({ slug });
  }

  async updateBlog(
    id: string,
    data: UpdateBlogInput,
    bannerFile?: Express.Multer.File,
    resourceFiles?: Express.Multer.File[]
  ): Promise<IBlog | null> {
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return null;
    }

    if (data.slug && data.slug !== existingBlog.slug) {
      const blogWithSlug = await Blog.findOne({
        slug: data.slug,
        _id: { $ne: id },
      });
      if (blogWithSlug) {
        throw new Error("Slug already exists. Please use a unique slug.");
      }
    }

    const updateData: any = { ...data };

    if (bannerFile) {
      if (existingBlog.banner?.publicId) {
        await deleteFile(existingBlog.banner.publicId);
      }
      const newBanner = await uploadFile(bannerFile, "blogs/banners");
      updateData.banner = newBanner;
    }

    if (resourceFiles && resourceFiles.length > 0) {
      if (existingBlog.files && existingBlog.files.length > 0) {
        for (const file of existingBlog.files) {
          await deleteFile(file.publicId);
        }
      }
      const uploadedFiles = await uploadMultipleFiles(resourceFiles, "blogs/resources");
      updateData.files = uploadedFiles;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updatedBlog;
  }

  async deleteBlog(id: string): Promise<IBlog | null> {
    const blog = await Blog.findById(id);
    if (!blog) {
      return null;
    }

    if (blog.banner?.publicId) {
      await deleteFile(blog.banner.publicId);
    }

    if (blog.files && blog.files.length > 0) {
      for (const file of blog.files) {
        await deleteFile(file.publicId);
      }
    }

    await Blog.findByIdAndDelete(id);
    return blog;
  }

  async deleteMultipleBlogs(ids: string[]): Promise<{
    deletedCount: number;
    failedIds: string[];
  }> {
    const failedIds: string[] = [];
    let deletedCount = 0;

    for (const id of ids) {
      try {
        const blog = await Blog.findById(id);
        if (blog) {
          if (blog.banner?.publicId) {
            await deleteFile(blog.banner.publicId);
          }
          if (blog.files && blog.files.length > 0) {
            for (const file of blog.files) {
              await deleteFile(file.publicId);
            }
          }
          await Blog.findByIdAndDelete(id);
          deletedCount++;
        }
      } catch (error) {
        failedIds.push(id);
      }
    }

    return { deletedCount, failedIds };
  }

  async updateBlogStatus(id: string, status: BlogStatus): Promise<IBlog | null> {
    return await Blog.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
  }

  async getBlogStats(): Promise<{
    total: number;
    draft: number;
    published: number;
  }> {
    const [total, draft, published] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "draft" }),
      Blog.countDocuments({ status: "published" }),
    ]);

    return { total, draft, published };
  }
}

export default new BlogService();