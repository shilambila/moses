-- Create contributions table
CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.membership_registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contribution_type TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table for approval workflows
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL, -- 'coordinator_task', 'secretary_task', 'auditor_task'
  submitted_by UUID NOT NULL,
  submitted_to_role TEXT NOT NULL, -- 'general_coordinator', 'coordinator'
  assigned_area TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  priority TEXT DEFAULT 'medium',
  data JSONB, -- Store any additional task data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disbursements table for auditor tracking
CREATE TABLE public.disbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.membership_registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table for monthly tracking
CREATE TABLE public.monthly_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  approved_by UUID,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create member_balances table for tracking individual balances
CREATE TABLE public.member_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.membership_registrations(id) ON DELETE CASCADE,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_contributions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_disbursements DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

-- Add probation and maturity fields to membership_registrations
ALTER TABLE public.membership_registrations 
ADD COLUMN registration_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN probation_end_date DATE,
ADD COLUMN maturity_status TEXT DEFAULT 'probation',
ADD COLUMN days_to_maturity INTEGER,
ADD COLUMN tns_number TEXT UNIQUE;

-- Enable RLS on all new tables
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contributions
CREATE POLICY "Area coordinators can view area contributions" 
ON public.contributions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  JOIN membership_registrations mr ON mr.id = contributions.member_id
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Area Coordinator' 
  AND sr.assigned_area = concat(mr.city, ', ', mr.state)
  AND sr.pending = 'approved'
));

CREATE POLICY "Customer service can view all contributions" 
ON public.contributions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Customer Service'
  AND sr.pending = 'approved'
));

CREATE POLICY "Auditors can view all contributions" 
ON public.contributions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role IN ('Auditor', 'Treasurer')
  AND sr.pending = 'approved'
));

-- RLS Policies for tasks
CREATE POLICY "Staff can view their own tasks" 
ON public.tasks FOR SELECT 
USING (submitted_by = auth.uid());

CREATE POLICY "Staff can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "General coordinators can view all tasks" 
ON public.tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'General Coordinator'
  AND sr.pending = 'approved'
));

-- RLS Policies for member_balances
CREATE POLICY "Area coordinators can view area balances" 
ON public.member_balances FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  JOIN membership_registrations mr ON mr.id = member_balances.member_id
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Area Coordinator' 
  AND sr.assigned_area = concat(mr.city, ', ', mr.state)
  AND sr.pending = 'approved'
));

CREATE POLICY "Customer service can view all balances" 
ON public.member_balances FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
  AND sr.staff_role = 'Customer Service'
  AND sr.pending = 'approved'
));

-- Create function to update member balance
CREATE OR REPLACE FUNCTION public.update_member_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for contributions
CREATE TRIGGER update_balance_on_contribution
  AFTER INSERT ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_balance();

-- Create function to calculate probation end date
CREATE OR REPLACE FUNCTION public.calculate_probation_dates()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic probation calculation
CREATE TRIGGER calculate_member_probation
  BEFORE INSERT OR UPDATE ON public.membership_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_probation_dates();

-- Create function to update maturity status daily
CREATE OR REPLACE FUNCTION public.update_maturity_status()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at
  BEFORE UPDATE ON public.disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.monthly_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();