import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How BuyMedicines.store collects, uses, and protects your personal and health information.',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly — name, phone number, email, delivery addresses, and prescription images — as well as order history, device identifiers for push notifications, and approximate location for delivery and store-availability purposes.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used to process orders, verify prescriptions with our licensed pharmacists, deliver medicines, send order and promotional updates, and improve our catalog and service quality. Prescription images are only accessible to verifying pharmacists and are never sold or shared with third parties for marketing.',
  },
  {
    title: '3. Payment Information',
    body: 'Payments are processed by Cashfree, a PCI-DSS compliant payment gateway. We do not store your card, UPI, or net-banking credentials on our servers.',
  },
  {
    title: '4. Data Sharing',
    body: 'We share order and delivery details with our delivery partners and, where required, with our ERP/inventory partner (MARG) strictly for stock and billing reconciliation. We do not sell your personal data.',
  },
  {
    title: '5. Data Retention & Security',
    body: 'We retain order and prescription records as required under applicable drug-control regulations and use industry-standard encryption, access controls, and audit logging to protect your data.',
  },
  {
    title: '6. Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal data by contacting support@buymedicine.store, subject to regulatory retention requirements for pharmacy records.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
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
