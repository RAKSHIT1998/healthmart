import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    location: 'Bengaluru',
    rating: 5,
    quote: 'Ordered my mother’s monthly medicines and they arrived within an hour. The prescription upload process was seamless.',
  },
  {
    name: 'Rohit Verma',
    location: 'Delhi',
    rating: 5,
    quote: 'Genuine products, fair prices, and the order tracking actually works. This is now my go-to pharmacy app.',
  },
  {
    name: 'Fatima Khan',
    location: 'Hyderabad',
    rating: 4,
    quote: 'Customer support helped me get a refund quickly when an item was out of stock. Smooth experience overall.',
  },
];

export function Testimonials() {
  return (
    <section className="container py-12">
      <h2 className="mb-6 text-2xl font-bold">What our customers say</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name}>
            <CardContent className="pt-5">
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold">
                {t.name} <span className="font-normal text-muted-foreground">· {t.location}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
