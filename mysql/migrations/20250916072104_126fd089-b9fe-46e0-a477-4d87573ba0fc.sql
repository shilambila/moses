-- Update the TNS number generation function to use 4-digit format
CREATE OR REPLACE FUNCTION public.generate_next_tns_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number INTEGER;
    new_tns_number TEXT;
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
    
    -- Format as TNS0001, TNS0002, etc. (4 digits instead of 3)
    new_tns_number := 'TNS' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_tns_number;
END;
$function$;