'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, publicApiFetch, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';

export function ReviewSection({ medicineId }: { medicineId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['reviews', medicineId],
    queryFn: () =>
      publicApiFetch<Review[]>(`/reviews/medicine/${medicineId}?page=1&limit=10`).catch(() => [] as Review[]),
  });

  const submitReview = useMutation({
    mutationFn: () =>
      api.post('/reviews', { medicineId, rating, title: title || undefined, comment: comment || undefined }),
    onSuccess: () => {
      toast.success('Thank you for your review!');
      setShowForm(false);
      setTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', medicineId] });
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer Reviews</h2>
        {accessToken && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            Write a review
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border/60 p-4">
          <div className="mb-3 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)}>
                <Star className={`h-6 w-6 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={120}
            className="mb-2 w-full rounded-lg border border-input bg-background p-3 text-sm"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full rounded-lg border border-input bg-background p-3 text-sm"
            rows={3}
          />
          <Button className="mt-3" size="sm" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
            Submit Review
          </Button>
        </div>
      )}

      {!data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="space-y-4">
          {data.map((review) => (
            <div key={review.id} className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
              </div>
              {review.title && <p className="mt-1 text-sm font-medium">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
