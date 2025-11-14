-- Add signed document storage columns to contracts table
-- These columns store the URL and path to the signed contract PDF in Supabase Storage

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS "signedDocumentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "signedDocumentPath" TEXT;

-- Add index for faster lookups by signed document path
CREATE INDEX IF NOT EXISTS idx_contracts_signed_document_path
ON contracts("signedDocumentPath");

-- Comment the columns
COMMENT ON COLUMN contracts."signedDocumentUrl" IS 'Public URL to the signed contract document in Supabase Storage';
COMMENT ON COLUMN contracts."signedDocumentPath" IS 'Storage path to the signed contract document (for deletion/updates)';
































































