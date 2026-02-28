import { useState, useEffect, createContext, useContext } from "react";
import { mysql } from "@/integrations/mysql/client";

interface AuthUser {
  id: string;
}

interface AuthSession {
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = mysql.auth.onAuthStateChange(
      (_event, sessionData) => {
        setSession(sessionData as AuthSession | null);
        setUser((sessionData as AuthSession | null)?.user ?? null);
        setLoading(false);
      }
    );

    mysql.auth.getSession().then(({ data: { session: sessionData } }) => {
      setSession(sessionData as AuthSession | null);
      setUser((sessionData as AuthSession | null)?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await mysql.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
