-- Create documents table for secretary document management
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'meeting_minutes', 'official_letter', 'template', 'correspondence'
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meeting_date DATE, -- For meeting minutes
  recipient TEXT, -- For letters and correspondence
  template_category TEXT, -- For templates
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  tags TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for document access
CREATE POLICY "Secretaries can view all documents" 
ON public.documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = 'Secretary' 
    AND sr.pending = 'approved'
));

CREATE POLICY "Secretaries can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_registrations sr
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = 'Secretary' 
    AND sr.pending = 'approved'
) AND created_by = auth.uid());

CREATE POLICY "Secretaries can update documents" 
ON public.documents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = 'Secretary' 
    AND sr.pending = 'approved'
));

CREATE POLICY "Secretaries can delete documents" 
ON public.documents 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = 'Secretary' 
    AND sr.pending = 'approved'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();