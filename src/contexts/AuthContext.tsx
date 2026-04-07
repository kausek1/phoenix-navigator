import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "contributor" | "viewer";

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  client_id: string;
}

interface ClientInfo {
  id: string;
  name: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  client: ClientInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  clientId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, role, client_id")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", profileData.client_id)
        .single();
      if (clientData) setClient(clientData as ClientInfo);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setClient(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      client,
      isAuthenticated: !!session,
      isLoading,
      role,
      clientId: profile?.client_id ?? null,
      canEdit: role === "admin" || role === "contributor",
      canDelete: role === "admin",
      login,
      signup,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
