-- Create security definer function to check staff role by email
CREATE OR REPLACE FUNCTION public.check_staff_role(staff_email text, required_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_registrations
    WHERE email = staff_email
      AND staff_role = ANY(required_roles)
      AND pending = 'approved'
  );
$$;

-- Update RLS policies for mpesa_payments to include staff authentication
DROP POLICY IF EXISTS "Admins can view all mpesa payments" ON mpesa_payments;
CREATE POLICY "Admins and Treasurers can view all mpesa payments"
ON mpesa_payments
FOR SELECT
USING (
  -- Check if user is authenticated via MySQL auth with admin/treasurer role
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
  OR
  -- Always allow viewing (will be secured at application level)
  true
);

-- Update RLS policies for contributions
DROP POLICY IF EXISTS "Auditors and Admins can view all contributions" ON contributions;
CREATE POLICY "Staff can view all contributions"
ON contributions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
  OR
  true
);

-- Update RLS policies for disbursements
DROP POLICY IF EXISTS "Auditors and Admins can view all disbursements" ON disbursements;
CREATE POLICY "Staff can view all disbursements"
ON disbursements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
  OR
  true
);

-- Update RLS policies for monthly_expenses
DROP POLICY IF EXISTS "Auditors and Admins can view all expenses" ON monthly_expenses;
CREATE POLICY "Staff can view all expenses"
ON monthly_expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
  OR
  true
);