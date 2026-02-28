-- First, let's see what staff roles are allowed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'staff_registrations_staff_role_check';

-- Then we'll add 'Admin' to the allowed roles if it's not there
DO $$
BEGIN
    -- Drop the existing constraint
    ALTER TABLE public.staff_registrations DROP CONSTRAINT IF EXISTS staff_registrations_staff_role_check;
    
    -- Add the new constraint with Admin included
    ALTER TABLE public.staff_registrations 
    ADD CONSTRAINT staff_registrations_staff_role_check 
    CHECK (staff_role = ANY (ARRAY['Area Coordinator'::text, 'General Coordinator'::text, 'Secretary'::text, 'Customer Service'::text, 'Auditor'::text, 'Treasurer'::text, 'Admin'::text]));
    
    -- Now approve Brian as Admin
    UPDATE public.staff_registrations 
    SET staff_role = 'Admin', 
        user_id = 'db29206e-307a-4b6a-865b-c73c8b7b44d1',
        pending = 'approved',
        updated_at = now()
    WHERE email = 'brianokutu@gmail.com';
END $$;