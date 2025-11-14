import fs from 'node:fs';
import path from 'node:path';

// Provide fallback Supabase env vars so shared modules don't throw during import.
process.env.NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL ?? 'true';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'local-anon-key-not-used';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'local-service-role-key-not-used';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: pnpm tsx scripts/decode-barcode-local.ts <image-path>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  const buffer = fs.readFileSync(absolutePath);

  const { __testables } = await import('@/lib/id-verification/local-processor');
  const result = await __testables.decodeBarcode(buffer);
  console.log('Decode result:', result);
}

main().catch((error) => {
  console.error('Decode failed:', error);
  process.exit(1);
});
