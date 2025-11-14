// Service Worker registration and management
import { logger } from '@/lib/logger';
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  private constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Service Worker not supported', {
          component: 'service-worker',
          action: 'debug',
        });
      }
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Service Worker registered successfully', {
          component: 'service-worker',
          action: 'debug',
        });
      }

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.showUpdateNotification();
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Service Worker registration failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      return null;
    }
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Service Worker unregistered', {
          component: 'service-worker',
          action: 'debug',
        });
      }
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Service Worker unregistration failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  public async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Service Worker update requested', {
          component: 'service-worker',
          action: 'debug',
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Service Worker update failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  public isUpdateAvailable(): boolean {
    return this.registration?.waiting !== null;
  }

  public async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  public async sendMessage(message: unknown): Promise<void> {
    if (this.registration?.active) {
      this.registration.active.postMessage(message);
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Notifications not supported', {
          component: 'service-worker',
          action: 'debug',
        });
      }
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Service Worker not registered', {
          component: 'service-worker',
          action: 'debug',
        });
      }
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Push subscription created', { component: 'service-worker', action: 'debug' });
      }
      return subscription;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Push subscription failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      return null;
    }
  }

  public async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Push subscription removed', {
            component: 'service-worker',
            action: 'debug',
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Push unsubscription failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }

  private showUpdateNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Update Available', {
        body: 'A new version of the app is available. Click to update.',
        icon: '/icons/icon-192x192.png',
        tag: 'update-available',
      });
    }
  }

  public async clearCache(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      if (process.env.NODE_ENV === 'development') {
        logger.debug('All caches cleared', { component: 'service-worker', action: 'debug' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Cache clearing failed:', {
          component: 'service-worker',
          action: 'error',
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  public async getCacheStats(): Promise<{
    cacheNames: string[];
    totalSize: number;
    entries: Array<{ name: string; size: number }>;
  }> {
    const cacheNames = await caches.keys();
    const entries = [];
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;
          entries.push({ name: request.url, size });
          totalSize += size;
        }
      }
    }

    return {
      cacheNames,
      totalSize,
      entries,
    };
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Auto-register service worker in browser (DISABLED in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Additional safety checks to prevent registration in invalid contexts
  const isValidContext =
    window.self === window.top && // Not in iframe
    !window.location.protocol.startsWith('vscode') && // Not in VSCode webview
    !window.location.protocol.startsWith('cursor') && // Not in Cursor webview
    document.location.protocol === 'https:' || // HTTPS or localhost
    document.location.hostname === 'localhost';

  if (isValidContext) {
    // Register service worker when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        serviceWorkerManager.register();
      });
    } else {
      serviceWorkerManager.register();
    }

    // Handle service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;

        switch (type) {
          case 'CACHE_UPDATED':
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Cache updated:', { component: 'service-worker', action: 'debug', metadata: { value: data } });
            }
            break;
          case 'OFFLINE_ACTION_QUEUED':
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Offline action queued:', {
                component: 'service-worker',
                action: 'debug',
                metadata: { data },
              });
            }
            break;
          case 'SYNC_COMPLETE':
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Background sync complete:', {
                component: 'service-worker',
                action: 'debug',
                metadata: { data },
              });
            }
            break;
          default:
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Service Worker message:', {
                component: 'service-worker',
                action: 'debug',
                metadata: { type, data },
              });
            }
        }
      });
    }
  }
}
