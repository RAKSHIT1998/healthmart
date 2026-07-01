import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicApiFetch, ApiClientError } from '@/lib/api';
import { ProductDetail } from '@/components/product/product-detail';
import type { MedicineDetailResponse } from '@/types';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getMedicine(slug: string): Promise<MedicineDetailResponse | null> {
  try {
    return await publicApiFetch<MedicineDetailResponse>(`/medicines/slug/${slug}`);
  } catch (err) {
    if (err instanceof ApiClientError && err.statusCode === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMedicine(slug);
  if (!data) return { title: 'Medicine not found' };

  const { medicine } = data;
  return {
    title: medicine.name,
    description: medicine.shortDescription || medicine.description.slice(0, 160),
    openGraph: {
      title: medicine.name,
      description: medicine.shortDescription || medicine.description.slice(0, 160),
      images: medicine.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getMedicine(slug);
  if (!data) notFound();

  const { medicine } = data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: medicine.name,
    image: medicine.images,
    description: medicine.shortDescription || medicine.description,
    sku: medicine.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: medicine.sellingPrice,
      availability: data.availability.availableQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(medicine.ratingsCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: medicine.ratingsAverage,
            reviewCount: medicine.ratingsCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail data={data} />
    </>
  );
}
