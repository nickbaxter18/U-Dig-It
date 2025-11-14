import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EquipmentSearch from '../EquipmentSearch';

describe('EquipmentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render search input', () => {
    render(<EquipmentSearch />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should have placeholder text', () => {
    render(<EquipmentSearch />);
    expect(screen.getByPlaceholderText(/search equipment/i)).toBeInTheDocument();
  });

  it('should trigger search on typing', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    render(<EquipmentSearch />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'SVL');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/equipment/search'),
        expect.any(Object)
      );
    });
  });

  it('should display search results', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [
          { id: '1', name: 'Kubota SVL-75', model: 'SVL75-2' },
        ],
      }),
    });

    render(<EquipmentSearch />);

    await user.type(screen.getByRole('searchbox'), 'SVL');

    await waitFor(() => {
      expect(screen.getByText(/kubota svl-75/i)).toBeInTheDocument();
    });
  });

  it('should show no results message', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    render(<EquipmentSearch />);

    await user.type(screen.getByRole('searchbox'), 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  it('should debounce search requests', async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    render(<EquipmentSearch />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'SVL75');

    // Should not call immediately for each keystroke
    expect(global.fetch).not.toHaveBeenCalledTimes(5);
  });
});


