import { useEffect, useState } from 'react';
import { ErrorMonitor } from '../lib/error-monitor';
import { logger } from '@/lib/logger';

export const DebugToolbar = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('debugMode');
    const isDebug = saved === 'true';
    setDebugMode(isDebug);

    // Show toolbar in development or when debug mode is enabled
    setShowToolbar(process.env.NODE_ENV === 'development' || isDebug);
  }, []);

  const toggleDebug = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    localStorage.setItem('debugMode', String(newMode));

    if (newMode) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('🔧 Debug mode enabled', { component: 'DebugToolbar', action: 'debug' });
      }
      ErrorMonitor.captureError(new Error('Debug mode enabled'), {
        component: 'DebugToolbar',
        action: 'toggleDebug',
      });
    }

    window.location.reload();
  };

  const clearErrorLogs = () => {
    localStorage.removeItem('errorLogs');
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🧹 Error logs cleared', { component: 'DebugToolbar', action: 'debug' });
    }
  };

  const exportLogs = () => {
    const logs = localStorage.getItem('errorLogs');
    const blob = new Blob([logs || ''], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!showToolbar) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 p-4 text-white shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="debugMode"
            checked={debugMode}
            onChange={toggleDebug}
            className="h-4 w-4"
          />
          <label htmlFor="debugMode" className="text-sm">
            Debug Mode
          </label>
        </div>

        <div className="space-y-1">
          <button
            onClick={clearErrorLogs}
            className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10"
          >
            Clear Logs
          </button>
          <button
            onClick={exportLogs}
            className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10"
          >
            Export Logs
          </button>
        </div>
      </div>
    </div>
  );
};
