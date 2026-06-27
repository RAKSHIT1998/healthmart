'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, publicApiFetch, ApiClientError } from '@/lib/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  publishedAt?: string;
  views: number;
}

export interface BlogComment {
  id: string;
  comment: string;
  createdAt: string;
  userId: { name: string; avatarUrl?: string } | string;
}

export function useBlogPosts(page = 1, category?: string) {
  return useQuery({
    queryKey: ['blog-posts', page, category],
    queryFn: () =>
      publicApiFetch<BlogPost[]>(`/blog?page=${page}&limit=12${category ? `&category=${encodeURIComponent(category)}` : ''}`),
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => publicApiFetch<{ blog: BlogPost; comments: BlogComment[] }>(`/blog/slug/${slug}`),
    enabled: !!slug,
  });
}

export function useAddBlogComment(blogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => api.post(`/blog/${blogId}/comments`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      toast.success('Comment added');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
