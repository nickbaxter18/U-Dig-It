import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocationPicker from '../LocationPicker';

describe('LocationPicker', () => {
  const mockOnLocationSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render address input', () => {
    render(<LocationPicker onLocationSelect={mockOnLocationSelect} />);
    expect(screen.getByLabelText(/address|location/i)).toBeInTheDocument();
  });

  it('should show autocomplete suggestions when typing', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        predictions: [
          { description: '123 Main St, Saint John, NB', place_id: 'place1' },
        ],
      }),
    });

    render(<LocationPicker onLocationSelect={mockOnLocationSelect} />);

    const input = screen.getByLabelText(/address/i);
    await user.type(input, '123 Main');

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    });
  });

  it('should call onLocationSelect when selecting suggestion', async () => {
    const user = userEvent.setup();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          predictions: [{ description: '123 Main St', place_id: 'place1' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { geometry: { location: { lat: 45.27, lng: -66.06 } } },
        }),
      });

    render(<LocationPicker onLocationSelect={mockOnLocationSelect} />);

    await user.type(screen.getByLabelText(/address/i), '123');

    await waitFor(() => screen.getByText(/123 Main St/i));

    await user.click(screen.getByText(/123 Main St/i));

    await waitFor(() => {
      expect(mockOnLocationSelect).toHaveBeenCalled();
    });
  });

  it('should display distance calculation', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ distance: 15.5 }),
    });

    render(<LocationPicker onLocationSelect={mockOnLocationSelect} showDistance={true} />);

    await user.type(screen.getByLabelText(/address/i), '123 Main St');

    await waitFor(() => {
      expect(screen.getByText(/15\.5 km/i)).toBeInTheDocument();
    });
  });
});


