import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mysql } from '@/integrations/mysql/client';

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  staff_role: string;
  assigned_area?: string;
}

interface StaffAuthContextType {
  staffUser: StaffUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a stored staff session
    const storedStaff = localStorage.getItem('staff_user');
    if (storedStaff) {
      try {
        setStaffUser(JSON.parse(storedStaff));
      } catch (error) {
        localStorage.removeItem('staff_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Query staff_registrations directly
      const { data: staffData, error } = await mysql
        .from('staff_registrations')
        .select('*')
        .eq('email', email)
        .eq('pending', 'approved')
        .single();

      if (error || !staffData) {
        return { success: false, error: 'Staff member not found or not approved' };
      }

      if (!staffData.portal_password) {
        return { success: false, error: 'No portal password assigned. Contact your administrator.' };
      }

      if (password !== staffData.portal_password) {
        return { success: false, error: 'Incorrect portal password' };
      }

      // Create staff user object
      const staff: StaffUser = {
        id: staffData.id,
        email: staffData.email,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        staff_role: staffData.staff_role,
        assigned_area: staffData.assigned_area
      };

      setStaffUser(staff);
      localStorage.setItem('staff_user', JSON.stringify(staff));
      
      return { success: true };
    } catch (error) {
      console.error('Staff login error:', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStaffUser(null);
    localStorage.removeItem('staff_user');
  };

  return (
    <StaffAuthContext.Provider value={{ staffUser, login, logout, isLoading }}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};