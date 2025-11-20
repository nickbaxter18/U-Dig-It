'use client';

/**
 * Centralized Structured Data (Schema.org) components
 * Provides rich snippets for Google Search
 */

// Default StructuredData component for home page
interface StructuredDataProps {
  type: string;
  data: unknown;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

// Pre-defined schemas for home page
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'U-Dig It Rentals Inc',
  alternateName: 'U-Dig It Rentals',
  legalName: 'U-Dig It Rentals Inc.',
  url: 'https://udigit.ca',
  logo: 'https://udigit.ca/images/udigit-logo.png',
  description:
    'Professional Kubota SVL-75 compact track loader rental in Saint John, New Brunswick. Reliable equipment for construction, landscaping, and excavation projects.',
  foundingDate: '2020',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+15066431575',
    contactType: 'customer service',
    email: 'nickbaxter@udigit.ca',
    areaServed: 'CA',
    availableLanguage: ['English', 'French'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '945 Golden Grove Road',
    addressLocality: 'Saint John',
    addressRegion: 'NB',
    postalCode: 'E2H 2X1',
    addressCountry: 'CA',
  },
};

export const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: '2025 Kubota SVL75-3 Compact Track Loader Rental',
  description:
    'Professional compact track loader rental in Saint John, NB. 74.3 HP, 9,190 lb operating weight, ideal for construction and landscaping.',
  image: 'https://udigit.ca/images/udigit-logo.png',
  brand: {
    '@type': 'Brand',
    name: 'Kubota',
  },
  offers: {
    '@type': 'Offer',
    url: 'https://udigit.ca/book',
    priceCurrency: 'CAD',
    price: '350',
    priceValidUntil: '2025-12-31',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'U-Dig It Rentals Inc',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '47',
  },
};

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Equipment Rental',
  provider: {
    '@type': 'LocalBusiness',
    name: 'U-Dig It Rentals Inc',
  },
  areaServed: {
    '@type': 'City',
    name: 'Saint John',
    containedIn: {
      '@type': 'State',
      name: 'New Brunswick',
    },
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Equipment Rental Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Kubota SVL75-3 Track Loader Rental',
        },
      },
    ],
  },
};

// Named export schemas
interface LocalBusinessSchemaProps {
  name?: string;
  url?: string;
}

export function LocalBusinessSchema({
  name = 'U-Dig It Rentals Inc',
  url = 'https://udigit.ca',
}: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://udigit.ca/#business',
    name: name,
    image: 'https://udigit.ca/images/udigit-logo.png',
    url: url,
    telephone: '+15066431575',
    email: 'nickbaxter@udigit.ca',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '945 Golden Grove Road',
      addressLocality: 'Saint John',
      addressRegion: 'NB',
      postalCode: 'E2H 2X1',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '45.2734',
      longitude: '-66.0633',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '19:00',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Saint John',
        containedIn: {
          '@type': 'State',
          name: 'New Brunswick',
        },
      },
      {
        '@type': 'City',
        name: 'Rothesay',
      },
      {
        '@type': 'City',
        name: 'Quispamsis',
      },
      {
        '@type': 'City',
        name: 'Grand Bay-Westfield',
      },
      {
        '@type': 'City',
        name: 'Hampton',
      },
    ],
    sameAs: [
      'https://www.facebook.com/udigitrental',
      'https://www.instagram.com/udigitrental',
      'https://twitter.com/udigitrental',
      'https://www.youtube.com/@udigitrental',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '47',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'U-Dig It Rentals Inc',
    alternateName: 'U-Dig It Rentals',
    legalName: 'U-Dig It Rentals Inc.',
    url: 'https://udigit.ca',
    logo: 'https://udigit.ca/images/udigit-logo.png',
    description:
      'Professional Kubota SVL-75 compact track loader rental in Saint John, New Brunswick. Reliable equipment for construction, landscaping, and excavation projects.',
    foundingDate: '2020',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+15066431575',
      contactType: 'customer service',
      email: 'nickbaxter@udigit.ca',
      areaServed: 'CA',
      availableLanguage: ['English', 'French'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  name: string;
  description: string;
  price: string;
  image?: string;
}

export function ProductSchema({
  name,
  description,
  price,
  image = 'https://udigit.ca/images/udigit-logo.png',
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: image,
    brand: {
      '@type': 'Brand',
      name: 'Kubota',
    },
    offers: {
      '@type': 'Offer',
      url: 'https://udigit.ca/book',
      priceCurrency: 'CAD',
      price: price,
      priceValidUntil: '2025-12-31',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'U-Dig It Rentals Inc',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '47',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item: unknown, index: unknown) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'U-Dig It Rentals',
    url: 'https://udigit.ca',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://udigit.ca/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * ImageObject Schema for equipment photos and location images
 * Improves Google Image Search rankings and visibility
 */
interface ImageObjectSchemaProps {
  imageUrl: string;
  name: string;
  description: string;
  location?: string;
  width?: number;
  height?: number;
}

export function ImageObjectSchema({
  imageUrl,
  name,
  description,
  location = 'Saint John, New Brunswick',
  width = 1200,
  height = 800,
}: ImageObjectSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: imageUrl,
    name: name,
    description: description,
    width: `${width}px`,
    height: `${height}px`,
    uploadDate: '2025-11-02',
    creator: {
      '@type': 'Organization',
      name: 'U-Dig It Rentals Inc.',
      url: 'https://udigit.ca',
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: 'U-Dig It Rentals Inc.',
    },
    copyrightNotice: '© 2025 U-Dig It Rentals Inc. All rights reserved.',
    creditText: 'U-Dig It Rentals Inc.',
    acquireLicensePage: 'https://udigit.ca/terms',
    contentLocation: {
      '@type': 'Place',
      name: location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: location.split(',')[0],
        addressRegion: 'NB',
        addressCountry: 'CA',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
