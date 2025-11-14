import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminHeader } from '../AdminHeader';

const mockUseAuth = vi.fn();
vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-123', email: 'admin@test.com', user_metadata: { role: 'admin', firstName: 'Admin' } },
    });
  });

  it('should render admin header', () => {
    render(<AdminHeader />);
    expect(screen.getByText(/admin|dashboard/i)).toBeInTheDocument();
  });

  it('should display admin user name', () => {
    render(<AdminHeader />);
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('should have profile dropdown', async () => {
    const user = userEvent.setup();
    render(<AdminHeader />);

    const profileButton = screen.getByRole('button', { name: /profile|admin/i });
    await user.click(profileButton);

    expect(screen.getByText(/settings|logout/i)).toBeInTheDocument();
  });

  it('should have logout option', async () => {
    const user = userEvent.setup();
    render(<AdminHeader />);

    const profileButton = screen.getByRole('button', { name: /profile|admin/i });
    await user.click(profileButton);

    expect(screen.getByRole('button', { name: /logout|sign out/i })).toBeInTheDocument();
  });
});


