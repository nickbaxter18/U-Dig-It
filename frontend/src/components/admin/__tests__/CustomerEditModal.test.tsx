import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerEditModal } from '../CustomerEditModal';
import { createTestUser } from '@/test-utils';

const { eqMock, updateMock, fromMock } = vi.hoisted(() => {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { eqMock: eq, updateMock: update, fromMock: from };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('CustomerEditModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const customer = createTestUser({
    address: '123 Main Street',
    city: 'Saint John',
    province: 'NB',
    postalCode: 'E2K 1A1',
    phone: '(506) 555-0101',
    company: 'Test Co',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockClear();
    fromMock.mockClear();
  });

  it('should render when open', () => {
    render(
      <CustomerEditModal
        isOpen={true}
        customer={customer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display customer information in form fields', () => {
    render(
      <CustomerEditModal
        isOpen={true}
        customer={customer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByDisplayValue(customer.firstName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(customer.lastName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(customer.email)).toBeInTheDocument();
  });

  it('should allow editing customer information', async () => {
    const user = userEvent.setup();
    render(
      <CustomerEditModal
        isOpen={true}
        customer={customer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'NewName');

    expect(screen.getByDisplayValue('NewName')).toBeInTheDocument();
  });

  it('should call onSave with updated data', async () => {
    const user = userEvent.setup();
    render(
      <CustomerEditModal
        isOpen={true}
        customer={customer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(eqMock).toHaveBeenCalledWith('id', customer.id);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Updated',
        }),
      );
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should mark critical fields as required', () => {
    render(
      <CustomerEditModal
        isOpen={true}
        customer={customer}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />,
    );

    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
    expect(screen.getByLabelText(/phone/i)).toBeRequired();
    expect(screen.getByLabelText(/street address/i)).toBeRequired();
    expect(screen.getByLabelText(/city/i)).toBeRequired();
    expect(screen.getByLabelText(/province/i)).toBeRequired();
    expect(screen.getByLabelText(/postal code/i)).toBeRequired();
  });
});

