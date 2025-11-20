/**
 * Example Test Using MSW (Mock Service Worker)
 *
 * Demonstrates how to test components that fetch data from APIs
 * without making real network requests.
 */
import { server } from '@/test/mocks/server';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

/**
 * Key Benefits of MSW:
 *
 * 1. **No Real Network Requests**: Tests run fast and reliably
 * 2. **Same API as Production**: Use the same fetch/axios code
 * 3. **Easy Error Testing**: Override handlers to test edge cases
 * 4. **Works in Browser Too**: Use in Storybook for interactive testing
 * 5. **Test Isolation**: Each test gets a fresh mock server
 *
 * Usage Tips:
 * - Default handlers are in src/test/mocks/handlers.ts
 * - Override handlers per-test with server.use()
 * - Handlers reset automatically between tests
 * - Check console for unhandled requests (helps catch bugs)
 */

// Dummy React import for JSX
import * as React from 'react';

// Example component that fetches equipment
function EquipmentList() {
  const [equipment, setEquipment] = React.useState<unknown[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/equipment`)
      .then((res) => res.json())
      .then((data) => {
        setEquipment(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {equipment.map((item) => (
        <li key={item.id}>
          {item.name} - ${item.dailyRate}/day
        </li>
      ))}
    </ul>
  );
}

describe('MSW Example: Equipment API', () => {
  it('fetches and displays equipment list', async () => {
    render(<EquipmentList />);

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load (MSW intercepts the request)
    await waitFor(() => {
      expect(screen.getByText(/Kubota SVL-75/)).toBeInTheDocument();
    });

    // Verify equipment is displayed with price
    expect(screen.getByText(/Kubota SVL-75 - \$250\/day/)).toBeInTheDocument();
    expect(screen.getByText(/Mini Excavator - \$200\/day/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Override default handler to return error
    server.use(
      http.get(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/equipment`, () => {
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      })
    );

    render(<EquipmentList />);

    // Wait for error to show
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('handles empty equipment list', async () => {
    // Override default handler to return empty array
    server.use(
      http.get(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/equipment`, () => {
        return HttpResponse.json([]);
      })
    );

    render(<EquipmentList />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify no equipment is shown
    const list = screen.getByRole('list');
    expect(list.children).toHaveLength(0);
  });
});
