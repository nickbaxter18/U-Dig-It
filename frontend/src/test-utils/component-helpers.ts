/// <reference types="@testing-library/jest-dom" />
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Renders a component with all necessary providers
 * Use this for components that need auth, query client, or other providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Note: Add providers as needed
  // const Wrapper = ({ children }: { children: React.ReactNode }) => (
  //   <SupabaseAuthProvider>
  //     <QueryClientProvider client={testQueryClient}>
  //       {children}
  //     </QueryClientProvider>
  //   </SupabaseAuthProvider>
  // );

  return render(ui, options);
};

/**
 * Wait for loading state to finish
 * Useful for components that show loading spinners
 */
export const waitForLoadingToFinish = async () => {
  const { waitFor, screen } = await import('@testing-library/react');
  return waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

/**
 * Wait for element to disappear
 */
export const waitForElementToDisappear = async (element: HTMLElement) => {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(() => {
    expect(element).not.toBeInTheDocument();
  });
};

/**
 * Get form validation errors
 */
export const getValidationErrors = (container: HTMLElement) => {
  return Array.from(container.querySelectorAll('[role="alert"]')).map(
    (el: any) => el.textContent
  );
};

/**
 * Fill form field by label
 */
export const fillFormField = async (labelText: string | RegExp, value: string) => {
  const { screen } = await import('@testing-library/react');
  const userEvent = (await import('@testing-library/user-event')).default;

  const user = userEvent.setup();
  const input = screen.getByLabelText(labelText);
  await user.clear(input);
  await user.type(input, value);

  return input;
};

/**
 * Submit form by button text
 */
export const submitForm = async (buttonText: string | RegExp = /submit/i) => {
  const { screen } = await import('@testing-library/react');
  const userEvent = (await import('@testing-library/user-event')).default;

  const user = userEvent.setup();
  const button = screen.getByRole('button', { name: buttonText });
  await user.click(button);

  return button;
};

/**
 * Check if element has loading state
 */
export const isLoading = (element: HTMLElement) => {
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-busy') === 'true' ||
    element.textContent?.toLowerCase().includes('loading')
  );
};

/**
 * Mock window.matchMedia for responsive tests
 */
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
};

/**
 * Mock IntersectionObserver for lazy-loading tests
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
};


