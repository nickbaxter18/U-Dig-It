import Image from 'next/image';

interface OptimizedWatermarkProps {
  position:
    | 'top-left'
    | 'top-right'
    | 'upper-left'
    | 'upper-right'
    | 'center-right'
    | 'center-left'
    | 'bottom-left'
    | 'bottom-right'
    | 'upper-center';
  alt: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const positionStyles = {
  'top-left': 'absolute left-12 top-8 rotate-[8deg]',
  'top-right': 'absolute right-16 top-12 rotate-[-10deg]',
  'upper-left': 'absolute left-[15%] top-[22%] rotate-[-6deg]',
  'upper-right': 'absolute right-[18%] top-[24%] rotate-[12deg]',
  'center-right': 'absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform',
  'center-left': 'absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform',
  'bottom-left': 'absolute bottom-[12%] left-[20%] rotate-[4deg]',
  'bottom-right': 'absolute bottom-[10%] right-[22%] rotate-[-7deg]',
  'upper-center': 'absolute left-[30%] top-[11%] rotate-[5deg]',
};

const sizeClasses = {
  small: 'h-40 w-40',
  medium: 'h-48 w-48',
  large: 'h-56 w-56',
  xlarge: 'h-60 w-60',
};

const responsiveSizes = {
  small: '(max-width: 768px) 28px, 40px',
  medium: '(max-width: 768px) 32px, 48px',
  large: '(max-width: 768px) 40px, 56px',
  xlarge: '(max-width: 768px) 44px, 60px',
};

/**
 * Optimized watermark logo component for hero sections
 * Includes proper sizes prop for Core Web Vitals optimization
 */
export default function OptimizedWatermark({
  position,
  alt,
  size = 'medium'
}: OptimizedWatermarkProps) {
  return (
    <div className={`${positionStyles[position]} opacity-10`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src="/images/udigit-logo.png"
          alt={alt}
          fill
          className="object-contain"
          sizes={responsiveSizes[size]}
          quality={75}
          priority={false}
          loading="lazy"
        />
      </div>
    </div>
  );
}


