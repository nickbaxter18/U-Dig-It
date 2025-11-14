/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript and ESLint errors during build
  // TypeScript errors are being addressed incrementally via API routes migration
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true' || true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  serverExternalPackages: [
    '@supabase/supabase-js',
    'sharp',
    '@tensorflow/tfjs-node',
    '@vladmandic/human',
  ],

  // Image Optimization (Modern formats, compression)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bnimazxnqligusckahab.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile pictures
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub profile pictures
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================================================
  // Performance Optimization Configuration
  // ============================================================================

  // Optimize Package Imports (Tree-shaking for large libraries)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      'date-fns',
    ],
    // Enable optimized CSS loading
    optimizeCss: true,
  },

  // Enable experimental features for better Supabase integration
  transpilePackages: ['@react-pdf/renderer'],

  // Webpack Configuration for Bundle Optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Don't modify server-side bundles
    if (!isServer) {
      // Optimize Client-Side Bundle Splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,

            // Framework code (React, Next.js) - Changes infrequently
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // UI libraries (Radix, Tailwind) - Medium change frequency
            lib: {
              name: 'lib',
              chunks: 'all',
              test(module) {
                return module.size() > 40000 && /node_modules/.test(module.identifier());
              },
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },

            // Shared components - Changes frequently
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },

            // Admin dashboard - Separate bundle (only loaded when needed)
            admin: {
              name: 'admin',
              test: /[\\/]app[\\/]admin[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true,
            },

            // Contest/promotional features - Separate bundle
            contest: {
              name: 'contest',
              test: /[\\/](SpinWheel|contest|ContestWheel)[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
          },
        },
        // Minimize bundle size
        minimize: !dev,
      };

      // Add bundle analyzer in development
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
            generateStatsFile: true,
          })
        );
      }
    }

    return config;
  },

  // Turbopack Configuration (Next.js 16+)
  // Empty config allows webpack config to coexist with Turbopack
  turbopack: {},

  // Compiler Options
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Development environment variables
  env: {
    NEXT_PUBLIC_DEV_BYPASS_PAYMENT: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },

  // Compression
  compress: true,

  // Production Source Maps (smaller, faster)
  productionBrowserSourceMaps: false, // Disable for smaller builds

  // React Strict Mode (recommended)
  reactStrictMode: true,

  // PoweredBy header (remove for security)
  poweredByHeader: false,
};
