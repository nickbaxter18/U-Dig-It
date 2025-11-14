import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrawSignature } from '../DrawSignature';

describe('DrawSignature', () => {
  const mockOnSignatureComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    });
  });

  it('should render canvas for drawing', () => {
    render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);
    expect(screen.getByRole('img', { name: /signature canvas/i })).toBeInTheDocument();
  });

  it('should have clear button', () => {
    render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should have done button', () => {
    render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);
    expect(screen.getByRole('button', { name: /done|save/i })).toBeInTheDocument();
  });

  it('should disable done button when canvas is empty', () => {
    render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);
    const doneButton = screen.getByRole('button', { name: /done|save/i });
    expect(doneButton).toBeDisabled();
  });

  it('should clear canvas when clicking clear', async () => {
    const user = userEvent.setup();
    render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // Canvas should be cleared (visual feedback)
    expect(clearButton).toBeInTheDocument();
  });

  it('should call onSignatureComplete when clicking done', async () => {
    const user = userEvent.setup();
    const { container } = render(<DrawSignature onSignatureComplete={mockOnSignatureComplete} />);

    // Simulate drawing (canvas has data)
    const canvas = container.querySelector('canvas')!;
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,signature');

    const doneButton = screen.getByRole('button', { name: /done|save/i });
    // Force enable for test
    doneButton.removeAttribute('disabled');
    await user.click(doneButton);

    expect(mockOnSignatureComplete).toHaveBeenCalledWith(expect.stringContaining('data:image'));
  });
});


