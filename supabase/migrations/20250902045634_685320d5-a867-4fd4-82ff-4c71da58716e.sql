-- Create the function to generate next TNS number
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
    
    -- Continue from the highest number, or start from 1 if none exist
    next_number := current_max + 1;
    result_tns_number := 'TNS' || next_number::TEXT;
    
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

-- Update existing members without TNS numbers using a simple approach
DO $$
DECLARE
    member_record RECORD;
    counter INTEGER := 1;
    new_tns_number TEXT;
    max_existing INTEGER;
BEGIN
    -- Get the current maximum TNS number
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN tns_number ~ '^TNS[0-9]+$' 
                THEN CAST(SUBSTRING(tns_number FROM 4) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) INTO max_existing
    FROM public.membership_registrations
    WHERE tns_number IS NOT NULL;
    
    -- Start counter from the next available number
    counter := max_existing + 1;
    
    -- Update each member without a TNS number
    FOR member_record IN 
        SELECT id FROM public.membership_registrations 
        WHERE tns_number IS NULL 
        ORDER BY created_at
    LOOP
        new_tns_number := 'TNS' || counter::TEXT;
        
        UPDATE public.membership_registrations 
        SET tns_number = new_tns_number
        WHERE id = member_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;