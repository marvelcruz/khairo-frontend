"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

import {
  APP_ERROR_EVENT,
  type AppErrorDetail,
} from "@/lib/appErrors";

type Notice = AppErrorDetail & {
  id: number;
};

type AppErrorContextValue = {
  notify: (detail: AppErrorDetail) => void;
};

const AppErrorContext = createContext<AppErrorContextValue | null>(null);

const SESSION_NOTICE: AppErrorDetail = {
  kind: "session",
  title: "Session expired",
  message: "Please sign in again to continue.",
};

const UNEXPECTED_NOTICE: AppErrorDetail = {
  kind: "unexpected",
  title: "Something went wrong",
  message: "An unexpected error occurred. Please try that action again.",
};

export function AppErrorProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);
  const lastFingerprint = useRef<{ value: string; at: number } | null>(null);

  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((detail: AppErrorDetail) => {
    const fingerprint = `${detail.kind}:${detail.status || ""}:${detail.code || ""}:${detail.title}:${detail.message}`;
    const now = Date.now();

    if (
      lastFingerprint.current?.value === fingerprint &&
      now - lastFingerprint.current.at < 2500
    ) {
      return;
    }

    lastFingerprint.current = { value: fingerprint, at: now };

    const id = nextId.current++;
    const notice: Notice = { ...detail, id };

    setNotices((current) => [...current.slice(-2), notice]);

    window.setTimeout(() => dismiss(id), detail.kind === "session" ? 7000 : 6000);
  }, [dismiss]);

  useEffect(() => {
    const handleAppError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorDetail>;
      if (customEvent.detail) notify(customEvent.detail);
    };

    const handleExpired = () => notify(SESSION_NOTICE);
    const handleWindowError = () => notify(UNEXPECTED_NOTICE);
    const handleUnhandledRejection = () => notify(UNEXPECTED_NOTICE);

    window.addEventListener(APP_ERROR_EVENT, handleAppError);
    window.addEventListener("staff-auth:expired", handleExpired);
    window.addEventListener("client-auth:expired", handleExpired);
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(APP_ERROR_EVENT, handleAppError);
      window.removeEventListener("staff-auth:expired", handleExpired);
      window.removeEventListener("client-auth:expired", handleExpired);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [notify]);

  return (
    <AppErrorContext.Provider value={{ notify }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[380px]"
      >
        {notices.map((notice) => (
          <div
            key={notice.id}
            role="alert"
            className="pointer-events-auto w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--theme-text)]">
                  {notice.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-[var(--theme-text-secondary)]">
                  {notice.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(notice.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppErrorContext.Provider>
  );
}

export function useAppError() {
  const context = useContext(AppErrorContext);
  if (!context) {
    throw new Error("useAppError must be used within AppErrorProvider");
  }
  return context;
}
