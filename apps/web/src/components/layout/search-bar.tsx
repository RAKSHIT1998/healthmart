'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApiFetch } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { Medicine } from '@/types';

const RECENT_SEARCHES_KEY = 'healthmart-recent-searches';
const POPULAR_SEARCHES = ['Paracetamol', 'Vitamin C', 'Cough Syrup', 'Hand Sanitizer', 'Thermometer'];

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushRecentSearch(term: string) {
  const existing = getRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase());
  const updated = [term, ...existing].slice(0, 6);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => publicApiFetch<Medicine[]>(`/medicines?q=${encodeURIComponent(debouncedQuery)}&limit=6`),
    enabled: debouncedQuery.trim().length > 1,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function submitSearch(term: string) {
    if (!term.trim()) return;
    pushRecentSearch(term.trim());
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`);
  }

  const recent = getRecentSearches();

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitSearch(query)}
          placeholder="Search medicines, salts, brands..."
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-card p-3 shadow-lg">
          {debouncedQuery.trim().length > 1 ? (
            <div className="space-y-1">
              {data && data.length > 0 ? (
                data.map((medicine) => (
                  <Link
                    key={medicine.id}
                    href={`/product/${medicine.slug}`}
                    onClick={() => submitSearch(medicine.name)}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary"
                  >
                    {medicine.images[0] && (
                      <Image src={medicine.images[0]} alt={medicine.name} width={36} height={36} className="rounded-md object-cover" />
                    )}
                    <div className="flex-1 truncate">
                      <p className="truncate text-sm font-medium">{medicine.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(medicine.sellingPrice)}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="p-2 text-sm text-muted-foreground">No matches found</p>
              )}
              <button
                onClick={() => submitSearch(debouncedQuery)}
                className="w-full rounded-lg p-2 text-left text-sm font-medium text-primary hover:bg-secondary"
              >
                See all results for &ldquo;{debouncedQuery}&rdquo;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Recent</p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <button
                        key={term}
                        onClick={() => submitSearch(term)}
                        className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-secondary/70"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => submitSearch(term)}
                      className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-secondary/70"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
