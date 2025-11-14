import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('should render image', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" width={400} height={300} />);
    expect(screen.getByRole('img', { name: /test image/i })).toBeInTheDocument();
  });

  it('should have alt text', () => {
    render(<OptimizedImage src="/test.jpg" alt="Equipment photo" width={400} height={300} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Equipment photo');
  });

  it('should lazy load by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={400} height={300} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should allow eager loading', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={400} height={300} priority={true} />);

    const img = screen.getByRole('img');
    expect(img).not.toHaveAttribute('loading', 'lazy');
  });

  it('should apply custom className', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={400} height={300} className="custom-class" />);

    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('should have proper dimensions', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={800} height={600} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });
});

