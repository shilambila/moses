-- Alternative approach: Create a table to store bereavement documents as base64
-- This avoids Supabase storage bucket permission issues by storing files directly in the database

-- Create the documents table
CREATE TABLE IF NOT EXISTS public.disbursement_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    disbursement_id UUID NOT NULL REFERENCES public.disbursements(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_data TEXT NOT NULL, -- Base64 encoded file content
    uploaded_by TEXT, -- Staff member who uploaded the document
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the documents table
ALTER TABLE public.disbursement_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for document access
-- Policy 1: Allow staff members to insert documents
CREATE POLICY "Staff can upload disbursement documents" 
ON public.disbursement_documents FOR INSERT 
WITH CHECK (true); -- We'll validate permissions in the application

-- Policy 2: Allow staff members to view documents
CREATE POLICY "Staff can view disbursement documents" 
ON public.disbursement_documents FOR SELECT 
USING (true); -- We'll validate permissions in the application

-- Policy 3: Allow staff members to update documents
CREATE POLICY "Staff can update disbursement documents" 
ON public.disbursement_documents FOR UPDATE 
USING (true); -- We'll validate permissions in the application

-- Policy 4: Allow staff members to delete documents
CREATE POLICY "Staff can delete disbursement documents" 
ON public.disbursement_documents FOR DELETE 
USING (true); -- We'll validate permissions in the application

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disbursement_documents_disbursement_id 
ON public.disbursement_documents(disbursement_id);

CREATE INDEX IF NOT EXISTS idx_disbursement_documents_uploaded_at 
ON public.disbursement_documents(uploaded_at);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_disbursement_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_disbursement_documents_updated_at
  BEFORE UPDATE ON public.disbursement_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_disbursement_documents_updated_at();

-- Display the created table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'disbursement_documents'
ORDER BY ordinal_position;