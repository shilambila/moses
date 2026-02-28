-- Add RLS policy for General Coordinators to view all members
CREATE POLICY "General coordinators can view all members"
ON public.membership_registrations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = 'General Coordinator'
      AND sr.pending = 'approved'
  )
);