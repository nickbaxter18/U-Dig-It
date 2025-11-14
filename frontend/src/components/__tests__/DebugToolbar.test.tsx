import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DebugToolbar from '../DebugToolbar';

describe('DebugToolbar', () => {
  it('should only render in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { container } = render(<DebugToolbar />);
    expect(container.firstChild).toBeNull();

    process.env.NODE_ENV = originalEnv;
  });

  it('should render in development mode', () => {
    process.env.NODE_ENV = 'development';

    render(<DebugToolbar />);
    expect(screen.getByText(/debug/i)).toBeInTheDocument();

    process.env.NODE_ENV = 'test';
  });

  it('should show current environment', () => {
    process.env.NODE_ENV = 'development';

    render(<DebugToolbar />);
    expect(screen.getByText(/development|dev/i)).toBeInTheDocument();

    process.env.NODE_ENV = 'test';
  });

  it('should toggle visibility', async () => {
    const user = userEvent.setup();
    process.env.NODE_ENV = 'development';

    render(<DebugToolbar />);

    const toggleButton = screen.getByRole('button', { name: /toggle|hide|show/i });
    const initialVisibility = screen.queryByText(/auth state|user info/i);

    await user.click(toggleButton);

    const afterClick = screen.queryByText(/auth state|user info/i);
    expect(afterClick !== initialVisibility).toBe(true);

    process.env.NODE_ENV = 'test';
  });
});

