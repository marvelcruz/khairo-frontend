"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type PortalStage =
  | "preview"
  | "active"
  | "paused"
  | "completed";

export type PortalAccess = {
  stage: PortalStage;
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: string | null;
  programStartedAt?: string | null;
  programEndsAt?: string | null;
  programDay?: number | null;
  currentWeek?: number | null;
  totalDays?: number | null;
  daysRemaining?: number | null;
};

export type ClientProfile = {
  _id?: string;
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  program:
    | "core"
    | "plus"
    | "vip"
    | "not_sure";
  startDate: string;
  cycleWeeks: number;
  startingWeightKg?: number;
  goalWeightKg?: number;
  currentWeightKg?: number;
  checkIns: {
    _id: string;
    date: string;
    weightKg?: number;
    notes?: string;
  }[];
  mealPlanNotes?: string;
  mealChecklist?: {
    _id: string;
    text: string;
    period?: string;
  }[];
  mealTimetableMode?:
    | "weekly"
    | "full_cycle";
  mealTimetable?: {
    dayNumber: number;
    items: {
      _id: string;
      text: string;
      period?: string;
    }[];
    exercises?: {
      _id: string;
      text: string;
      reps?: string;
      duration?: string;
    }[];
  }[];
  status: string;
  accountStage?: PortalStage;
  programStartedAt?: string;
  programEndsAt?: string;
  onboarding?: {
    loggedWeight?: boolean;
    tickedMeal?: boolean;
    bookedCall?: boolean;
    joinedGroup?: boolean;
  };
  week3Review?: {
    completed?: boolean;
    outcome?: string;
  };
  portalAccess?: PortalAccess;
};

type AuthResponse = {
  success: boolean;
  token: string;
  client: ClientProfile;
};

type MeResponse = {
  success: boolean;
  client: ClientProfile;
};

type ClientAuthContextType = {
  client: ClientProfile | null;
  loading: boolean;
  error: string;
  login: (
    email: string,
    password: string
  ) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    phone: string,
    password: string,
    referralCode?: string
  ) => Promise<void>;
  activate: (
    email: string,
    phone: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const ClientAuthContext =
  createContext<ClientAuthContextType | null>(
    null
  );

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001/api";

type ApiError = Error & {
  code?: string;
  status?: number;
};

async function clientRequest<T>(
  endpoint: string,
  options: RequestInit & {
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "khairo_client_token"
        )
      : null;

  const headers =
    new Headers(
      options.headers || {}
    );

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const {
    timeoutMs,
    ...requestOptions
  } = options;

  const controller =
    timeoutMs &&
    timeoutMs > 0
      ? new AbortController()
      : null;

  const timeoutId =
    controller
      ? window.setTimeout(
          () =>
            controller.abort(),
          timeoutMs
        )
      : null;

  let response: Response;

  try {
    response =
      await fetch(
        `${API}${endpoint}`,
        {
          ...requestOptions,
          headers,
          credentials: "include",
          cache: "no-store",
          signal:
            controller?.signal ||
            requestOptions.signal,
        }
      );
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(
        timeoutId
      );
    }
  }

  let data: {
    message?: string;
    code?: string;
  } = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error =
      new Error(
        data.message ||
          "Something went wrong."
      ) as ApiError;

    error.code = data.code;
    error.status =
      response.status;

    throw error;
  }

  return data as T;
}

export function ClientAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    client,
    setClient,
  ] =
    useState<ClientProfile | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const refresh =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          "khairo_client_token"
        );

      if (!token) {
        setClient(null);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await clientRequest<MeResponse>(
            "/client-auth/me",
            {
              timeoutMs: 10000,
            }
          );

        setClient(
          response.client
        );
      } catch (err) {
        const apiError =
          err as ApiError;

        if (
          apiError.status === 401
        ) {
          localStorage.removeItem(
            "khairo_client_token"
          );

          setClient(null);
          setError("");
        } else {
          setClient(null);

          setError(
            "Khairo Diet Clinic could not verify your session because the server is temporarily unavailable."
          );
        }
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const expired = () => {
      localStorage.removeItem(
        "khairo_client_token"
      );

      setClient(null);
      setError("");
      setLoading(false);
    };

    const changed = () => {
      void refresh();
    };

    window.addEventListener(
      "client-auth:expired",
      expired
    );

    window.addEventListener(
      "client-auth:changed",
      changed
    );

    return () => {
      window.removeEventListener(
        "client-auth:expired",
        expired
      );

      window.removeEventListener(
        "client-auth:changed",
        changed
      );
    };
  }, [refresh]);

  const establishSession = (
    response: AuthResponse
  ) => {
    localStorage.setItem(
      "khairo_client_token",
      response.token
    );

    setClient(
      response.client
    );

    setError("");
    setLoading(false);

    window.dispatchEvent(
      new Event(
        "client-auth:changed"
      )
    );
  };

  const login = async (
    email: string,
    password: string
  ) => {
    const response =
      await clientRequest<AuthResponse>(
        "/client-auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    establishSession(
      response
    );
  };

  const register = async (
    fullName: string,
    email: string,
    phone: string,
    password: string,
    referralCode?: string
  ) => {
    const response =
      await clientRequest<AuthResponse>(
        "/client-auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
            referralCode,
          }),
        }
      );

    establishSession(
      response
    );
  };

  const activate = async (
    email: string,
    phone: string,
    password: string
  ) => {
    const response =
      await clientRequest<AuthResponse>(
        "/client-auth/activate",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            phone,
            password,
          }),
        }
      );

    establishSession(
      response
    );
  };

  const logout = async () => {
    try {
      await clientRequest(
        "/client-auth/logout",
        {
          method: "POST",
        }
      );
    } catch {
    }

    localStorage.removeItem(
      "khairo_client_token"
    );

    setClient(null);
    setError("");
    setLoading(false);

    window.dispatchEvent(
      new Event(
        "client-auth:changed"
      )
    );
  };

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        loading,
        error,
        login,
        register,
        activate,
        logout,
        refresh,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context =
    useContext(
      ClientAuthContext
    );

  if (!context) {
    throw new Error(
      "useClientAuth must be used within ClientAuthProvider"
    );
  }

  return context;
}
