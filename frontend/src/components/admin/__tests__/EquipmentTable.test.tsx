import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipmentTable } from '../EquipmentTable';
import { createTestEquipment } from '@/test-utils';

describe('EquipmentTable', () => {
  const mockOnEquipmentSelect = vi.fn();
  const mockOnEquipmentUpdate = vi.fn();
  const mockOnStatusUpdate = vi.fn();

  const defaultProps = {
    equipment: [
      createTestEquipment({ unitId: 'SVL75-001', status: 'available' }),
      createTestEquipment({ unitId: 'SVL75-002', status: 'in_use' }),
    ],
    loading: false,
    onEquipmentSelect: mockOnEquipmentSelect,
    onEquipmentUpdate: mockOnEquipmentUpdate,
    onStatusUpdate: mockOnStatusUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<EquipmentTable {...defaultProps} loading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should hide table when loading', () => {
      render(<EquipmentTable {...defaultProps} loading={true} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('should render table headers', () => {
      render(<EquipmentTable {...defaultProps} />);

      expect(screen.getByText('Unit ID')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should render all equipment rows', () => {
      render(<EquipmentTable {...defaultProps} />);

      expect(screen.getByText('SVL75-001')).toBeInTheDocument();
      expect(screen.getByText('SVL75-002')).toBeInTheDocument();
    });

    it('should show empty state when no equipment', () => {
      render(<EquipmentTable {...defaultProps} equipment={[]} />);
      expect(screen.getByText(/no equipment found/i)).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show available status with green badge', () => {
      render(<EquipmentTable {...defaultProps} />);

      const availableBadge = screen.getByText('available');
      expect(availableBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should show in_use status with orange badge', () => {
      render(<EquipmentTable {...defaultProps} />);

      const inUseBadge = screen.getByText('in_use');
      expect(inUseBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('should show maintenance status with yellow badge', () => {
      const equipment = [createTestEquipment({ status: 'maintenance' })];
      render(<EquipmentTable {...defaultProps} equipment={equipment} />);

      const badge = screen.getByText('maintenance');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should show retired status with gray badge', () => {
      const equipment = [createTestEquipment({ status: 'retired' })];
      render(<EquipmentTable {...defaultProps} equipment={equipment} />);

      const badge = screen.getByText('retired');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Equipment Actions', () => {
    it('should call onEquipmentSelect when clicking row', async () => {
      const user = userEvent.setup();
      const equipment = createTestEquipment();

      render(<EquipmentTable {...defaultProps} equipment={[equipment]} />);

      const row = screen.getByText(equipment.unitId).closest('tr');
      await user.click(row!);

      expect(mockOnEquipmentSelect).toHaveBeenCalledWith(equipment);
    });

    it('should show action menu for each equipment', () => {
      render(<EquipmentTable {...defaultProps} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions|more/i });
      expect(actionButtons.length).toBe(2);
    });

    it('should open action menu when clicked', async () => {
      const user = userEvent.setup();
      render(<EquipmentTable {...defaultProps} />);

      const actionButton = screen.getAllByRole('button', { name: /actions|more/i })[0];
      await user.click(actionButton);

      expect(screen.getByText(/edit|update status|view/i)).toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    it('should allow changing equipment status', async () => {
      const user = userEvent.setup();
      const equipment = createTestEquipment();

      render(<EquipmentTable {...defaultProps} equipment={[equipment]} />);

      const actionButton = screen.getByRole('button', { name: /actions|more/i });
      await user.click(actionButton);

      const updateStatus = screen.getByText(/update status/i);
      await user.click(updateStatus);

      expect(mockOnStatusUpdate).toHaveBeenCalled();
    });
  });

  describe('Maintenance Information', () => {
    it('should display last maintenance date', () => {
      const equipment = createTestEquipment({
        lastMaintenanceDate: '2025-01-01T00:00:00Z',
      });

      render(<EquipmentTable {...defaultProps} equipment={[equipment]} />);

      expect(screen.getByText(/jan 1, 2025/i)).toBeInTheDocument();
    });

    it('should display next maintenance due date', () => {
      const equipment = createTestEquipment({
        nextMaintenanceDue: '2025-06-01T00:00:00Z',
      });

      render(<EquipmentTable {...defaultProps} equipment={[equipment]} />);

      expect(screen.getByText(/jun 1, 2025/i)).toBeInTheDocument();
    });

    it('should highlight overdue maintenance', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const equipment = createTestEquipment({
        nextMaintenanceDue: yesterday.toISOString(),
      });

      render(<EquipmentTable {...defaultProps} equipment={[equipment]} />);

      const overdueText = screen.getByText(/overdue/i);
      expect(overdueText).toHaveClass('text-red-600');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', () => {
      render(<EquipmentTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have accessible column headers', () => {
      render(<EquipmentTable {...defaultProps} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAccessibleName();
      });
    });

    it('should have accessible action buttons', () => {
      render(<EquipmentTable {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });
});


