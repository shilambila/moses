-- Setup script for disbursement documents storage bucket
-- Run this in your MySQL SQL editor to create the storage bucket and set up proper policies

-- First, ensure the disbursement-documents storage bucket exists
-- Note: Storage buckets are usually created through the MySQL dashboard or via the createBucket API call
-- This is handled automatically in the EnhancedDisbursementForm component

-- Create RLS policies for the storage bucket
-- These policies allow authenticated users with appropriate roles to upload, view, and manage documents

-- Policy 1: Allow authenticated staff members to upload documents
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, created_at, updated_at)
VALUES (
  'disbursement-documents-upload-policy',
  'disbursement-documents',
  'Allow authenticated staff to upload disbursement documents',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role IN (''Admin'', ''Treasurer'', ''Auditor''))))',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role IN (''Admin'', ''Treasurer'', ''Auditor''))))',
  'INSERT',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition,
  check = EXCLUDED.check,
  updated_at = now();

-- Policy 2: Allow authenticated staff members to view/download documents
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, created_at, updated_at)
VALUES (
  'disbursement-documents-select-policy',
  'disbursement-documents',
  'Allow authenticated staff to view disbursement documents',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role IN (''Admin'', ''Treasurer'', ''Auditor'', ''Secretary''))))',
  NULL,
  'SELECT',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition,
  updated_at = now();

-- Policy 3: Allow authenticated admin/treasurer to update/replace documents
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, created_at, updated_at)
VALUES (
  'disbursement-documents-update-policy',
  'disbursement-documents',
  'Allow admin/treasurer to update disbursement documents',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role IN (''Admin'', ''Treasurer''))))',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role IN (''Admin'', ''Treasurer''))))',
  'UPDATE',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition,
  check = EXCLUDED.check,
  updated_at = now();

-- Policy 4: Allow authenticated admin to delete documents if needed
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command, created_at, updated_at)
VALUES (
  'disbursement-documents-delete-policy',
  'disbursement-documents',
  'Allow admin to delete disbursement documents',
  '(auth.role() = ''authenticated'') AND ((EXISTS (SELECT 1 FROM public.staff_registrations WHERE staff_registrations.user_id = auth.uid() AND staff_registrations.pending = ''approved'' AND staff_registrations.staff_role = ''Admin'')))',
  NULL,
  'DELETE',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition,
  updated_at = now();

-- Ensure the disbursements table has the bereavement_form_url column
-- This adds the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'disbursements' 
        AND column_name = 'bereavement_form_url'
    ) THEN
        ALTER TABLE public.disbursements ADD COLUMN bereavement_form_url TEXT;
        COMMENT ON COLUMN public.disbursements.bereavement_form_url IS 'URL to the uploaded bereavement form document';
    END IF;
END $$;

-- Create an index on bereavement_form_url for better performance
CREATE INDEX IF NOT EXISTS idx_disbursements_bereavement_form_url 
ON public.disbursements(bereavement_form_url) 
WHERE bereavement_form_url IS NOT NULL;

-- Display current storage buckets for verification
SELECT 
    id,
    name,
    owner,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE name = 'disbursement-documents';

-- Display storage policies for verification
SELECT 
    id,
    bucket_id,
    name,
    definition,
    check,
    command,
    created_at
FROM storage.policies 
WHERE bucket_id = 'disbursement-documents'
ORDER BY command, name;