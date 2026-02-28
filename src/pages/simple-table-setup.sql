-- Simple setup for disbursement documents table
-- Copy and paste this into your Supabase SQL Editor and click Run

CREATE TABLE IF NOT EXISTS public.disbursement_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    disbursement_id UUID NOT NULL REFERENCES public.disbursements(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_data TEXT NOT NULL,
    uploaded_by TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disbursement_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for staff" ON public.disbursement_documents FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_disbursement_documents_disbursement_id ON public.disbursement_documents(disbursement_id);

-- Verify table was created
SELECT 'Table created successfully!' as status;