import { z } from 'zod';

export const createBlogSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(20),
  coverImage: z.string().url().optional(),
  category: z.string().min(2).max(60),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateBlogSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(300),
  content: z.string().min(20),
  coverImage: z.string().url(),
  category: z.string().min(2).max(60),
  tags: z.array(z.string()),
  isPublished: z.boolean(),
  metaTitle: z.string().max(70),
  metaDescription: z.string().max(160),
}).partial();

export const createBlogCommentSchema = z.object({
  comment: z.string().min(2).max(1000),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>;
