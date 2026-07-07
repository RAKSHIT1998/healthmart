import { HeroSlider } from '@/components/home/hero-slider';
import { HeroSection } from '@/components/home/hero-section';
import { FlashSaleBanner } from '@/components/home/flash-sale-banner';
import { CategoryGrid } from '@/components/home/category-grid';
import { ProductSection } from '@/components/home/product-section';
import { DoctorConsultBanner } from '@/components/home/doctor-consult-banner';
import { Testimonials } from '@/components/home/testimonials';
import { FaqSection } from '@/components/home/faq-section';

// The API isn't running yet during the Docker build step, so a statically
// prerendered homepage would freeze in with empty product/category sections
// forever. Force this page to render per-request against the live API instead.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <HeroSection />
      <FlashSaleBanner />
      <CategoryGrid />
      <ProductSection title="Trending Now" subtitle="Most popular picks this week" query="sortBy=popularity&limit=12" viewAllHref="/shop?sortBy=popularity" />
      <DoctorConsultBanner />
      <ProductSection title="Best Deals" subtitle="Biggest discounts, while stocks last" query="sortBy=discount&limit=12" viewAllHref="/shop?sortBy=discount" />
      <ProductSection title="New Arrivals" query="sortBy=newest&limit=12" viewAllHref="/shop?sortBy=newest" />
      <Testimonials />
      <FaqSection />
    </>
  );
}
