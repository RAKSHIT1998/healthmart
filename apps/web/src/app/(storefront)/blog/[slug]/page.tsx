import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { publicApiFetch, ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BlogComments } from './blog-comments';
import type { BlogComment, BlogPost } from '@/hooks/use-blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    return await publicApiFetch<{ blog: BlogPost; comments: BlogComment[] }>(`/blog/slug/${slug}`);
  } catch (err) {
    if (err instanceof ApiClientError && err.statusCode === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: 'Article not found' };

  return {
    title: data.blog.title,
    description: data.blog.excerpt ?? data.blog.content.slice(0, 160),
    openGraph: {
      title: data.blog.title,
      description: data.blog.excerpt,
      images: data.blog.coverImage ? [data.blog.coverImage] : undefined,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();

  const { blog, comments } = data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    image: blog.coverImage ? [blog.coverImage] : undefined,
    datePublished: blog.publishedAt,
    articleSection: blog.category,
  };

  return (
    <div className="container max-w-2xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Badge variant="secondary">{blog.category}</Badge>
      <h1 className="mt-3 text-3xl font-bold">{blog.title}</h1>
      {blog.publishedAt && <p className="mt-2 text-sm text-muted-foreground">{formatDate(blog.publishedAt)} · {blog.views} views</p>}

      {blog.coverImage && (
        <div className="relative mt-6 h-64 w-full overflow-hidden rounded-xl bg-secondary/40">
          <Image src={blog.coverImage} alt={blog.title} fill className="object-cover" />
        </div>
      )}

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {blog.content.split('\n').filter(Boolean).map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {blog.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {blog.tags.map((tag) => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-10">
        <BlogComments blogId={blog.id} initialComments={comments} />
      </div>
    </div>
  );
}
