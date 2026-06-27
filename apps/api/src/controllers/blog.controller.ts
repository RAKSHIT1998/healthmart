import type { Request, Response } from 'express';
import { AuditAction, type PaginationQuery } from '@healthmart/shared';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPaginated, sendSuccess } from '../utils/apiResponse';
import * as blogService from '../services/blog.service';
import { recordAudit } from '../middlewares/audit.middleware';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const listPublished = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await blogService.listPublishedBlogs(page, limit, req.query.category as string | undefined);
  sendPaginated(res, items, pagination);
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const blog = await blogService.getBlogBySlug(req.params.slug as string);
  const comments = await blogService.listComments(String(blog._id));
  sendSuccess(res, { blog, comments });
});

export const listAllForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as PaginationQuery;
  const { items, pagination } = await blogService.listAllBlogsForAdmin(page, limit);
  sendPaginated(res, items, pagination);
});

export const createBlog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const blog = await blogService.createBlog(req.user!.id, req.body);
  recordAudit({ req, action: AuditAction.CREATE, entityType: 'Blog', entityId: String(blog._id) });
  sendSuccess(res, blog, 'Blog post created', 201);
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await blogService.updateBlog(req.params.id as string, req.body);
  recordAudit({ req, action: AuditAction.UPDATE, entityType: 'Blog', entityId: req.params.id });
  sendSuccess(res, blog, 'Blog post updated');
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deleteBlog(req.params.id as string);
  recordAudit({ req, action: AuditAction.DELETE, entityType: 'Blog', entityId: req.params.id });
  sendSuccess(res, null, 'Blog post deleted');
});

export const addComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const comment = await blogService.addComment(req.params.id as string, req.user!.id, req.body.comment);
  sendSuccess(res, comment, 'Comment added', 201);
});

export const moderateComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await blogService.moderateComment(req.params.commentId as string, req.body.isApproved);
  sendSuccess(res, comment, 'Comment moderated');
});
