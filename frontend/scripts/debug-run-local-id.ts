import { runLocalIdVerification } from '@/lib/id-verification/local-processor';
import { createServiceClient } from '@/lib/supabase/service';

async function main() {
  const requestId = process.argv[2];
  if (!requestId) {
    throw new Error('Usage: pnpm tsx scripts/debug-run-local-id.ts <requestId>');
  }

  const serviceClient = createServiceClient();

  if (!serviceClient) {
    throw new Error('Service client unavailable. Ensure SUPABASE_SERVICE_ROLE_KEY is set.');
  }

  const { data: requestRecord, error } = await serviceClient
    .from('id_verification_requests')
    .select('id, booking_id, user_id, metadata')
    .eq('id', requestId)
    .single();

  if (error || !requestRecord) {
    throw error ?? new Error(`Request ${requestId} not found`);
  }

  const metadata = (requestRecord.metadata ?? {}) as {
    documentPath?: string;
    documentPaths?: string[];
    selfiePath?: string;
  };

  const documentPath =
    typeof metadata.documentPath === 'string'
      ? metadata.documentPath
      : Array.isArray(metadata.documentPaths)
        ? metadata.documentPaths[0] ?? null
        : null;

  if (!documentPath || !metadata.selfiePath) {
    throw new Error('Request metadata is missing document or selfie path');
  }

  const result = await runLocalIdVerification({
    requestId: requestRecord.id,
    bookingId: requestRecord.booking_id,
    userId: requestRecord.user_id,
    documentPath,
    selfiePath: metadata.selfiePath,
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        status: result.status,
        failureReasons: result.failureReasons,
        scores: result.scores,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

