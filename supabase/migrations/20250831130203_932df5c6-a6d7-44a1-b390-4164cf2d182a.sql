-- Fix infinite recursion in staff_registrations RLS policies
-- The issue is that admin policies are checking staff_registrations table to verify admin status
-- which creates infinite recursion when querying the same table

DROP POLICY IF EXISTS "Admins can view all staff registrations" ON public.staff_registrations;
DROP POLICY IF EXISTS "Admins can update staff registrations" ON public.staff_registrations;

-- Create a security definer function to check admin status without RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.staff_registrations 
    WHERE user_id = user_id_param 
      AND staff_role = 'Admin' 
      AND pending = 'approved'
  );
$$;

-- Create new admin policies using the security definer function
CREATE POLICY "Admins can view all staff registrations"
ON public.staff_registrations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update staff registrations"
ON public.staff_registrations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Also update membership_registrations policies to use the same function
DROP POLICY IF EXISTS "Admins can view all membership registrations" ON public.membership_registrations;
DROP POLICY IF EXISTS "Admins can update membership registrations" ON public.membership_registrations;

CREATE POLICY "Admins can view all membership registrations"
ON public.membership_registrations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update membership registrations"
ON public.membership_registrations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));