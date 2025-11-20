import { createTestEquipment } from '@/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentModal } from '../EquipmentModal';

describe('EquipmentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render empty form for new equipment', () => {
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(
        screen.getByRole('heading', { name: /add.*equipment|new equipment/i })
      ).toBeInTheDocument();
    });

    it('should have all required fields', () => {
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByLabelText(/unit id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/daily rate/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await user.click(screen.getByRole('button', { name: /save|create/i }));

      await waitFor(() => {
        expect(screen.getByText(/unit id.*required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const equipment = createTestEquipment();

    it('should pre-fill form with equipment data', () => {
      render(
        <EquipmentModal
          isOpen={true}
          mode="edit"
          equipment={equipment}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue(equipment.unitId)).toBeInTheDocument();
      expect(screen.getByDisplayValue(equipment.type)).toBeInTheDocument();
    });

    it('should allow updating equipment data', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentModal
          isOpen={true}
          mode="edit"
          equipment={equipment}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const dailyRateInput = screen.getByLabelText(/daily rate/i);
      await user.clear(dailyRateInput);
      await user.type(dailyRateInput, '400');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            dailyRate: 400,
          })
        );
      });
    });
  });

  describe('Validation', () => {
    it('should validate numeric fields', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const dailyRateInput = screen.getByLabelText(/daily rate/i);
      await user.type(dailyRateInput, 'abc');

      await waitFor(() => {
        expect(screen.getByText(/must be.*number/i)).toBeInTheDocument();
      });
    });

    it('should validate rate is positive', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const dailyRateInput = screen.getByLabelText(/daily rate/i);
      await user.type(dailyRateInput, '-100');

      await waitFor(() => {
        expect(screen.getByText(/must be positive|greater than zero/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Actions', () => {
    it('should call onClose when clicking cancel', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      render(
        <EquipmentModal isOpen={true} mode="create" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await user.type(screen.getByLabelText(/unit id/i), 'SVL75-999');
      await user.click(screen.getByRole('button', { name: /save|create/i }));

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });
});
