-- Create function to generate next sequential TNS number
CREATE OR REPLACE FUNCTION public.generate_next_tns_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
    result_tns_number TEXT;
BEGIN
    -- Get the highest existing TNS number
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN mr.tns_number ~ '^TNS[0-9]+$' 
                THEN CAST(SUBSTRING(mr.tns_number FROM 4) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1
    INTO next_number
    FROM public.membership_registrations mr
    WHERE mr.tns_number IS NOT NULL;
    
    -- Format as TNS001, TNS002, etc.
    result_tns_number := 'TNS' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN result_tns_number;
END;
$$;

-- Create function to auto-assign TNS number on insert
CREATE OR REPLACE FUNCTION public.assign_tns_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Auto-assign TNS number if not provided
    IF NEW.tns_number IS NULL THEN
        NEW.tns_number = public.generate_next_tns_number();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-assign TNS numbers
DROP TRIGGER IF EXISTS trigger_assign_tns_number ON public.membership_registrations;
CREATE TRIGGER trigger_assign_tns_number
    BEFORE INSERT ON public.membership_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_tns_number();

-- Update existing members without TNS numbers one by one to avoid conflicts
DO $$
DECLARE
    member_record RECORD;
    next_tns_number TEXT;
BEGIN
    FOR member_record IN 
        SELECT id FROM public.membership_registrations 
        WHERE tns_number IS NULL 
        ORDER BY created_at
    LOOP
        -- Generate the next available TNS number
        next_tns_number := public.generate_next_tns_number();
        
        -- Update this specific member
        UPDATE public.membership_registrations 
        SET tns_number = next_tns_number
        WHERE id = member_record.id;
    END LOOP;
END $$;