'use client';

import { Activity, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface RealtimeConnectionIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function RealtimeConnectionIndicator({
  className = '',
  compact = false,
}: RealtimeConnectionIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    let healthCheckChannel: ReturnType<typeof supabase.channel> | null = null;
    let healthCheckInterval: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const checkConnection = async () => {
      try {
        // Create a test channel to check connection health
        const testChannel = supabase.channel('health-check', {
          config: {
            broadcast: { self: false },
            presence: { key: 'health-check' },
          },
        });

        // Subscribe to channel state changes
        testChannel
          .on('system', {}, (payload) => {
            if (payload.status === 'SUBSCRIBED') {
              setStatus('connected');
              setLastConnected(new Date());
              reconnectAttempts = 0;
            } else if (payload.status === 'CHANNEL_ERROR') {
              setStatus('error');
            } else if (payload.status === 'TIMED_OUT') {
              setStatus('disconnected');
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setStatus('connected');
              setLastConnected(new Date());
              reconnectAttempts = 0;
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('error');
              reconnectAttempts++;
            } else if (status === 'TIMED_OUT') {
              setStatus('disconnected');
              reconnectAttempts++;
            } else {
              setStatus('connecting');
            }
          });

        healthCheckChannel = testChannel;

        // Also check Supabase connection status
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setStatus('disconnected');
        }
      } catch (error) {
        console.error('Connection health check failed:', error);
        setStatus('error');
        reconnectAttempts++;
      }
    };

    // Initial check
    checkConnection();

    // Periodic health check every 10 seconds
    healthCheckInterval = setInterval(() => {
      if (reconnectAttempts < maxReconnectAttempts) {
        checkConnection();
      } else {
        setStatus('error');
      }
    }, 10000);

    // Monitor online/offline events
    const handleOnline = () => {
      setStatus('connecting');
      reconnectAttempts = 0;
      checkConnection();
    };

    const handleOffline = () => {
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Count active channels
    const updateChannelCount = () => {
      // This is a simplified count - in a real implementation,
      // you'd track channels from a central manager
      const channels = (supabase as any).realtime?.channels || [];
      setChannelCount(channels.length);
    };

    const channelCountInterval = setInterval(updateChannelCount, 2000);

    return () => {
      if (healthCheckChannel) {
        supabase.removeChannel(healthCheckChannel);
      }
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      if (channelCountInterval) {
        clearInterval(channelCountInterval);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Connected',
          pulse: false,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Disconnected',
          pulse: true,
        };
      case 'connecting':
        return {
          icon: Activity,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Connecting...',
          pulse: true,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Connection Error',
          pulse: true,
        };
      default:
        return {
          icon: Wifi,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Compact variant for footer
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div
          className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : status === 'disconnected' ? 'bg-red-500' : 'bg-gray-400'} ${config.pulse ? 'animate-pulse' : ''}`}
          title={`Real-time: ${config.label}${lastConnected ? ` (Last connected: ${lastConnected.toLocaleTimeString()})` : ''}${channelCount > 0 ? ` - ${channelCount} channels` : ''}`}
          aria-label={`Real-time connection: ${config.label}`}
        ></div>
        <span className="hidden text-xs text-gray-600 xl:inline">Real-time</span>
      </div>
    );
  }

  // Full variant for header
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1 ${config.bgColor} ${config.pulse ? 'animate-pulse' : ''}`}
        title={`Real-time: ${config.label}${lastConnected ? ` (Last connected: ${lastConnected.toLocaleTimeString()})` : ''}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color} hidden sm:inline`}>
          {config.label}
        </span>
        {channelCount > 0 && (
          <span className={`text-xs ${config.color} opacity-75`}>({channelCount})</span>
        )}
      </div>
    </div>
  );
}
