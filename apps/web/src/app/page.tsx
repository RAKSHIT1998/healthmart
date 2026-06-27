import { HeroSection } from '@/components/home/hero-section';
import { CategoryGrid } from '@/components/home/category-grid';
import { ProductSection } from '@/components/home/product-section';
import { Testimonials } from '@/components/home/testimonials';
import { FaqSection } from '@/components/home/faq-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <ProductSection title="Trending Now" subtitle="Most popular picks this week" query="sortBy=popularity&limit=12" viewAllHref="/shop?sortBy=popularity" />
      <ProductSection title="Best Deals" subtitle="Biggest discounts, while stocks last" query="sortBy=discount&limit=12" viewAllHref="/shop?sortBy=discount" />
      <ProductSection title="New Arrivals" query="sortBy=newest&limit=12" viewAllHref="/shop?sortBy=newest" />
      <Testimonials />
      <FaqSection />
    </>
  );
}
