-- Reset all TNS numbers to proper sequential format starting from TNS001
-- First, temporarily remove the unique constraint to allow updates
ALTER TABLE public.membership_registrations DROP CONSTRAINT IF EXISTS membership_registrations_tns_number_key;

-- Update all members to have proper sequential TNS numbers
WITH numbered_members AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM public.membership_registrations
)
UPDATE public.membership_registrations 
SET tns_number = 'TNS' || LPAD(numbered_members.row_num::TEXT, 3, '0')
FROM numbered_members
WHERE membership_registrations.id = numbered_members.id;

-- Re-add the unique constraint
ALTER TABLE public.membership_registrations ADD CONSTRAINT membership_registrations_tns_number_key UNIQUE (tns_number);