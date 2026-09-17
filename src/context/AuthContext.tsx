"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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
    setLoading(true);
    setError("");

    try {
      const { user } = await api.get<{ user: Staff }>("/auth/me", {
        timeoutMs: 10000,
        suppressAuthExpired: true,
        suppressGlobalError: true,
      });

      setUser(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError("");
      } else {
        setUser(null);
        setError(
          "KhairoDietClinic could not verify your session because the server is temporarily unavailable."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // One-time migration cleanup. Staff authentication is now cookie-only and
    // the JWT is never exposed to browser JavaScript.
    localStorage.removeItem("khairo_staff_token");
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setError("");
      setLoading(false);
    };

    window.addEventListener("staff-auth:expired", handleExpired);
    return () => window.removeEventListener("staff-auth:expired", handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: Staff }>(
      "/auth/login",
      { email, password },
      {
        suppressAuthExpired: true,
        suppressGlobalError: true,
      }
    );

    setUser(data.user);
    setError("");
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout",
        undefined,
        {
          suppressAuthExpired: true,
          suppressGlobalError: true,
        }
      );
    } catch {
      // Local sign-out must still succeed if the API is unavailable.
    } finally {
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        refresh: refreshUser,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
