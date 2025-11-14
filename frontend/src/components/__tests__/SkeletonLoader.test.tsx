import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('Rendering', () => {
    it('should render skeleton', () => {
      const { container } = render(<SkeletonLoader />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should have shimmer animation', () => {
      const { container } = render(<SkeletonLoader />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Shape Variants', () => {
    it('should render text skeleton by default', () => {
      const { container } = render(<SkeletonLoader type="text" />);
      const skeleton = container.querySelector('.h-4');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render circle skeleton', () => {
      const { container } = render(<SkeletonLoader type="circle" />);
      const skeleton = container.querySelector('.rounded-full');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render rectangle skeleton', () => {
      const { container } = render(<SkeletonLoader type="rect" />);
      const skeleton = container.querySelector('.rounded');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small skeleton', () => {
      const { container } = render(<SkeletonLoader size="small" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-4');
    });

    it('should render medium skeleton', () => {
      const { container } = render(<SkeletonLoader size="medium" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-8');
    });

    it('should render large skeleton', () => {
      const { container } = render(<SkeletonLoader size="large" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('h-16');
    });
  });

  describe('Multiple Skeletons', () => {
    it('should render specified count of skeletons', () => {
      const { container } = render(<SkeletonLoader count={5} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(5);
    });

    it('should render single skeleton by default', () => {
      const { container } = render(<SkeletonLoader />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-busy attribute', () => {
      const { container } = render(<SkeletonLoader />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label for screen readers', () => {
      const { container } = render(<SkeletonLoader />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });
  });
});


