import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignedContractDisplay } from '../SignedContractDisplay';

describe('SignedContractDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signed contract confirmation', () => {
    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" />);

    expect(screen.getByText(/signed|completed/i)).toBeInTheDocument();
  });

  it('should display booking number', () => {
    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" />);

    expect(screen.getByText('UDR-2025-001')).toBeInTheDocument();
  });

  it('should have download button', () => {
    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" />);

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('should trigger download when clicking download button', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf content'])),
    });

    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" />);

    await user.click(screen.getByRole('button', { name: /download/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/contracts/download-signed')
    );
  });

  it('should show success icon', () => {
    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" />);

    const successIcon = screen.getByRole('img', { name: /success|check/i });
    expect(successIcon).toBeInTheDocument();
  });

  it('should display signed timestamp if provided', () => {
    const signedAt = '2025-01-15T10:30:00Z';
    render(<SignedContractDisplay contractId="contract-123" bookingNumber="UDR-2025-001" signedAt={signedAt} />);

    expect(screen.getByText(/jan 15, 2025/i)).toBeInTheDocument();
  });
});


