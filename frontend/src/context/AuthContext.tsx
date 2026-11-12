"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types/auth";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      // Redirect to login page after successful logout
      router.push("/login?notice=logged_out");
    } catch {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      logout,
      refreshUser,
    }),
    [user, loading, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
