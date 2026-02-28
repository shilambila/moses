-- Update existing TNS numbers to use 4-digit format
UPDATE public.membership_registrations 
SET tns_number = 'TNS' || LPAD(SUBSTRING(tns_number FROM 4), 4, '0')
WHERE tns_number ~ '^TNS[0-9]{1,3}$';