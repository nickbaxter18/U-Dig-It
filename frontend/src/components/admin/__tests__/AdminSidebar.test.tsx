import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminSidebar } from '../AdminSidebar';

describe('AdminSidebar', () => {
  it('should render navigation links', () => {
    render(<AdminSidebar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bookings/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /equipment/i })).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    render(<AdminSidebar />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('link', { name: /bookings/i })).toHaveAttribute('href', '/admin/bookings');
  });

  it('should highlight active link', () => {
    render(<AdminSidebar activePath="/admin/bookings" />);

    const bookingsLink = screen.getByRole('link', { name: /bookings/i });
    expect(bookingsLink).toHaveClass(/active|bg-/);
  });

  it('should render all admin sections', () => {
    render(<AdminSidebar />);

    const sections = ['Dashboard', 'Bookings', 'Equipment', 'Customers', 'Analytics', 'Settings'];
    sections.forEach(section => {
      expect(screen.getByText(new RegExp(section, 'i'))).toBeInTheDocument();
    });
  });
});


