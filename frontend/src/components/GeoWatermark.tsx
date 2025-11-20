import Image from 'next/image';

import { generateImageTitle, generateWatermarkAltText } from '@/lib/location-image-data';

interface WatermarkConfig {
  position: number;
  className: string;
  size: { width: number; height: number };
}

const watermarkPositions: WatermarkConfig[] = [
  {
    position: 1,
    className: 'absolute left-12 top-8 rotate-[8deg] opacity-10',
    size: { width: 224, height: 224 },
  },
  {
    position: 2,
    className: 'absolute right-16 top-12 rotate-[-10deg] opacity-10',
    size: { width: 240, height: 240 },
  },
  {
    position: 3,
    className: 'absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10',
    size: { width: 192, height: 192 },
  },
  {
    position: 4,
    className: 'absolute right-[18%] top-[24%] rotate-[12deg] opacity-10',
    size: { width: 208, height: 208 },
  },
  {
    position: 5,
    className: 'absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10',
    size: { width: 320, height: 320 },
  },
  {
    position: 6,
    className: 'absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10',
    size: { width: 304, height: 304 },
  },
  {
    position: 7,
    className: 'absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10',
    size: { width: 176, height: 176 },
  },
  {
    position: 8,
    className: 'absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10',
    size: { width: 192, height: 192 },
  },
  {
    position: 9,
    className: 'absolute left-[30%] top-[11%] rotate-[5deg] opacity-10',
    size: { width: 160, height: 160 },
  },
];

interface GeoWatermarkProps {
  location: string;
  position: number;
}

/**
 * SEO-optimized watermark component with location-specific alt text
 * Generates unique, geo-targeted alt text for each watermark position
 */
export function GeoWatermark({ location, position }: GeoWatermarkProps) {
  const config = watermarkPositions[position - 1];
  if (!config) return null;

  const altText = generateWatermarkAltText(location, position);
  const titleText = generateImageTitle(location, 'watermark');

  // Calculate responsive sizes based on watermark size
  const maxSize = Math.max(config.size.width, config.size.height);
  const mobileSize = Math.floor(maxSize * 0.7);
  const sizes = `(max-width: 768px) ${mobileSize}px, ${maxSize}px`;

  return (
    <div className={config.className}>
      <div
        className="relative"
        style={{ width: `${config.size.width}px`, height: `${config.size.height}px` }}
      >
        <Image
          src="/images/udigit-logo.png"
          alt={altText}
          title={titleText}
          fill
          className="object-contain"
          sizes={sizes}
          priority={false}
          quality={75}
          loading="lazy"
        />
      </div>
    </div>
  );
}

/**
 * Complete set of 9 geo-optimized watermarks for service area pages
 * Each watermark has unique, location-specific SEO metadata
 * Responsive: Desktop shows original 9, Mobile shows 14 smaller watermarks
 */
export function LocationWatermarkSet({ location }: { location: string }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Desktop Watermarks - Original (hidden on mobile) */}
      <div className="hidden md:block">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((position: unknown) => (
          <GeoWatermark key={position} location={location} position={position} />
        ))}
      </div>

      {/* Mobile Only - More Watermarks for better coverage */}
      <div className="md:hidden">
        <div className="absolute left-[2%] top-[3%] opacity-10">
          <div className="relative h-20 w-20">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="20px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10">
          <div className="relative h-18 w-18">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="18px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10">
          <div className="relative h-16 w-16">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="16px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10">
          <div className="relative h-14 w-14">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="14px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 opacity-10">
          <div className="relative h-16 w-16">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="16px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10">
          <div className="relative h-24 w-24">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="24px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute right-[5%] top-[45%] rotate-[8deg] opacity-10">
          <div className="relative h-24 w-24">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="24px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute left-[10%] top-[50%] rotate-[5deg] opacity-10">
          <div className="relative h-18 w-18">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="18px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute right-[12%] top-[55%] -rotate-[7deg] opacity-10">
          <div className="relative h-16 w-16">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="16px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10">
          <div className="relative h-20 w-20">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="20px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10">
          <div className="relative h-22 w-22">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="22px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10">
          <div className="relative h-14 w-14">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="14px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10">
          <div className="relative h-16 w-16">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="16px"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10">
          <div className="relative h-18 w-18">
            <Image
              src="/images/udigit-logo.png"
              alt="U-Dig It Rentals"
              fill
              className="object-contain"
              sizes="18px"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Equipment image with geo-optimization
 */
interface GeoEquipmentImageProps {
  location?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function GeoEquipmentImage({
  location = 'saint-john',
  alt,
  className = '',
  priority = false,
}: GeoEquipmentImageProps) {
  const defaultAlt = `Kubota SVL75-3 compact track loader available for professional rental in ${location} New Brunswick for construction excavation landscaping projects`;
  const titleText = generateImageTitle(location, 'equipment');

  return (
    <Image
      src="/images/kubota-svl-75-hero.png"
      alt={alt || defaultAlt}
      title={titleText}
      width={800}
      height={600}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
      priority={priority}
      quality={85}
    />
  );
}
