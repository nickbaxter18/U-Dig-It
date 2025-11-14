import Image from 'next/image';

interface HeroWatermarkProps {
  alt: string;
  size: number;
  position: string;
  rotation: string;
}

/**
 * Optimized watermark component for hero sections
 * Includes proper sizes prop for performance and SEO
 */
export default function HeroWatermark({ alt, size, position, rotation }: HeroWatermarkProps) {
  // Calculate responsive sizes for optimal image loading
  const responsiveSizes = `(max-width: 768px) ${Math.floor(size * 0.7)}px, ${size}px`;

  return (
    <div className={`absolute ${position} ${rotation} opacity-10`}>
      <div className={`relative`} style={{ width: `${size}px`, height: `${size}px` }}>
        <Image
          src="/images/udigit-logo.png"
          alt={alt}
          fill
          className="object-contain"
          sizes={responsiveSizes}
          priority={false}
          quality={75}
        />
      </div>
    </div>
  );
}

/**
 * Standard 9-watermark set for service area hero sections
 */
export function ServiceAreaHeroWatermarks() {
  const watermarks = [
    { alt: 'Equipment Rental Service', size: 224, position: 'left-12 top-8', rotation: 'rotate-[8deg]' },
    { alt: 'Track Loader Rental', size: 240, position: 'right-16 top-12', rotation: 'rotate-[-10deg]' },
    { alt: 'Kubota Equipment', size: 192, position: 'left-[15%] top-[22%]', rotation: 'rotate-[-6deg]' },
    { alt: 'Professional Service', size: 208, position: 'right-[18%] top-[24%]', rotation: 'rotate-[12deg]' },
    { alt: 'Heavy Equipment', size: 320, position: 'right-0 top-[45%] translate-x-[35%]', rotation: 'rotate-[15deg]' },
    { alt: 'Construction Equipment', size: 304, position: 'left-0 top-[48%] -translate-x-[35%]', rotation: 'rotate-[-12deg]' },
    { alt: 'Local Rental', size: 176, position: 'bottom-[12%] left-[20%]', rotation: 'rotate-[4deg]' },
    { alt: 'Equipment Service', size: 192, position: 'bottom-[10%] right-[22%]', rotation: 'rotate-[-7deg]' },
    { alt: 'U-Dig It Rentals', size: 160, position: 'left-[30%] top-[11%]', rotation: 'rotate-[5deg]' },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {watermarks.map((watermark: any, index: any) => (
        <HeroWatermark key={index} {...watermark} />
      ))}
    </div>
  );
}

