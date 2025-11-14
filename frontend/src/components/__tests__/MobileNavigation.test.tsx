import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MobileNavigation from '../MobileNavigation';

const mockUseAuth = vi.fn();
vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('MobileNavigation', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
  });

  it('should render mobile menu button', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('should open menu when clicking button', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByRole('navigation')).toBeVisible();
  });

  it('should show navigation links when open', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /equipment/i })).toBeInTheDocument();
  });

  it('should close menu when clicking link', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    const homeLink = screen.getByRole('link', { name: /home/i });
    await user.click(homeLink);

    // Menu should close
    expect(screen.queryByRole('navigation')).not.toBeVisible();
  });

  it('should show sign in link when not authenticated', async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show dashboard link when authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-123' }, loading: false });
    const user = userEvent.setup();

    render(<MobileNavigation />);
    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });
});


