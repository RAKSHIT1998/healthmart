import { Router } from 'express';
import { Role, createBlogCommentSchema, createBlogSchema, objectIdSchema, paginationQuerySchema, updateBlogSchema } from '@buymedicines/shared';
import { z } from 'zod';
import * as blogController from '../controllers/blog.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Public
router.get('/', validate({ query: paginationQuerySchema }), blogController.listPublished);
router.get('/slug/:slug', blogController.getBySlug);

// Admin authoring
router.get(
  '/admin/all',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ query: paginationQuerySchema }),
  blogController.listAllForAdmin,
);
router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ body: createBlogSchema }),
  blogController.createBlog,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ id: objectIdSchema }), body: updateBlogSchema }),
  blogController.updateBlog,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ id: objectIdSchema }) }),
  blogController.deleteBlog,
);

// Comments
router.post(
  '/:id/comments',
  authenticate,
  validate({ params: z.object({ id: objectIdSchema }), body: createBlogCommentSchema }),
  blogController.addComment,
);
router.patch(
  '/comments/:commentId/moderate',
  authenticate,
  requireRole(Role.ADMIN, Role.MANAGER),
  validate({ params: z.object({ commentId: objectIdSchema }), body: z.object({ isApproved: z.boolean() }) }),
  blogController.moderateComment,
);

export default router;
