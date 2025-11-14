import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { logger } from '@/lib/logger';

export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface AdminWebSocketEvents {
  // Dashboard events
  admin_dashboard_update: (data: unknown) => void;
  new_booking_alert: (data: unknown) => void;
  payment_received_alert: (data: unknown) => void;
  maintenance_due_alert: (data: unknown) => void;
  customer_support_request: (data: unknown) => void;

  // Booking events
  booking_updated: (data: unknown) => void;
  booking_status_changed: (data: unknown) => void;

  // Equipment events
  equipment_updated: (data: unknown) => void;
  equipment_availability_changed: (data: unknown) => void;

  // Payment events
  payment_updated: (data: unknown) => void;

  // Contract events
  contract_updated: (data: unknown) => void;

  // System events
  system_alert: (data: unknown) => void;
  broadcast_notification: (data: unknown) => void;

  // Connection events
  connected: (data: unknown) => void;
  disconnected: () => void;
  error: (error: unknown) => void;
}

export interface UseAdminWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

export interface UseAdminWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: <K extends keyof AdminWebSocketEvents>(event: K, handler: AdminWebSocketEvents[K]) => void;
  off: <K extends keyof AdminWebSocketEvents>(event: K, handler: AdminWebSocketEvents[K]) => void;
  recentEvents: WebSocketEvent[];
  clearEvents: () => void;
}

export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}): UseAdminWebSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<WebSocketEvent[]>([]);
  const reconnectAttemptsRef = useRef(0);

  const addEvent = useCallback((type: string, data: unknown) => {
    setRecentEvents(prev => [
      { type, data, timestamp: new Date().toISOString() },
      ...prev.slice(0, 49), // Keep last 50 events
    ]);
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    const socket = io(socketUrl, {
      auth: {
        // Add JWT token from localStorage or session
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Admin WebSocket connected', {
          component: 'useAdminWebSocket',
          action: 'debug',
        });
      }
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Join admin room
      socket.emit('join_admin_room');

      addEvent('connected', { socketId: socket.id });
      onConnect?.();
    });

    socket.on('disconnect', reason => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Admin WebSocket disconnected:', {
          component: 'useAdminWebSocket',
          action: 'debug',
          metadata: { reason },
        });
      }
      setIsConnected(false);
      setIsConnecting(false);

      addEvent('disconnected', { reason });
      onDisconnect?.();

      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
        setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, reconnectDelay * reconnectAttemptsRef.current);
      }
    });

    socket.on('connect_error', err => {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Admin WebSocket connection error:', {
          component: 'useAdminWebSocket',
          action: 'error',
        }, err instanceof Error ? err : new Error(String(err)));
      }
      setError(err.message);
      setIsConnecting(false);

      addEvent('error', { message: err.message });
      onError?.(err);
    });

    // Admin-specific events
    socket.on('admin_dashboard_update', data => {
      addEvent('admin_dashboard_update', data);
    });

    socket.on('new_booking_alert', data => {
      addEvent('new_booking_alert', data);
    });

    socket.on('payment_received_alert', data => {
      addEvent('payment_received_alert', data);
    });

    socket.on('maintenance_due_alert', data => {
      addEvent('maintenance_due_alert', data);
    });

    socket.on('customer_support_request', data => {
      addEvent('customer_support_request', data);
    });

    // Booking events
    socket.on('booking_updated', data => {
      addEvent('booking_updated', data);
    });

    socket.on('booking_status_changed', data => {
      addEvent('booking_status_changed', data);
    });

    // Equipment events
    socket.on('equipment_updated', data => {
      addEvent('equipment_updated', data);
    });

    socket.on('equipment_availability_changed', data => {
      addEvent('equipment_availability_changed', data);
    });

    // Payment events
    socket.on('payment_updated', data => {
      addEvent('payment_updated', data);
    });

    // Contract events
    socket.on('contract_updated', data => {
      addEvent('contract_updated', data);
    });

    // System events
    socket.on('system_alert', data => {
      addEvent('system_alert', data);
    });

    socket.on('broadcast_notification', data => {
      addEvent('broadcast_notification', data);
    });

    // Error handling
    socket.on('error', err => {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Admin WebSocket error:', {
          component: 'useAdminWebSocket',
          action: 'error',
        }, err instanceof Error ? err : new Error(String(err)));
      }
      setError(err.message);
      addEvent('error', err);
      onError?.(err);
    });
  }, [reconnectAttempts, reconnectDelay, onConnect, onDisconnect, onError, addEvent]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('WebSocket not connected, cannot emit event:', {
          component: 'useAdminWebSocket',
          action: 'warning',
          metadata: { event },
        });
      }
    }
  }, []);

  const on = useCallback(
    <K extends keyof AdminWebSocketEvents>(event: K, handler: AdminWebSocketEvents[K]) => {
      if (socketRef.current) {
        socketRef.current.on(event as string, handler as any);
      }
    },
    []
  );

  const off = useCallback(
    <K extends keyof AdminWebSocketEvents>(event: K, handler: AdminWebSocketEvents[K]) => {
      if (socketRef.current) {
        socketRef.current.off(event as string, handler as any);
      }
    },
    []
  );

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
    recentEvents,
    clearEvents,
  };
}
