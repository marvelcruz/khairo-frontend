"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, ApiError } from "../lib/api";

type Staff = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
};

type AuthContextType = {
  user: Staff | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<Staff>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("khairo_staff_token");

    if (!token) {
      setUser(null);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { user } = await api.get<{ user: Staff }>("/auth/me", {
        timeoutMs: 10000,
      });

      setUser(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("khairo_staff_token");
        setUser(null);
        setError("");
      } else {
        setUser(null);
        setError(
          "Khairo Diet Clinic could not verify your session because the server is temporarily unavailable."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("khairo_staff_token");
      setUser(null);
      setError("");
    };
    window.addEventListener("staff-auth:expired", handleExpired);
    return () => window.removeEventListener("staff-auth:expired", handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: Staff }>("/auth/login", { email, password });
    localStorage.setItem("khairo_staff_token", data.token);
    setUser(data.user);
    setError("");
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Local sign-out must still succeed if the API is unavailable.
    } finally {
      localStorage.removeItem("khairo_staff_token");
      setUser(null);
      setError("");
    }
  };

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      return user.roles.some((r) => roles.includes(r));
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.roles.includes("admin")) return true;
      return user.permissions?.includes(permission) || false;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh: refreshUser, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
