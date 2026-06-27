'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Medicine } from '@/types';

interface MedicineSearchSelectProps {
  value: string;
  onSelect: (medicine: Medicine) => void;
}

export function MedicineSearchSelect({ value, onSelect }: MedicineSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['medicine-search', query],
    queryFn: () => api.get<Medicine[]>(`/medicines?q=${encodeURIComponent(query)}&limit=8`, { auth: false }),
    enabled: query.length > 1,
  });

  return (
    <div className="relative">
      <Input
        placeholder="Search medicine by name..."
        value={query || value}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && data && data.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-md">
          {data.map((medicine) => (
            <button
              key={medicine.id}
              className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-secondary')}
              onClick={() => {
                onSelect(medicine);
                setQuery(medicine.name);
                setOpen(false);
              }}
            >
              {medicine.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
