-- First, let's create a MySQL Auth user for the treasurer
-- Note: This needs to be done through the MySQL Auth API, not directly in the database

-- For now, let's create a function that can help link existing staff to auth users
CREATE OR REPLACE FUNCTION public.link_staff_to_user(
  staff_email text,
  auth_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update staff registration to link to the auth user
  UPDATE public.staff_registrations
  SET user_id = auth_user_id,
      updated_at = now()
  WHERE email = staff_email AND user_id IS NULL;
  
  -- Raise notice if no record was updated
  IF NOT FOUND THEN
    RAISE NOTICE 'No staff record found with email % and null user_id', staff_email;
  END IF;
END;
$$;