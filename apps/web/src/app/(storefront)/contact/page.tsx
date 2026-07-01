import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with BuyMedicines.store for order support, prescriptions, or general queries.',
};

export default function ContactPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">We&apos;re here to help with orders, prescriptions, and anything else.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-5 w-5 text-primary" /> +91 1800-123-4567 (Toll-free, 24x7)
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-5 w-5 text-primary" /> support@buymedicine.store
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-5 w-5 text-primary" /> 123 MG Road, Bengaluru, Karnataka 560001
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
