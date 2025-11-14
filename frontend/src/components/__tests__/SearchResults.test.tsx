import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchResults from '../SearchResults';
import { createTestEquipment } from '@/test-utils';

describe('SearchResults', () => {
  const mockOnSelect = vi.fn();

  it('should render search results', () => {
    const results = [createTestEquipment(), createTestEquipment()];
    render(<SearchResults results={results} onSelect={mockOnSelect} />);

    expect(screen.getAllByRole('listitem').length).toBe(2);
  });

  it('should display equipment information', () => {
    const equipment = createTestEquipment({ unitId: 'SVL75-001', type: 'SVL75' });
    render(<SearchResults results={[equipment]} onSelect={mockOnSelect} />);

    expect(screen.getByText('SVL75-001')).toBeInTheDocument();
    expect(screen.getByText(/SVL75/)).toBeInTheDocument();
  });

  it('should show equipment rate', () => {
    const equipment = createTestEquipment({ dailyRate: 350 });
    render(<SearchResults results={[equipment]} onSelect={mockOnSelect} />);

    expect(screen.getByText(/\$350/)).toBeInTheDocument();
  });

  it('should call onSelect when clicking result', async () => {
    const user = userEvent.setup();
    const equipment = createTestEquipment();
    render(<SearchResults results={[equipment]} onSelect={mockOnSelect} />);

    await user.click(screen.getByRole('listitem'));
    expect(mockOnSelect).toHaveBeenCalledWith(equipment);
  });

  it('should show empty state when no results', () => {
    render(<SearchResults results={[]} onSelect={mockOnSelect} />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<SearchResults results={[]} loading={true} onSelect={mockOnSelect} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

