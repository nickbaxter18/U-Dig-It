import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MobileMenu from '../MobileMenu';

const mockUseAuth = vi.fn();
vi.mock('@/components/providers/SupabaseAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('MobileMenu', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
  });

  it('should render menu button', () => {
    render(<MobileMenu />);
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('should open menu on click', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should close menu when clicking close', async () => {
    const user = userEvent.setup();
    const { container } = render(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should show navigation links', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /book/i })).toBeInTheDocument();
  });
});

