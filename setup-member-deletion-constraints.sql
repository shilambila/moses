-- Comprehensive Member Deletion Setup Script
-- This script ensures all necessary tables and constraints exist for complete member deletion

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure all main tables exist with proper foreign key constraints

-- Ensure membership_registrations table exists (should already exist)
-- This is the main table that other tables reference

-- 2. Ensure all related tables exist with proper CASCADE constraints

-- MPESA Payments table (should exist but ensure FK constraint)
DO $$
BEGIN
    -- Check if foreign key constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'mpesa_payments' 
        AND constraint_name = 'mpesa_payments_member_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add foreign key constraint if it doesn't exist
        ALTER TABLE mpesa_payments 
        ADD CONSTRAINT mpesa_payments_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES membership_registrations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create additional tracking tables if they don't exist

-- Member notification table
CREATE TABLE IF NOT EXISTS member_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sharing table
CREATE TABLE IF NOT EXISTS document_sharing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    shared_by UUID REFERENCES membership_registrations(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES membership_registrations(id) ON DELETE CASCADE,
    share_type TEXT NOT NULL DEFAULT 'view',
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Communication logs table
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    communication_type TEXT NOT NULL, -- 'sms', 'email', 'call', 'whatsapp'
    subject TEXT,
    content TEXT NOT NULL,
    recipient_info JSONB, -- Phone number, email, etc.
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'pending'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB -- Additional data like cost, provider, etc.
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    category TEXT, -- 'payment', 'account', 'technical', 'general'
    assigned_to UUID, -- Staff member handling the ticket
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    device_info JSONB, -- Browser, OS, IP address
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Login activities table  
CREATE TABLE IF NOT EXISTS login_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    login_type TEXT NOT NULL, -- 'success', 'failed', 'logout'
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB, -- Country, city if available
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_info JSONB
);

-- Member activities table
CREATE TABLE IF NOT EXISTS member_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'payment', 'profile_update', 'document_upload'
    activity_description TEXT NOT NULL,
    metadata JSONB, -- Additional activity data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member payments tracking (different from MPESA)
CREATE TABLE IF NOT EXISTS member_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL, -- 'contribution', 'fine', 'membership', 'other'
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'mpesa', 'bank', 'cash', 'check'
    payment_reference TEXT,
    payment_date DATE NOT NULL,
    status TEXT DEFAULT 'confirmed',
    recorded_by UUID, -- Staff member who recorded the payment
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    payment_id UUID, -- Reference to payment record
    action_type TEXT NOT NULL, -- 'created', 'modified', 'cancelled', 'refunded'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID, -- Staff member who made the change
    change_reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member files/documents table
CREATE TABLE IF NOT EXISTS member_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'profile_picture', 'id_document', 'certificate', 'other'
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID, -- Staff or member who uploaded
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL, -- 'notification', 'privacy', 'display'
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, preference_type, preference_key)
);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    alternative_phone TEXT,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES membership_registrations(id) ON DELETE CASCADE,
    beneficiary_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    id_number TEXT,
    phone_number TEXT,
    email TEXT,
    percentage DECIMAL(5,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance

-- Index on member_id columns for better deletion performance
CREATE INDEX IF NOT EXISTS idx_member_notifications_member_id ON member_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_document_sharing_shared_by ON document_sharing(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_sharing_shared_with ON document_sharing(shared_with);
CREATE INDEX IF NOT EXISTS idx_communication_logs_member_id ON communication_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_member_id ON support_tickets(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_member_id ON member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_member_id ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_member_id ON payment_history(member_id);
CREATE INDEX IF NOT EXISTS idx_member_files_member_id ON member_files(member_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_member_id ON user_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_member_id ON emergency_contacts(member_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_member_id ON beneficiaries(member_id);

-- Email indexes for session and login tables
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_login_activities_email ON login_activities(user_email);

-- 5. Enable RLS on new tables
ALTER TABLE member_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies for staff access
-- These policies allow staff to access data based on their roles

-- Member notifications - staff can view and manage
CREATE POLICY IF NOT EXISTS "Staff can manage member notifications"
ON member_notifications FOR ALL
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.pending = 'approved'
  AND sr.staff_role IN ('Admin', 'General Coordinator', 'Customer Service')
));

-- Communication logs - staff can view and create
CREATE POLICY IF NOT EXISTS "Staff can manage communication logs"
ON communication_logs FOR ALL
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.pending = 'approved'
  AND sr.staff_role IN ('Admin', 'General Coordinator', 'Customer Service')
));

-- Support tickets - staff can manage
CREATE POLICY IF NOT EXISTS "Staff can manage support tickets"
ON support_tickets FOR ALL
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.pending = 'approved'
));

-- 7. Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DO $$
BEGIN
    -- Support tickets
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_support_tickets_updated_at') THEN
        CREATE TRIGGER update_support_tickets_updated_at
            BEFORE UPDATE ON support_tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Member payments
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_member_payments_updated_at') THEN
        CREATE TRIGGER update_member_payments_updated_at
            BEFORE UPDATE ON member_payments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Emergency contacts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_emergency_contacts_updated_at') THEN
        CREATE TRIGGER update_emergency_contacts_updated_at
            BEFORE UPDATE ON emergency_contacts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Beneficiaries
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_beneficiaries_updated_at') THEN
        CREATE TRIGGER update_beneficiaries_updated_at
            BEFORE UPDATE ON beneficiaries
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 8. Final verification query - uncomment to check what tables reference membership_registrations
/*
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'membership_registrations'
ORDER BY tc.table_name;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive member deletion setup completed successfully!';
    RAISE NOTICE 'All tables now have proper CASCADE constraints on membership_registrations(id)';
    RAISE NOTICE 'Additional tracking tables have been created for comprehensive deletion';
END $$;