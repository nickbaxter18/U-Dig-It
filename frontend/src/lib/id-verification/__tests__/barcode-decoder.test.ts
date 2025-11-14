import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { __testables } from '@/lib/id-verification/local-processor';

const { decodeBarcode } = __testables;

async function createBlankImageBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 320,
      height: 200,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe('decodeBarcode', () => {
  it(
    'returns null when no barcode is present',
    { timeout: 30000 },
    async () => {
      const blank = await createBlankImageBuffer();

      const result = await decodeBarcode(blank);

      expect(result).toBeNull();
    }
  );
});
