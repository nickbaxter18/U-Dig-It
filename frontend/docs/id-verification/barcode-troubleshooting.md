# Barcode Verification Troubleshooting

This workflow replaces the removed synthetic barcode Vitest suite. Use it when diagnosing `document_barcode_missing` results in `id_verification_results`.

## Quick Reference
- Source images live in the `idkit-intake` bucket (`id_verification_requests.document_paths`).
- Local reprocessing happens in `runLocalIdVerification` with `decodeBarcode`.
- Supabase `id_verification_results.extracted_fields.barcode_raw` stores the decoded payload when available.

## Manual Verification Steps
1. **Download Assets**
   - Grab `documentBack` from Supabase storage via signed URL (`createSignedUrl`).
   - Save locally as `back.jpg`.
2. **Run Local Decoder**
   - From `frontend/`, execute `pnpm tsx scripts/decode-barcode.ts --input back.jpg` (see script instructions below).
   - Inspect the logged attempts and the decoded text.
3. **Audit Supabase Rows**
   - Query recent failures:
     ```sql
     select request_id, failure_reasons, extracted_fields->>'barcode_raw'
     from id_verification_results
     where failure_reasons ? 'document_barcode_missing'
     order by processed_at desc
     limit 20;
     ```
   - Confirm the decoded payload matches what the decoder outputs.
4. **Update Guidance**
   - If the barcode succeeds locally, push UX guidance to `LicenseUploadSection`.
   - If decoding fails, capture the image variant and log the failure for future analysis.

## Diagnostic Script (`scripts/decode-barcode.ts`)
Create a temporary script to reuse the `decodeBarcode` helper without reinstating the deleted test:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { __testables } from '@/lib/id-verification/local-processor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const inputIndex = process.argv.findIndex((arg) => arg === '--input');
  if (inputIndex === -1 || !process.argv[inputIndex + 1]) {
    console.error('Usage: pnpm tsx scripts/decode-barcode.ts --input <file>');
    process.exit(1);
  }

  const filePath = path.resolve(__dirname, '..', process.argv[inputIndex + 1]);
  const buffer = await fs.readFile(filePath);
  const result = await __testables.decodeBarcode(buffer);

  if (!result) {
    console.log('No barcode detected.');
    return;
  }

  console.log('Decoded format:', result.format);
  console.log('Decoded text:', result.text);
}

main().catch((error) => {
  console.error('Decoding failed:', error);
  process.exit(1);
});
```

> **Note:** Do not commit the script permanently. Keep it as a local diagnostic tool or convert it into an integration test that uses real anonymised fixtures before committing.

## Common Failure Patterns
- **Low contrast or glare**: Ask the customer to capture under indirect lighting.
- **Barcode cropped**: Ensure the entire PDF417 block is visible.
- **Severe rotation**: Decoder handles coarse/fine rotation, but skew >10° still fails. Request a retake.
- **Compression artifacts**: Excessive JPEG compression may obscure modules. Capture at higher resolution.

## Next Steps
- Collect failing samples and extend `decodeBarcode` with targeted transforms.
- When comfortable with real fixture coverage, add anonymised images under `test-data/id-verification/` and reinstate an automated test.
- Document any additional guidance in `LicenseUploadSection` so the customer sees actionable tips.






