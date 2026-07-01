import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_NAME, APP_TAGLINE } from '@buymedicines/shared';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${APP_NAME} | ${APP_TAGLINE}`, template: `%s | ${APP_NAME}` },
  description:
    'Order medicines, healthcare products, baby care and personal care items online with same-day delivery. Upload prescriptions and get genuine medicines delivered to your door.',
  keywords: ['online pharmacy', 'medicine delivery', 'buy medicines online', 'healthcare products India'],
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    url: siteUrl,
    siteName: APP_NAME,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_TAGLINE,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
