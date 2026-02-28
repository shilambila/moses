-- Add columns for country, spouse, children, and parent information
ALTER TABLE public.membership_registrations
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS spouse_id_number TEXT,
ADD COLUMN IF NOT EXISTS spouse_phone TEXT,
ADD COLUMN IF NOT EXISTS spouse_alt_phone TEXT,
ADD COLUMN IF NOT EXISTS spouse_sex TEXT,
ADD COLUMN IF NOT EXISTS spouse_area_of_residence TEXT,
ADD COLUMN IF NOT EXISTS spouse_photo_url TEXT,
ADD COLUMN IF NOT EXISTS children_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parent1_name TEXT,
ADD COLUMN IF NOT EXISTS parent1_id_number TEXT,
ADD COLUMN IF NOT EXISTS parent1_phone TEXT,
ADD COLUMN IF NOT EXISTS parent1_alt_phone TEXT,
ADD COLUMN IF NOT EXISTS parent1_area TEXT,
ADD COLUMN IF NOT EXISTS parent2_name TEXT,
ADD COLUMN IF NOT EXISTS parent2_id_number TEXT,
ADD COLUMN IF NOT EXISTS parent2_phone TEXT,
ADD COLUMN IF NOT EXISTS parent2_alt_phone TEXT,
ADD COLUMN IF NOT EXISTS parent2_area TEXT;

-- Add comment to explain children_data structure
COMMENT ON COLUMN public.membership_registrations.children_data IS 'JSON array of children info: [{name, dob, age, birthCertificateUrl}]';