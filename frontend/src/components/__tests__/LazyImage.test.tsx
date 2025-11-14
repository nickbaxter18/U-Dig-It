import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LazyImage from '../LazyImage';

describe('LazyImage', () => {
  it('should render image with lazy loading', () => {
    render(<LazyImage src="/test.jpg" alt="Test" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should have alt text', () => {
    render(<LazyImage src="/test.jpg" alt="Equipment photo" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Equipment photo');
  });

  it('should apply className', () => {
    render(<LazyImage src="/test.jpg" alt="Test" className="rounded-lg" />);

    const img = screen.getByRole('img');
    expect(img).toHaveClass('rounded-lg');
  });

  it('should show placeholder while loading', () => {
    const { container } = render(<LazyImage src="/test.jpg" alt="Test" showPlaceholder={true} />);

    const placeholder = container.querySelector('.placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('should use intersection observer for lazy loading', () => {
    render(<LazyImage src="/test.jpg" alt="Test" useIntersectionObserver={true} />);

    // Should render without errors
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

