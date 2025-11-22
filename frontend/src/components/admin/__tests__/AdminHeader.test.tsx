import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdminHeader } from '../AdminHeader';

const mockUseAuth = vi.fn();
const mockSignOut = vi.fn();
const mockOnMenuClick = vi.fn();

vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        user_metadata: { firstName: 'Admin' },
      },
      role: 'admin',
      signOut: mockSignOut,
    });
  });

  it('should render admin header', () => {
    render(<AdminHeader onMenuClick={mockOnMenuClick} />);
    expect(screen.getByText(/kubota rental platform/i)).toBeInTheDocument();
    expect(screen.getByText(/administration dashboard/i)).toBeInTheDocument();
  });

  it('should display admin user name in dropdown', async () => {
    const user = userEvent.setup();
    render(<AdminHeader onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('should have sign out option in dropdown', async () => {
    const user = userEvent.setup();
    render(<AdminHeader onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('should display role badge for admin', async () => {
    const user = userEvent.setup();
    render(<AdminHeader onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('should display super admin role badge', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'super-admin-123',
        email: 'superadmin@test.com',
        user_metadata: { firstName: 'Super' },
      },
      role: 'super_admin',
      signOut: mockSignOut,
    });

    const user = userEvent.setup();
    render(<AdminHeader onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(userMenuButton);

    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
  });
});
