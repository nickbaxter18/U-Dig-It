import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// Optional: Initialize MSW in Storybook
// Uncomment if you want to use MSW in Storybook
// import { initialize, mswLoader } from 'msw-storybook-addon';
// import { handlers } from '../src/test/mocks/handlers';
// initialize({ handlers });

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
      ],
    },
  },
  // loaders: [mswLoader], // Uncomment to enable MSW in Storybook
};

export default preview;

