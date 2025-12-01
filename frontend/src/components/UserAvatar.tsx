'use client';

import { useState } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * UserAvatar Component
 *
 * Displays a user's avatar with proper error handling.
 * Falls back to initials when:
 * - No avatar URL is provided
 * - The avatar image fails to load (network error, CORS, deleted file, etc.)
 *
 * @param avatarUrl - URL of the avatar image
 * @param firstName - User's first name (for initials fallback)
 * @param lastName - User's last name (for initials fallback)
 * @param email - User's email (for initials fallback if no name)
 * @param size - Avatar size preset
 * @param className - Additional CSS classes for the container
 */
export function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size configurations
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  // Generate initials from name or email
  const getInitials = (): string => {
    if (firstName) {
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName?.charAt(0).toUpperCase() || '';
      return `${firstInitial}${lastInitial}` || firstInitial;
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Determine if we should show the image
  const showImage = avatarUrl && !imageError;

  // Handle image load error
  const handleError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Handle successful image load
  const handleLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-gradient-to-br from-[#E1BC56] to-[#d4af4a] ${sizeClasses[size]} ${className}`}
    >
      {showImage ? (
        <>
          {/* Show initials as placeholder while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
                {getInitials()}
              </span>
            </div>
          )}
          <img
            src={avatarUrl}
            alt={firstName ? `${firstName}'s profile picture` : 'Profile picture'}
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={handleError}
            onLoad={handleLoad}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
            {getInitials()}
          </span>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;

