import type { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/images/kubota-svl-75-hero.png',
    url = 'https://udigit.ca',
    type = 'website',
  } = config;

  const fullTitle = title.includes('U-Dig It Rentals') ? title : `${title} | U-Dig It Rentals`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'equipment rental',
      'Kubota',
      'SVL-75',
      'Saint John',
      'New Brunswick',
      'construction',
      'excavation',
      'compact track loader',
      ...keywords,
    ],
    authors: [{ name: 'U-Dig It Rentals' }],
    creator: 'U-Dig It Rentals',
    publisher: 'U-Dig It Rentals',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://udigit.ca'),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'U-Dig It Rentals',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_CA',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
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
  };
}

// Predefined SEO configurations for common pages
export const SEO_PAGES = {
  HOME: {
    title: 'Professional Equipment Rental in Saint John, NB',
    description:
      'Professional Kubota SVL-75 equipment rental in Saint John, New Brunswick. Reliable, efficient, and ready for your next project.',
    keywords: ['equipment rental', 'Kubota SVL-75', 'Saint John', 'New Brunswick'],
    url: 'https://udigit.ca',
  },
  BOOKING: {
    title: 'Book Equipment Online',
    description:
      'Book your Kubota SVL-75 equipment rental online. Easy booking process with instant confirmation.',
    keywords: ['book equipment', 'online booking', 'rental booking'],
    url: 'https://udigit.ca/book',
  },
  ADMIN: {
    title: 'Admin Dashboard',
    description: 'Manage bookings, track revenue, and monitor equipment performance.',
    keywords: ['admin', 'dashboard', 'management'],
    url: 'https://udigit.ca/admin',
  },
  ABOUT: {
    title: 'About U-Dig It Rentals',
    description:
      'Learn about our professional equipment rental services in Saint John, New Brunswick.',
    keywords: ['about', 'company', 'services'],
    url: 'https://udigit.ca/about',
  },
  CONTACT: {
    title: 'Contact Us',
    description: 'Get in touch with U-Dig It Rentals for your equipment rental needs.',
    keywords: ['contact', 'phone', 'email', 'location'],
    url: 'https://udigit.ca/contact',
  },
} as const;
