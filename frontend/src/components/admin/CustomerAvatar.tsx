'use client';

import { useState } from 'react';

interface CustomerAvatarProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  size?: number;
}

export function CustomerAvatar({ firstName, lastName, avatarUrl, size = 40 }: CustomerAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials =
    `${firstName?.[0]?.toUpperCase() || ''}${lastName?.[0]?.toUpperCase() || ''}` || '?';

  const showImage = avatarUrl && !imageError;

  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-premium-gold to-premium-gold-dark shadow-md ring-2 ring-white">
        {showImage ? (
          <img
            src={avatarUrl}
            alt={`${firstName || ''} ${lastName || ''}`}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-sm font-semibold text-black">{initials}</span>
        )}
      </div>
    </div>
  );
}
