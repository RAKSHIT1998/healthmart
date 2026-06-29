'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAddToWishlist, useRemoveFromWishlist, useWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  medicineId: string;
  className?: string;
}

export function WishlistButton({ medicineId, className }: WishlistButtonProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const isWishlisted = !!wishlist?.medicineIds.some((m) => m.id === medicineId);
  const isPending = addToWishlist.isPending || removeFromWishlist.isPending;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (isWishlisted) removeFromWishlist.mutate(medicineId);
    else addToWishlist.mutate(medicineId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4', isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground')} />
    </button>
  );
}
