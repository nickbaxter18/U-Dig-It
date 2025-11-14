/**
 * Draw Signature Component
 * Enhanced signature canvas with smooth curves, undo/redo, and mobile optimization
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface DrawSignatureProps {
  onSignatureCapture: (signature: string) => void;
  onClear?: () => void;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export default function DrawSignature({ onSignatureCapture, onClear }: DrawSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // Retina display
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw signature guidelines (dotted line)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Redraw all paths
    redrawCanvas();
  }, [points]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Clear and redraw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw guideline
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Redraw all paths with smooth curves
    points.forEach(path => {
      if (path.length === 0) return;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);

      // Use quadratic curves for smoother lines
      for (let i = 1; i < path.length - 1; i++) {
        const xc = (path[i].x + path[i + 1].x) / 2;
        const yc = (path[i].y + path[i + 1].y) / 2;
        ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
      }

      if (path.length > 1) {
        ctx.lineTo(path[path.length - 1].x, path[path.length - 1].y);
      }

      ctx.stroke();
    });
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const point = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([point]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const point = getCoordinates(e);
    setCurrentPath(prev => [...prev, point]);

    // Draw immediately for responsiveness
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentPath.length > 0) {
      const prevPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      setPoints(prev => [...prev, currentPath]);
      setCanUndo(true);
      setHasSignature(true);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(prev => prev.slice(0, -1));
      setHasSignature(points.length > 1);
      setCanUndo(points.length > 1);
    }
  };

  const handleClear = () => {
    setPoints([]);
    setCurrentPath([]);
    setCanUndo(false);
    setHasSignature(false);
    onClear?.();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw guideline
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, rect.height / 2);
    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      alert('Please draw your signature first');
      return;
    }

    const signatureImage = canvas.toDataURL('image/png');
    onSignatureCapture(signatureImage); // Don't pass name - let auto-populated name remain
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <svg
            className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <strong className="mb-1 block">How to sign:</strong>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Use your mouse/touchpad or finger to draw your signature</li>
              <li>Sign naturally as you would on paper</li>
              <li>Tap "Undo" to remove the last stroke</li>
              <li>Tap "Clear" to start over</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="relative">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Draw Your Signature *
        </label>
        <div className="overflow-hidden rounded-lg border-4 border-gray-300 bg-white shadow-inner transition-colors hover:border-blue-400">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full cursor-crosshair touch-none"
            style={{ height: '180px' }}
          />
        </div>

        {/* Canvas Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↩️ Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasSignature}
              className="rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑️ Clear
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {hasSignature ? '✅ Signature captured' : '✏️ Sign in the box above'}
          </p>
        </div>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={!hasSignature}
        className="flex w-full items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Apply Drawn Signature
      </button>

      {/* Mobile Tip */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 md:hidden">
        <p className="text-center text-xs text-yellow-800">
          💡 <strong>Tip:</strong> Rotate your device to landscape for easier signing
        </p>
      </div>
    </div>
  );
}
