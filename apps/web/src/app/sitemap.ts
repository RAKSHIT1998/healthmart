import type { MetadataRoute } from 'next';
import { publicApiFetch } from '@/lib/api';
import type { Medicine } from '@/types';
import type { BlogPost } from '@/hooks/use-blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const STATIC_ROUTES = ['', '/shop', '/about', '/contact', '/privacy', '/refund', '/terms', '/prescription-upload', '/blog'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const [medicineEntries, blogEntries] = await Promise.all([
    publicApiFetch<Medicine[]>('/medicines?limit=100&sortBy=popularity')
      .then((medicines) =>
        medicines.map((medicine) => ({
          url: `${siteUrl}/product/${medicine.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        })),
      )
      .catch(() => []),
    publicApiFetch<BlogPost[]>('/blog?limit=100')
      .then((posts) =>
        posts.map((post) => ({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        })),
      )
      .catch(() => []),
  ]);

  return [...staticEntries, ...medicineEntries, ...blogEntries];
}
