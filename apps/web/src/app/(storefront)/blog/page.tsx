import type { Metadata } from 'next';
import { BlogListClient } from './blog-list-client';

export const metadata: Metadata = {
  title: 'Health Blog',
  description: 'Health tips, medicine guides, and wellness articles from BuyMedicines.store.',
};

export default function BlogPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Health Blog</h1>
      <p className="mt-2 text-muted-foreground">Tips, guides, and wellness articles from our pharmacists.</p>
      <BlogListClient />
    </div>
  );
}
