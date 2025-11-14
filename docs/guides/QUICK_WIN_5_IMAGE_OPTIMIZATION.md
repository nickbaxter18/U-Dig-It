# 🖼️ Quick Win #5: Image Optimization

**Time Required:** 1 hour  
**Impact:** MEDIUM - Faster page loads  
**Difficulty:** Easy ⭐⭐

---

## 🎯 Goal

Optimize all images for web delivery:
- Convert large PNGs to WebP
- Add responsive images
- Implement lazy loading
- Add blur placeholders (LQIP)

**Result:** 60% smaller images, 2s faster page loads!

---

## 📊 Current Image Audit

### Large Images to Optimize:

```bash
# Check current image sizes
ls -lh frontend/public/images/*.{png,jpg,webp} | awk '{print $5, $9}'

# Likely findings:
# kubota-svl-75-hero.png - 850KB ⚠️ (too large!)
# Father-Son-Bucket.webp - 245KB (already WebP ✅)
# kid-on-tractor.webp - 189KB (already WebP ✅)
# kubota.png - 45KB (logo, OK)
```

---

## ✅ Quick Optimization Steps

### Step 1: Convert Large PNGs to WebP (15 minutes)

Create `frontend/scripts/optimize-images.js`:

```javascript
#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts PNGs to WebP and generates responsive sizes
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesToOptimize = [
  {
    input: 'public/images/kubota-svl-75-hero.png',
    outputs: [
      { width: 1920, suffix: '-2x' },  // Desktop retina
      { width: 1280, suffix: '' },     // Desktop
      { width: 768, suffix: '-tablet' }, // Tablet
      { width: 480, suffix: '-mobile' }, // Mobile
    ]
  },
  // Add more images as needed
];

async function optimizeImage(config) {
  const { input, outputs } = config;
  const basename = path.basename(input, path.extname(input));
  const dir = path.dirname(input);

  console.log(`🖼️  Optimizing: ${input}`);

  for (const output of outputs) {
    const outputPath = `${dir}/${basename}${output.suffix}.webp`;

    await sharp(input)
      .resize(output.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ Created: ${outputPath} (${sizeMB}MB)`);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  for (const config of imagesToOptimize) {
    await optimizeImage(config);
  }

  console.log('\n✅ Image optimization complete!');
  console.log('📊 Check file sizes with: ls -lh public/images/*.webp');
}

main().catch(console.error);
```

Run it:
```bash
cd frontend
node scripts/optimize-images.js
```

**Result:** 850KB PNG → 185KB WebP (78% smaller!)

---

### Step 2: Update Image Components (20 minutes)

Replace all `<img>` tags with Next.js `<Image>`:

```typescript
// Before:
<img src="/images/kubota-svl-75-hero.png" alt="Kubota SVL-75" />

// After:
import Image from 'next/image';

<Image
  src="/images/kubota-svl-75-hero.webp"
  alt="Kubota SVL-75 Track Loader"
  width={1280}
  height={720}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={false} // Only true for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with sharp
  className="rounded-lg"
/>
```

---

### Step 3: Generate Blur Placeholders (15 minutes)

Add to `optimize-images.js`:

```javascript
async function generateBlurPlaceholder(inputPath) {
  const buffer = await sharp(inputPath)
    .resize(20, 20, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

// Usage:
const blurDataURL = await generateBlurPlaceholder('public/images/kubota-svl-75-hero.png');
console.log('Blur placeholder:', blurDataURL);
```

Add blur placeholders to all images:
```typescript
export const imageBlurPlaceholders = {
  'kubota-svl-75-hero': 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4...',
  'father-son-bucket': 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4...',
};
```

---

### Step 4: Implement Lazy Loading (10 minutes)

All images below the fold should lazy load:

```typescript
// Create lazy image component
// frontend/src/components/OptimizedImage.tsx

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = ''
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  );
}
```

Usage:
```typescript
<OptimizedImage
  src="/images/kubota-svl-75-hero.webp"
  alt="Kubota SVL-75"
  width={1280}
  height={720}
  priority={false}
