import { BaseRepository } from './BaseRepository';
import { BlogModel, BlogCommentModel, type IBlog, type IBlogComment } from '../models';

class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(BlogModel);
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug, isPublished: true });
  }

  async listPublished(page: number, limit: number, category?: string) {
    return this.paginate(
      { isPublished: true, ...(category ? { category } : {}) },
      { page, limit, sort: { publishedAt: -1 } },
    );
  }
}

class BlogCommentRepository extends BaseRepository<IBlogComment> {
  constructor() {
    super(BlogCommentModel);
  }

  async listForBlog(blogId: string) {
    return this.model.find({ blogId, isApproved: true }).sort({ createdAt: -1 }).populate('userId', 'name avatarUrl');
  }
}

export const blogRepository = new BlogRepository();
export const blogCommentRepository = new BlogCommentRepository();
