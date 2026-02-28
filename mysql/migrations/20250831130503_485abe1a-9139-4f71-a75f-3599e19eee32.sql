-- Approve Brian as Admin
UPDATE public.staff_registrations 
SET staff_role = 'Admin', 
    user_id = 'db29206e-307a-4b6a-865b-c73c8b7b44d1',
    pending = 'approved',
    updated_at = now()
WHERE email = 'brianokutu@gmail.com';