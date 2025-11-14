import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ServiceAreaLinks from '../ServiceAreaLinks';

describe('ServiceAreaLinks', () => {
  it('should render service area heading', () => {
    render(<ServiceAreaLinks />);
    expect(screen.getByRole('heading', { name: /service areas|we serve/i })).toBeInTheDocument();
  });

  it('should display all service areas', () => {
    render(<ServiceAreaLinks />);

    expect(screen.getByText(/saint john/i)).toBeInTheDocument();
    expect(screen.getByText(/rothesay/i)).toBeInTheDocument();
    expect(screen.getByText(/quispamsis/i)).toBeInTheDocument();
  });

  it('should link to service area pages', () => {
    render(<ServiceAreaLinks />);

    const saintJohnLink = screen.getByRole('link', { name: /saint john/i });
    expect(saintJohnLink).toHaveAttribute('href', expect.stringContaining('/service-areas/saint-john'));
  });

  it('should display all major areas', () => {
    render(<ServiceAreaLinks />);

    const areas = ['Saint John', 'Rothesay', 'Quispamsis', 'Hampton', 'Sussex'];
    areas.forEach(area => {
      expect(screen.getByText(new RegExp(area, 'i'))).toBeInTheDocument();
    });
  });

  it('should have accessible link text', () => {
    render(<ServiceAreaLinks />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAccessibleName();
    });
  });
});

