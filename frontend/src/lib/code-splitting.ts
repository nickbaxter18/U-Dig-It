// Code splitting optimization configuration
export const CODE_SPLITTING_CONFIG = {
  // Route-based splitting
  routes: {
    '/admin': () => import('../app/admin/page'),
    '/dashboard': () => import('../app/dashboard/page'),
    '/book': () => import('../app/book/page'),
    '/booking-mobile': () => import('../app/booking-mobile/page'),
  },

  // Feature-based splitting
  features: {
    // 'auth': () => import('../features/auth'),
    // 'payments': () => import('../features/payments'),
    // 'bookings': () => import('../features/bookings'),
    // 'equipment': () => import('../features/equipment'),
  },

  // Component-based splitting
  components: {
    Modal: () => import('@radix-ui/react-dialog'),
    Dropdown: () => import('@radix-ui/react-dropdown-menu'),
    Select: () => import('@radix-ui/react-select'),
    Avatar: () => import('@radix-ui/react-avatar'),
  },

  // Library splitting
  libraries: {
    // charts: () => import('recharts'), // Removed - not used, replaced with CSS charts
    forms: () => import('react-hook-form'),
    ui: () => import('@headlessui/react'),
    // PDF renderer - lazy load only when needed for contracts
    pdf: () => import('@react-pdf/renderer'),
  },
};

// Intelligent loading strategy
export const LOADING_STRATEGY = {
  // Critical components (load immediately)
  critical: ['Header', 'Navigation', 'Footer'],

  // Important components (load on interaction)
  important: ['Modal', 'Dropdown', 'Select'],

  // Optional components (load on demand)
  optional: ['Charts', 'AdvancedForms', 'Analytics'],

  // Background components (load when idle)
  background: ['Monitoring', 'Analytics', 'Tracking'],
};

// Preloading strategy
export const PRELOAD_STRATEGY = {
  // Preload on hover
  hover: ['Modal', 'Dropdown'],

  // Preload on route change
  route: ['Dashboard', 'Admin'],

  // Preload on idle
  idle: ['Analytics', 'Monitoring'],
};
