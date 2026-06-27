import type { MetadataRoute } from 'next';
import { publicApiFetch } from '@/lib/api';
import type { Medicine } from '@/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const STATIC_ROUTES = ['', '/shop', '/about', '/contact', '/privacy', '/refund', '/terms', '/prescription-upload'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  try {
    const medicines = await publicApiFetch<Medicine[]>('/medicines?limit=100&sortBy=popularity');
    const medicineEntries: MetadataRoute.Sitemap = medicines.map((medicine) => ({
      url: `${siteUrl}/product/${medicine.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...staticEntries, ...medicineEntries];
  } catch {
    return staticEntries;
  }
}
