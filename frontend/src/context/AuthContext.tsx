"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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

    // If navigated after logout, do not attempt to restore stale session
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isLoggedOutNotice = params.get("notice") === "logged_out";
      const isLoggedOutSession = sessionStorage.getItem("campusway_logged_out") === "true";
      if (isLoggedOutNotice || isLoggedOutSession) {
        sessionStorage.removeItem("campusway_logged_out");
        setUser(null);
        setLoading(false);
        return;
      }
    }

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

  const logout = async () => {
    try {
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("campusway_logged_out", "true");
      }
      await authService.logout();
    } catch {
      // Ignored: cleanup proceeds regardless
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login?notice=logged_out";
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
