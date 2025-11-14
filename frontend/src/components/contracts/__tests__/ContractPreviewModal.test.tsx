import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractPreviewModal } from '../ContractPreviewModal';

describe('ContractPreviewModal', () => {
  const mockOnClose = vi.fn();
  const contractData = {
    bookingNumber: 'UDR-2025-001',
    customerName: 'John Doe',
    equipmentModel: 'Kubota SVL-75',
    startDate: '2025-02-01',
    endDate: '2025-02-05',
    totalAmount: 1400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display contract content', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);

    expect(screen.getByText(/rental agreement/i)).toBeInTheDocument();
    expect(screen.getByText(contractData.bookingNumber)).toBeInTheDocument();
  });

  it('should display all contract terms', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);

    expect(screen.getByText(/terms.*conditions/i)).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should call onClose when clicking close', async () => {
    const user = userEvent.setup();
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display customer information', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display equipment information', () => {
    render(<ContractPreviewModal isOpen={true} contractData={contractData} onClose={mockOnClose} />);
    expect(screen.getByText(/kubota svl-75/i)).toBeInTheDocument();
  });
});


