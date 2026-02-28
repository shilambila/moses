-- Allow treasurers and admins to insert contributions (for manual payment entry)
CREATE POLICY "Treasurers and Admins can create contributions"
ON public.contributions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role IN ('Auditor', 'Treasurer', 'Admin')
      AND sr.pending = 'approved'
  )
);

-- Also allow them to insert mpesa_payments records
CREATE POLICY "Treasurers and Admins can create mpesa payments"
ON public.mpesa_payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role IN ('Auditor', 'Treasurer', 'Admin')
      AND sr.pending = 'approved'
  )
);