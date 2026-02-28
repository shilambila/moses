-- Add password field to staff_registrations table
ALTER TABLE public.staff_registrations 
ADD COLUMN portal_password text;