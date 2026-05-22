import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { post } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Syncs the Supabase session with the backend DB and stores
   * the returned user profile in context.
   */
  async function syncUser(session) {
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await post('/auth/sync');
      setUser(profile);
    } catch (err) {
      console.error('Failed to sync user profile (backend may be offline):', err);
      // Fall back to Supabase session so the user is still considered logged in
      // and the redirect to /courses fires. Full profile loads once backend is up.
      setUser({
        id: null,
        supabaseId: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email,
        avatarUrl: session.user.user_metadata?.avatar_url || null,
        role: 'USER',
        linkedinConnected: false,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch the initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