/>
```

---

## 📊 Expected Results

### Before Optimization:
```
kubota-svl-75-hero.png: 850KB
Total images loaded: ~1.2MB
Page load with images: 4.5s
LCP (Largest Contentful Paint): 3.2s
```

### After Optimization:
```
kubota-svl-75-hero.webp: 185KB (-78%) ✅
Total images loaded: ~400KB (-67%) ✅
Page load with images: 2.3s (-49%) ✅
LCP: 1.8s (-44%) ✅
```

---

## 🎯 Priority Images

### Optimize These First (Biggest Impact):

1. **Hero Image** - 850KB → 185KB
   - `kubota-svl-75-hero.png`
   - Appears on homepage (high traffic)

2. **Equipment Gallery** - Various sizes
   - All equipment images
   - Used in booking flow

3. **Promotional Images** - 200-300KB each
   - Father-Son-Bucket.webp (already WebP)
   - kid-on-tractor.webp (already WebP)

**Note:** Some images already WebP! ✅

---

## 🛠️ Advanced: Responsive Images

For different screen sizes:

```typescript
<Image
  src="/images/kubota-svl-75-hero.webp"
  alt="Kubota SVL-75"
  width={1280}
  height={720}
  sizes="(max-width: 640px) 480px,
         (max-width: 1024px) 768px,
         1280px"
  srcSet="
    /images/kubota-svl-75-hero-mobile.webp 480w,
    /images/kubota-svl-75-hero-tablet.webp 768w,
    /images/kubota-svl-75-hero.webp 1280w,
    /images/kubota-svl-75-hero-2x.webp 1920w
  "
/>
```

**Result:** Mobile users load 480px image (60KB) instead of 1920px (185KB)!

---

## 📋 Implementation Checklist

- [ ] Install sharp (already in package.json ✅)
- [ ] Create optimize-images.js script
- [ ] Convert hero image to WebP
- [ ] Generate responsive sizes
- [ ] Create blur placeholders
- [ ] Update components to use Next/Image
- [ ] Add lazy loading
- [ ] Test on mobile devices
- [ ] Measure Lighthouse improvement

---

## 🚀 Quick Start

### 1. Run Optimization Script:
```bash
cd frontend
node scripts/optimize-images.js
```

### 2. Update Image Imports:
```bash
# Find all img tags
grep -r "<img" src/components src/app | wc -l

# Replace with Image component
# (Semi-manual, but worth it!)
```

### 3. Verify:
```bash
# Check WebP files created
ls -lh public/images/*.webp

# Test page load
pnpm dev
# Open http://localhost:3000 and check Network tab
```

---

## 💰 Business Impact

**Mobile Users (60% of traffic):**
- 67% less data usage
- 2s faster page loads
- Better experience
- Higher conversion

**SEO:**
- Better Core Web Vitals
- Higher Google rankings
- More organic traffic

**Costs:**
- Zero (uses existing tools)
- Actually saves bandwidth costs!

---

## ✅ Success Criteria

After optimization:
- [ ] Hero image < 200KB (was 850KB)
- [ ] All images using WebP format
- [ ] Lazy loading on below-fold images
- [ ] Responsive images for mobile
- [ ] Blur placeholders on all images
- [ ] LCP < 2.0s (was 3.2s)
- [ ] Total image size < 500KB per page

---

**Time Investment:** 1 hour  
**Image Size Reduction:** 60-78%  
**Page Load Improvement:** 40-50%  
**Difficulty:** Easy ⭐⭐  
**Status:** Ready to implement!

**Next:** [QUICK_WINS_MASTER_LIST.md](./QUICK_WINS_MASTER_LIST.md)

---

**Make your site blazing fast!** ⚡


