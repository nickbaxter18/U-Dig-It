import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthButtons } from '../OAuthButtons';

describe('OAuthButtons', () => {
  const mockOnGoogleClick = vi.fn();
  const mockOnGitHubClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Google button', () => {
    render(<OAuthButtons onGoogleClick={mockOnGoogleClick} />);
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('should render GitHub button if enabled', () => {
    render(<OAuthButtons onGoogleClick={mockOnGoogleClick} onGitHubClick={mockOnGitHubClick} showGitHub={true} />);
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
  });

  it('should call onGoogleClick when clicking Google button', async () => {
    const user = userEvent.setup();
    render(<OAuthButtons onGoogleClick={mockOnGoogleClick} />);

    await user.click(screen.getByRole('button', { name: /google/i }));
    expect(mockOnGoogleClick).toHaveBeenCalled();
  });

  it('should disable buttons when loading', () => {
    render(<OAuthButtons onGoogleClick={mockOnGoogleClick} loading={true} />);

    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled();
  });

  it('should show loading text', () => {
    render(<OAuthButtons onGoogleClick={mockOnGoogleClick} loading={true} />);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });
});


