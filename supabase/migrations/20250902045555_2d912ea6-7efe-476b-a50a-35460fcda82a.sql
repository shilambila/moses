-- First, let's create the functions without the problematic update
CREATE OR REPLACE FUNCTION public.generate_next_tns_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
    result_tns_number TEXT;
    current_max INTEGER;
BEGIN
    -- Get the highest existing numeric TNS number
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN mr.tns_number ~ '^TNS[0-9]+$' 
                THEN CAST(SUBSTRING(mr.tns_number FROM 4) AS INTEGER)
                ELSE 0
            END
        ), 0
    )
    INTO current_max
    FROM public.membership_registrations mr
    WHERE mr.tns_number IS NOT NULL;
    
    -- If we have existing large numbers (like TNS333358), continue from there
    -- Otherwise start from 001
    IF current_max >= 1000 THEN
        next_number := current_max + 1;
        result_tns_number := 'TNS' || next_number::TEXT;
    ELSE
        next_number := GREATEST(current_max + 1, 1);
        result_tns_number := 'TNS' || LPAD(next_number::TEXT, 3, '0');
    END IF;
    
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

-- Safely update existing members without TNS numbers
-- We'll assign them TNS001, TNS002, etc. since the big numbers are already taken
UPDATE public.membership_registrations 
SET tns_number = 'TNS' || LPAD(
    (ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0'
)
WHERE tns_number IS NULL;