import { HeroSection } from '@/components/home/hero-section';
import { FlashSaleBanner } from '@/components/home/flash-sale-banner';
import { CategoryGrid } from '@/components/home/category-grid';
import { ProductSection } from '@/components/home/product-section';
import { DoctorConsultBanner } from '@/components/home/doctor-consult-banner';
import { Testimonials } from '@/components/home/testimonials';
import { FaqSection } from '@/components/home/faq-section';

export default function HomePage() {
  return (
    <>
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
