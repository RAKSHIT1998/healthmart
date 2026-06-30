import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using the Medicare Medical Store platform.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using Medicare Medical Store, you agree to be bound by these Terms & Conditions and our Privacy Policy.',
  },
  {
    title: '2. Prescription Medicines',
    body: 'Schedule H, H1, and X drugs are dispensed only against a valid prescription from a registered medical practitioner, verified by our licensed pharmacist. We reserve the right to reject any order where the prescription is invalid, expired, or unclear.',
  },
  {
    title: '3. Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your account and OTP. Medicare Medical Store is not liable for unauthorized access resulting from your failure to safeguard your login credentials.',
  },
  {
    title: '4. Pricing & Availability',
    body: 'Prices, discounts, and stock availability are subject to change without notice and are synced regularly with our inventory systems. In rare cases of stock unavailability after order placement, we will notify you and process a full refund for the affected items.',
  },
  {
    title: '5. Limitation of Liability',
    body: 'Medicare Medical Store is a marketplace connecting you with licensed pharmacy partners and is not a substitute for professional medical advice. Always consult a qualified healthcare provider before starting, stopping, or changing any medication.',
  },
  {
    title: '6. Governing Law',
    body: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.',
  },
];

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
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
