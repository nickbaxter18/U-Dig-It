import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StructuredData from '../StructuredData';

describe('StructuredData', () => {
  it('should render JSON-LD script tag', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'U-Dig It Rentals',
    };

    const { container } = render(<StructuredData data={data} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('should include structured data in script', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Kubota SVL-75',
    };

    const { container } = render(<StructuredData data={data} />);

    const script = container.querySelector('script');
    expect(script?.innerHTML).toContain('Kubota SVL-75');
  });

  it('should escape HTML in data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      description: '<script>alert("xss")</script>',
    };

    const { container } = render(<StructuredData data={data} />);

    const script = container.querySelector('script');
    expect(script?.innerHTML).not.toContain('<script>alert');
  });

  it('should handle nested objects', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      offers: {
        '@type': 'Offer',
        price: '350',
      },
    };

    const { container } = render(<StructuredData data={data} />);

    const script = container.querySelector('script');
    expect(script?.innerHTML).toContain('Offer');
  });
});

