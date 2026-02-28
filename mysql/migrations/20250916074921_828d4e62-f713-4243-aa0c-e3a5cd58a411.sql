-- Create MPESA payments table
CREATE TABLE public.mpesa_payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL,
    amount numeric NOT NULL,
    phone_number text NOT NULL,
    mpesa_receipt_number text,
    checkout_request_id text,
    merchant_request_id text,
    transaction_date timestamp with time zone,
    result_code text,
    result_desc text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for MPESA payments
CREATE POLICY "Admins can view all mpesa payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (EXISTS ( 
    SELECT 1 
    FROM staff_registrations sr 
    WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY (ARRAY['Auditor'::text, 'Treasurer'::text, 'Admin'::text]) 
    AND sr.pending = 'approved'::text
));

CREATE POLICY "Area coordinators can view area mpesa payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (EXISTS ( 
    SELECT 1 
    FROM (staff_registrations sr
     JOIN membership_registrations mr ON ((mr.id = mpesa_payments.member_id)))
  WHERE ((sr.user_id = auth.uid()) 
    AND (sr.staff_role = 'Area Coordinator'::text) 
    AND (sr.assigned_area = concat(mr.city, ', ', mr.state)) 
    AND (sr.pending = 'approved'::text))
));

-- Create trigger for timestamps
CREATE TRIGGER update_mpesa_payments_updated_at
BEFORE UPDATE ON public.mpesa_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_mpesa_payments_member_id ON public.mpesa_payments(member_id);
CREATE INDEX idx_mpesa_payments_checkout_request_id ON public.mpesa_payments(checkout_request_id);
CREATE INDEX idx_mpesa_payments_status ON public.mpesa_payments(status);