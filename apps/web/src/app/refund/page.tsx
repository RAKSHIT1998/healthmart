import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Medicare Medical Store refund, return, and order cancellation policy.',
};

const SECTIONS = [
  {
    title: '1. Order Cancellation',
    body: 'Orders can be cancelled free of charge any time before they are packed. Once an order has been packed or dispatched, it cannot be cancelled but may be eligible for return on delivery if items are damaged or incorrect.',
  },
  {
    title: '2. Returns',
    body: 'Unopened, undamaged non-prescription items in their original packaging can be returned within 7 days of delivery. Prescription medicines cannot be returned once delivered, regardless of condition, in line with pharmacy regulations. Temperature-sensitive medicines (e.g. insulin, vaccines), opened strips, and personal-care items that have been used are also not eligible for return for safety and hygiene reasons.',
  },
  {
    title: '3. Refunds',
    body: 'Approved refunds are credited to your original payment method within 5-7 business days, or instantly to your Medicare Wallet if you choose wallet credit. Cash on Delivery refunds are processed via bank transfer or wallet credit.',
  },
  {
    title: '4. Damaged or Incorrect Items',
    body: 'If you receive a damaged, expired, or incorrect item, please report it within 48 hours of delivery via the Order Tracking page or by contacting support, along with a photo of the item.',
  },
  {
    title: '5. Failed Payments',
    body: 'If a payment is deducted but the order is not confirmed, the amount is automatically reversed by Cashfree within 5-7 business days. Stock reserved for the order is released within 15 minutes of payment failure.',
  },
];

export default function RefundPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Refund & Cancellation Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
