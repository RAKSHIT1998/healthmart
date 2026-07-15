import Link from 'next/link';
import Image from 'next/image';
import {
  Pill,
  HeartPulse,
  Stethoscope,
  Baby,
  Sparkles,
  Wind,
  Brain,
  Salad,
  Activity,
  Thermometer,
  Bone,
  Shield,
  Droplet,
  SmilePlus,
  Eye,
  Heart,
  BadgePlus,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react';
import { publicApiFetch } from '@/lib/api';
import type { Category } from '@/types';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Prescription Medicines': Pill,
  'Over the Counter': ShoppingBasket,
  'Healthcare Devices': Activity,
  'Baby Care': Baby,
  'Personal Care': Sparkles,
  'Cough, Cold & Allergy': Wind,
  'Neuro & Psychiatry': Brain,
  'Digestive & Antacids': Salad,
  'Diabetes Care': Droplet,
  'Pain Relief & Fever': Thermometer,
  'Respiratory Care': Wind,
  'Antibiotics & Anti-infectives': Shield,
  'Cardiac & Blood Pressure': HeartPulse,
  'Vitamins & Supplements': Pill,
  'Wound Care & Antiseptics': Shield,
  'Orthopedic & Pain Relief': Bone,
  'Skin Care & Dermatology': Sparkles,
  'Oral & Dental Care': SmilePlus,
  'Eye & Ear Care': Eye,
  "Women's Health": Heart,
  "Men's Health": BadgePlus,
};

export async function CategoryGrid() {
  let categories: Category[] = [];
  try {
    categories = await publicApiFetch<Category[]>('/catalog/categories');
  } catch {
    categories = [];
  }

  if (categories.length === 0) return null;

  return (
    <section className="container py-12">
      <h2 className="mb-6 text-2xl font-bold">Shop by Category</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.name] ?? Stethoscope;
          return (
            <Link
              key={category.id}
              href={`/shop?categoryId=${category.id}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-center transition-shadow hover:shadow-md"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {category.image ? (
                  <Image src={category.image} alt={category.name} fill className="rounded-full object-cover" />
                ) : (
                  <Icon className="h-7 w-7 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium group-hover:text-primary">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
