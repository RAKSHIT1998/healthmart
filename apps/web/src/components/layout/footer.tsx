import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '@healthmart/shared';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Medicines', href: '/shop' },
      { label: 'Healthcare', href: '/shop?categoryGroup=healthcare' },
      { label: 'Baby Care', href: '/shop?categoryGroup=baby_care' },
      { label: 'Personal Care', href: '/shop?categoryGroup=personal_care' },
      { label: 'Devices', href: '/shop?categoryGroup=devices' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Health Blog', href: '/blog' },
      { label: 'Upload Prescription', href: '/prescription-upload' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">M</span>
            <span className="text-base font-bold text-primary">{APP_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
