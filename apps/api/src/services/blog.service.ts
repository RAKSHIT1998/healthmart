import type { CreateBlogInput, UpdateBlogInput } from '@healthmart/shared';
import { blogCommentRepository, blogRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { getOrSetCache, invalidateCache } from '../utils/cache';

const BLOG_LIST_CACHE_TTL_SECONDS = 120;

export async function listPublishedBlogs(page: number, limit: number, category?: string) {
  return getOrSetCache(`blog:list:${page}:${limit}:${category ?? 'all'}`, BLOG_LIST_CACHE_TTL_SECONDS, () =>
    blogRepository.listPublished(page, limit, category),
  );
}

export async function getBlogBySlug(slug: string) {
  const blog = await blogRepository.findBySlug(slug);
  if (!blog) throw ApiError.notFound('Blog post not found');
  blog.views += 1;
  await blog.save();
  return blog;
}

export async function listAllBlogsForAdmin(page: number, limit: number) {
  return blogRepository.paginate({}, { page, limit, sort: { createdAt: -1 } });
}

export async function createBlog(authorId: string, input: CreateBlogInput) {
  const slug = input.slug ?? slugify(input.title);
  const exists = await blogRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A blog post with this slug already exists');

  const blog = await blogRepository.create({
    ...input,
    slug,
    authorId,
    publishedAt: input.isPublished ? new Date() : undefined,
  } as never);
  await invalidateCache('blog:list:*');
  return blog;
}

export async function updateBlog(blogId: string, input: UpdateBlogInput) {
  const blog = await blogRepository.findById(blogId);
  if (!blog) throw ApiError.notFound('Blog post not found');

  const wasPublished = blog.isPublished;
  Object.assign(blog, input);
  if (input.isPublished && !wasPublished) {
    blog.publishedAt = new Date();
  }

  await blog.save();
  await invalidateCache('blog:list:*');
  return blog;
}

export async function deleteBlog(blogId: string) {
  const blog = await blogRepository.findById(blogId);
  if (!blog) throw ApiError.notFound('Blog post not found');
  await blogRepository.deleteById(blogId);
  await invalidateCache('blog:list:*');
}

export async function addComment(blogId: string, userId: string, comment: string) {
  const blog = await blogRepository.findById(blogId);
  if (!blog) throw ApiError.notFound('Blog post not found');
  return blogCommentRepository.create({ blogId, userId, comment } as never);
}

export async function listComments(blogId: string) {
  return blogCommentRepository.listForBlog(blogId);
}

export async function moderateComment(commentId: string, isApproved: boolean) {
  const comment = await blogCommentRepository.updateById(commentId, { isApproved });
  if (!comment) throw ApiError.notFound('Comment not found');
  return comment;
}
