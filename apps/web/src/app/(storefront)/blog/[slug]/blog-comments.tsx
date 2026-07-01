'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAddBlogComment, type BlogComment } from '@/hooks/use-blog';
import { useAuthStore } from '@/store/auth-store';

export function BlogComments({ blogId, initialComments }: { blogId: string; initialComments: BlogComment[] }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const addComment = useAddBlogComment(blogId);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(initialComments);

  function handleSubmit() {
    if (!comment.trim()) return;
    addComment.mutate(comment, {
      onSuccess: () => {
        setComments((prev) => [{ id: Date.now().toString(), comment, createdAt: new Date().toISOString(), userId: 'You' }, ...prev]);
        setComment('');
      },
    });
  }

  return (
    <div>
      <h2 className="mb-4 font-semibold">Comments ({comments.length})</h2>

      {accessToken ? (
        <div className="mb-6 flex gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 rounded-lg border border-input bg-background p-2 text-sm"
            rows={2}
          />
          <Button onClick={handleSubmit} disabled={!comment.trim() || addComment.isPending}>
            Post
          </Button>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">Log in to join the discussion.</p>
      )}

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="border-b border-border/60 pb-3">
            <p className="text-sm font-medium">{typeof c.userId === 'object' ? c.userId.name : 'You'}</p>
            <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
            <p className="mt-1 text-sm">{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
