import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipmentRiderSection } from '../EquipmentRiderSection';

describe('EquipmentRiderSection', () => {
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render equipment rider content', () => {
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);
    expect(screen.getByText(/equipment rider|safety guidelines/i)).toBeInTheDocument();
  });

  it('should display safety guidelines', () => {
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);
    expect(screen.getByText(/safety|operating instructions/i)).toBeInTheDocument();
  });

  it('should have acceptance checkbox', () => {
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);
    expect(screen.getByRole('checkbox', { name: /accept|agree/i })).toBeInTheDocument();
  });

  it('should call onAccept when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox', { name: /accept|agree/i });
    await user.click(checkbox);

    expect(mockOnAccept).toHaveBeenCalledWith(true);
  });

  it('should disable continue button until accepted', () => {
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);

    const continueButton = screen.getByRole('button', { name: /continue|next/i });
    expect(continueButton).toBeDisabled();
  });

  it('should enable continue button after accepting', async () => {
    const user = userEvent.setup();
    render(<EquipmentRiderSection onAccept={mockOnAccept} />);

    const checkbox = screen.getByRole('checkbox', { name: /accept|agree/i });
    await user.click(checkbox);

    const continueButton = screen.getByRole('button', { name: /continue|next/i });
    expect(continueButton).not.toBeDisabled();
  });
});


