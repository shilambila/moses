-- Fix security issues: Add missing RLS policies and secure functions

-- Add missing RLS policies for disbursements table
CREATE POLICY "Area coordinators can view area disbursements" 
ON public.disbursements FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  JOIN membership_registrations mr ON mr.id = disbursements.member_id
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Area Coordinator' 
  AND sr.assigned_area = concat(mr.city, ', ', mr.state)
  AND sr.pending = 'approved'
));

CREATE POLICY "Auditors can view all disbursements" 
ON public.disbursements FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role IN ('Auditor', 'Treasurer')
  AND sr.pending = 'approved'
));

CREATE POLICY "Auditors can create disbursements" 
ON public.disbursements FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role IN ('Auditor', 'Treasurer')
  AND sr.pending = 'approved'
));

-- Add missing RLS policies for monthly_expenses table
CREATE POLICY "Auditors can view all expenses" 
ON public.monthly_expenses FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role IN ('Auditor', 'Treasurer')
  AND sr.pending = 'approved'
));

CREATE POLICY "Auditors can create expenses" 
ON public.monthly_expenses FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role IN ('Auditor', 'Treasurer')
  AND sr.pending = 'approved'
));

-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.update_member_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert member balance
  INSERT INTO public.member_balances (member_id, total_contributions, current_balance)
  VALUES (
    NEW.member_id,
    NEW.amount,
    NEW.amount
  )
  ON CONFLICT (member_id) 
  DO UPDATE SET
    total_contributions = member_balances.total_contributions + NEW.amount,
    current_balance = member_balances.current_balance + NEW.amount,
    last_updated = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_probation_dates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set probation end date to 3 months from registration
  NEW.probation_end_date = NEW.registration_date + INTERVAL '3 months';
  
  -- Calculate days to maturity
  NEW.days_to_maturity = EXTRACT(days FROM (NEW.probation_end_date - CURRENT_DATE));
  
  -- Update maturity status
  IF CURRENT_DATE >= NEW.probation_end_date THEN
    NEW.maturity_status = 'mature';
    NEW.days_to_maturity = 0;
  ELSE
    NEW.maturity_status = 'probation';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_maturity_status()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.membership_registrations 
  SET 
    days_to_maturity = GREATEST(0, EXTRACT(days FROM (probation_end_date - CURRENT_DATE))::INTEGER),
    maturity_status = CASE 
      WHEN CURRENT_DATE >= probation_end_date THEN 'mature'
      ELSE 'probation'
    END
  WHERE maturity_status = 'probation' OR days_to_maturity > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;