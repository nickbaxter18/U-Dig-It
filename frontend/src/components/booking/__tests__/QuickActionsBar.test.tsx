import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuickActionsBar } from '../QuickActionsBar';

describe('QuickActionsBar', () => {
  const mockOnEdit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnDownload = vi.fn();

  it('should render action buttons', () => {
    render(<QuickActionsBar onEdit={mockOnEdit} onCancel={mockOnCancel} onDownload={mockOnDownload} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('should call onEdit when edit clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionsBar onEdit={mockOnEdit} onCancel={mockOnCancel} onDownload={mockOnDownload} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('should call onCancel when cancel clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionsBar onEdit={mockOnEdit} onCancel={mockOnCancel} onDownload={mockOnDownload} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should hide actions when not provided', () => {
    render(<QuickActionsBar />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});


