import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationCenter from '../NotificationCenter';

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification bell icon', () => {
    render(<NotificationCenter />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('should show notification count badge', () => {
    render(<NotificationCenter notificationCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should open notification panel when clicking bell', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should display notification list', async () => {
    const user = userEvent.setup();
    const notifications = [
      { id: '1', message: 'Booking confirmed', read: false },
      { id: '2', message: 'Payment received', read: true },
    ];

    render(<NotificationCenter notifications={notifications} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
    expect(screen.getByText('Payment received')).toBeInTheDocument();
  });

  it('should highlight unread notifications', async () => {
    const user = userEvent.setup();
    const notifications = [
      { id: '1', message: 'New message', read: false },
    ];

    render(<NotificationCenter notifications={notifications} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    const unreadNotification = screen.getByText('New message');
    expect(unreadNotification).toHaveClass(/font-bold|bg-blue/);
  });

  it('should show empty state when no notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter notifications={[]} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('should mark as read when clicking notification', async () => {
    const user = userEvent.setup();
    const mockOnRead = vi.fn();
    const notifications = [{ id: '1', message: 'Test', read: false }];

    render(<NotificationCenter notifications={notifications} onMarkAsRead={mockOnRead} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await user.click(screen.getByText('Test'));

    expect(mockOnRead).toHaveBeenCalledWith('1');
  });
});
