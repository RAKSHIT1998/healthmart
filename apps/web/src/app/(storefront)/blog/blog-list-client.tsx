'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBlogPosts } from '@/hooks/use-blog';

export function BlogListClient() {
  const { data: posts, isLoading } = useBlogPosts(1);

  if (isLoading) return <p className="mt-8 text-sm text-muted-foreground">Loading articles...</p>;
  if (!posts || posts.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No articles published yet.</p>;

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
            {post.coverImage && (
              <div className="relative h-40 w-full bg-secondary/40">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <CardContent className="p-4">
              <Badge variant="secondary">{post.category}</Badge>
              <h2 className="mt-2 line-clamp-2 font-semibold">{post.title}</h2>
              {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
