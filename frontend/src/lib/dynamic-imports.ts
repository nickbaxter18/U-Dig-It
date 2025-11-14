import dynamic from 'next/dynamic';
import React from 'react';

// Simple dynamic component creator
export const createDynamicComponent = (
  importFunc: () => Promise<any>,
  options?: {
    loading?: () => React.ReactNode;
    ssr?: boolean;
  }
) => {
  return dynamic(importFunc, {
    loading: options?.loading,
    ssr: options?.ssr ?? true,
  });
};

// Pre-configured dynamic components for common use cases
export const DynamicModal = createDynamicComponent(() => import('@radix-ui/react-dialog'), {
  ssr: false,
});

export const DynamicDropdown = createDynamicComponent(
  () => import('@radix-ui/react-dropdown-menu'),
  { ssr: false }
);

export const DynamicSelect = createDynamicComponent(() => import('@radix-ui/react-select'), {
  ssr: false,
});

// Route-based code splitting
export const createRouteSplit = (route: string) => {
  return dynamic(() => import(`../app/${route}`), {
    loading: () => React.createElement('div', null, 'Loading page...'),
    ssr: false,
  });
};

// Feature-based code splitting
export const createFeatureSplit = (feature: string) => {
  return dynamic(() => import(`../features/${feature}`), {
    loading: () => React.createElement('div', null, 'Loading feature...'),
    ssr: false,
  });
};
