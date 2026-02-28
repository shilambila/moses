-- Add admin role and create RLS policies for admin access
-- Add admin to staff roles if not exists
UPDATE staff_registrations SET staff_role = 'Admin' WHERE staff_role = 'Admin';

-- Create policies for admin access to membership registrations
CREATE POLICY "Admins can view all membership registrations" 
ON public.membership_registrations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Admin' 
  AND sr.pending = 'approved'
));

CREATE POLICY "Admins can update membership registrations" 
ON public.membership_registrations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Admin' 
  AND sr.pending = 'approved'
));

-- Create policies for admin access to staff registrations
CREATE POLICY "Admins can view all staff registrations" 
ON public.staff_registrations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Admin' 
  AND sr.pending = 'approved'
));

CREATE POLICY "Admins can update staff registrations" 
ON public.staff_registrations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Admin' 
  AND sr.pending = 'approved'
));