import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TestimonialsSection from '../TestimonialsSection';

describe('TestimonialsSection', () => {
  it('should render testimonials heading', () => {
    render(<TestimonialsSection />);
    expect(screen.getByRole('heading', { name: /testimonials|reviews|customers say/i })).toBeInTheDocument();
  });

  it('should render testimonial cards', () => {
    render(<TestimonialsSection />);

    const testimonials = screen.getAllByRole('article');
    expect(testimonials.length).toBeGreaterThan(0);
  });

  it('should display customer names', () => {
    render(<TestimonialsSection />);

    const names = screen.getAllByText(/john|sarah|mike|construction|contractor/i);
    expect(names.length).toBeGreaterThan(0);
  });

  it('should display ratings', () => {
    render(<TestimonialsSection />);

    const ratings = screen.getAllByRole('img', { name: /5 stars|rating/i });
    expect(ratings.length).toBeGreaterThan(0);
  });

  it('should display testimonial text', () => {
    render(<TestimonialsSection />);

    const testimonialText = screen.getAllByText(/.{50,}/); // Long text (testimonials)
    expect(testimonialText.length).toBeGreaterThan(0);
  });

  it('should have navigation arrows for carousel', () => {
    render(<TestimonialsSection />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should navigate to next testimonial', async () => {
    const user = userEvent.setup();
    render(<TestimonialsSection />);

    const firstTestimonial = screen.getAllByRole('article')[0].textContent;

    await user.click(screen.getByRole('button', { name: /next/i }));

    const currentTestimonial = screen.getAllByRole('article')[0].textContent;
    expect(currentTestimonial).not.toBe(firstTestimonial);
  });

  it('should auto-advance testimonials', async () => {
    vi.useFakeTimers();
    render(<TestimonialsSection autoPlay={true} />);

    const initial = screen.getAllByRole('article')[0].textContent;

    vi.advanceTimersByTime(5000);

    const after = screen.getAllByRole('article')[0].textContent;
    expect(after).not.toBe(initial);

    vi.useRealTimers();
  });
});

