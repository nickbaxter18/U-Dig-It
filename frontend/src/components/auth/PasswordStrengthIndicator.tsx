'use client';

import { checkPasswordStrength, type PasswordStrength } from '@/lib/validators/password';
import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  show = true,
}: PasswordStrengthIndicatorProps) {
  const strength: PasswordStrength = useMemo(
    () => checkPasswordStrength(password),
    [password]
  );

  if (!show || !password) return null;

  const getColorClasses = (color: PasswordStrength['color']) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 text-red-700 border-red-200';
      case 'orange':
        return 'bg-orange-500 text-orange-700 border-orange-200';
      case 'yellow':
        return 'bg-yellow-500 text-yellow-700 border-yellow-200';
      case 'green':
        return 'bg-green-500 text-green-700 border-green-200';
    }
  };

  const getBackgroundColor = (color: PasswordStrength['color']) => {
    switch (color) {
      case 'red':
        return 'bg-red-50';
      case 'orange':
        return 'bg-orange-50';
      case 'yellow':
        return 'bg-yellow-50';
      case 'green':
        return 'bg-green-50';
    }
  };

  const getBorderColor = (color: PasswordStrength['color']) => {
    switch (color) {
      case 'red':
        return 'border-red-200';
      case 'orange':
        return 'border-orange-200';
      case 'yellow':
        return 'border-yellow-200';
      case 'green':
        return 'border-green-200';
    }
  };

  return (
    <div className={`mt-2 rounded-lg border ${getBorderColor(strength.color)} ${getBackgroundColor(strength.color)} p-3`}>
      {/* Strength Bar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password Strength:</span>
        <span className={`text-sm font-semibold ${strength.color === 'red' ? 'text-red-700' : strength.color === 'orange' ? 'text-orange-700' : strength.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'}`}>
          {strength.label}
        </span>
      </div>

      {/* Visual strength bar */}
      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-colors ${
              level <= strength.score
                ? getColorClasses(strength.color).split(' ')[0]
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-700">
          {strength.feedback.map((item: any, index: any) => (
            <li key={index} className="flex items-start">
              <span className="mr-1">{item.startsWith('✓') ? '✓' : '•'}</span>
              <span>{item.replace(/^[✓•]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

