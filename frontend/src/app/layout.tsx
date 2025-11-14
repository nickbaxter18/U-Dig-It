import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LocalBusinessSchema, OrganizationSchema, WebSiteSchema } from '../components/StructuredData';
import ClientProviders from '../components/providers/ClientProviders';
import '../styles/signature-fonts.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
});

export const metadata: Metadata = {
  title: {
    default: 'Kubota SVL75-3 Rental Saint John NB | Professional Equipment | U-Dig It Rentals',
    template: '%s | U-Dig It Rentals Saint John NB',
  },
  description:
    'Professional Kubota SVL75-3 compact track loader rental in Saint John, New Brunswick. $350/day, delivery included, 24/7 support, insurance help. Book online or call (506) 643-1575 today!',
  keywords:
    'kubota svl75-3 rental saint john, skid steer rental nb, compact track loader new brunswick, equipment rental saint john, excavation equipment nb, construction equipment rental, landscaping equipment',
  authors: [{ name: 'U-Dig It Rentals' }],
  creator: 'U-Dig It Rentals',
  publisher: 'U-Dig It Rentals',
  applicationName: 'U-Dig It Rentals',
  category: 'Construction Equipment Rental',
  classification: 'Business',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://udigit.ca'),
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  openGraph: {
    title: 'Kubota SVL75-3 Rental Saint John | U-Dig It Rentals',
    description: 'Professional track loader rental with delivery, insurance help & 24/7 support in Saint John, NB. Same-day availability. Call (506) 643-1575.',
    url: 'https://udigit.ca',
    siteName: 'U-Dig It Rentals Inc',
    images: [
      {
        url: 'https://udigit.ca/images/kubota-svl-75-hero.png',
        width: 1200,
        height: 630,
        alt: 'Kubota SVL75-3 Compact Track Loader Rental Saint John NB',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kubota SVL75-3 Rental Saint John | U-Dig It',
    description: 'Professional equipment rental with delivery & support. Book online today!',
    images: ['https://udigit.ca/images/kubota-svl-75-hero.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'U-Dig It Rentals',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data - Global Schemas */}
        <LocalBusinessSchema />
        <OrganizationSchema />
        <WebSiteSchema />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#A90F0F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="U-Dig It Rentals" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ClientProviders>{children}</ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
