-- Fix the EXTRACT function in calculate_probation_dates function
CREATE OR REPLACE FUNCTION public.calculate_probation_dates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set probation end date to 3 months from registration
  NEW.probation_end_date = NEW.registration_date + INTERVAL '3 months';
  
  -- Calculate days to maturity (fix the EXTRACT function)
  NEW.days_to_maturity = GREATEST(0, (NEW.probation_end_date - CURRENT_DATE)::INTEGER);
  
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

-- Fix the EXTRACT function in update_maturity_status function
CREATE OR REPLACE FUNCTION public.update_maturity_status()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.membership_registrations 
  SET 
    days_to_maturity = GREATEST(0, (probation_end_date - CURRENT_DATE)::INTEGER),
    maturity_status = CASE 
      WHEN CURRENT_DATE >= probation_end_date THEN 'mature'
      ELSE 'probation'
    END
  WHERE maturity_status = 'probation' OR days_to_maturity > 0;
END;
$$;