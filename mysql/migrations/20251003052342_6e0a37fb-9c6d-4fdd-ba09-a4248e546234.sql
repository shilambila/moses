-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Ensure pg_net extension is enabled for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists
SELECT cron.unschedule('update-member-maturity-daily');

-- Create a cron job that runs daily at midnight to update maturity status
SELECT cron.schedule(
  'update-member-maturity-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  UPDATE public.membership_registrations 
  SET 
    days_to_maturity = GREATEST(0, (probation_end_date - CURRENT_DATE)::INTEGER),
    maturity_status = CASE 
      WHEN CURRENT_DATE >= probation_end_date THEN 'mature'
      ELSE 'probation'
    END
  WHERE maturity_status = 'probation' OR days_to_maturity > 0;
  $$
);

-- Also update the calculate_probation_dates trigger to ensure proper calculation on new registrations
CREATE OR REPLACE FUNCTION public.calculate_probation_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Set probation end date to 3 months from registration
  NEW.probation_end_date = NEW.registration_date + INTERVAL '3 months';
  
  -- Calculate days to maturity correctly
  NEW.days_to_maturity = GREATEST(0, (NEW.probation_end_date - CURRENT_DATE)::INTEGER);
  
  -- Update maturity status based on current date vs probation end date
  IF CURRENT_DATE >= NEW.probation_end_date THEN
    NEW.maturity_status = 'mature';
    NEW.days_to_maturity = 0;
  ELSE
    NEW.maturity_status = 'probation';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Manually update all existing members to have correct probation data
UPDATE public.membership_registrations 
SET 
  days_to_maturity = GREATEST(0, (probation_end_date - CURRENT_DATE)::INTEGER),
  maturity_status = CASE 
    WHEN CURRENT_DATE >= probation_end_date THEN 'mature'
    ELSE 'probation'
  END
WHERE probation_end_date IS NOT NULL;