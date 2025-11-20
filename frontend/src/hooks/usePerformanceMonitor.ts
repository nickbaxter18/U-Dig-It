import { useEffect, useRef } from 'react';

import { logger } from '@/lib/logger';

import { ErrorMonitor } from '../lib/error-monitor';

export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    const mountTimeValue = mountTime.current;
    const mountDuration = Date.now() - mountTimeValue;

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`⚡ ${componentName} mounted in ${mountDuration}ms`, {
          component: 'usePerformanceMonitor',
          action: 'debug',
        });
      }
    }

    // Log slow component mounts
    if (mountDuration > 100) {
      ErrorMonitor.captureError(new Error(`Slow component mount: ${componentName}`), {
        component: componentName,
        action: 'mount',
        state: { mountDuration },
      });
    }

    return () => {
      const unmountDuration = Date.now() - mountTimeValue;

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`🔄 ${componentName} unmounted after ${unmountDuration}ms`, {
            component: 'usePerformanceMonitor',
            action: 'debug',
          });
        }
      }
    };
  }, [componentName]);

  const markInteraction = (action: string) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`🎯 ${componentName}:${action}`, {
          component: 'usePerformanceMonitor',
          action: 'debug',
        });
      }
    }
  };

  return { markInteraction };
};
