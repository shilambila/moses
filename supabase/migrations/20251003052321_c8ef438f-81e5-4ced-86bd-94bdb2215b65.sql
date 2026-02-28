-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs daily at midnight to update maturity status
-- First, try to unschedule any existing job (wrapped in DO block to handle errors)
DO $$
BEGIN
  PERFORM cron.unschedule('update-member-maturity-daily');
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore errors if job doesn't exist
END $$;

-- Now schedule the cron job
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

-- Manually update all existing members to have correct probation data
UPDATE public.membership_registrations 
SET 
  days_to_maturity = GREATEST(0, (probation_end_date - CURRENT_DATE)::INTEGER),
  maturity_status = CASE 
    WHEN CURRENT_DATE >= probation_end_date THEN 'mature'
    ELSE 'probation'
  END
WHERE probation_end_date IS NOT NULL;