'use client';

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export default function SkeletonLoader({
  className = '',
  lines = 1,
  width = '100%',
  height = '1rem',
  rounded = true,
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  const roundedClasses = rounded ? 'rounded' : '';
  const sizeClasses = typeof width === 'number' ? `w-${width}` : '';

  const style = {
    width: typeof width === 'string' ? width : undefined,
    height: typeof height === 'string' ? height : undefined,
  };

  if (lines === 1) {
    return (
      <div
        className={`${baseClasses} ${roundedClasses} ${sizeClasses} ${className}`}
        style={style}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${roundedClasses} ${sizeClasses}`}
          style={{
            ...style,
            width: index === lines - 1 ? '75%' : width,
          }}
        />
      ))}
    </div>
  );
}

// Predefined skeleton loaders for common components
export const SkeletonCard = () => (
  <div className="rounded-lg bg-white p-6 shadow">
    <SkeletonLoader height="1.5rem" width="60%" className="mb-4" />
    <SkeletonLoader lines={3} className="mb-4" />
    <SkeletonLoader height="2rem" width="40%" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    <SkeletonLoader height="1rem" width="100%" />
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex space-x-4">
        <SkeletonLoader height="1rem" width="20%" />
        <SkeletonLoader height="1rem" width="30%" />
        <SkeletonLoader height="1rem" width="25%" />
        <SkeletonLoader height="1rem" width="25%" />
      </div>
    ))}
  </div>
);

export const SkeletonForm = () => (
  <div className="space-y-4">
    <SkeletonLoader height="1rem" width="25%" />
    <SkeletonLoader height="2.5rem" width="100%" />
    <SkeletonLoader height="1rem" width="25%" />
    <SkeletonLoader height="2.5rem" width="100%" />
    <SkeletonLoader height="1rem" width="25%" />
    <SkeletonLoader height="2.5rem" width="100%" />
    <SkeletonLoader height="2.5rem" width="30%" />
  </div>
);
