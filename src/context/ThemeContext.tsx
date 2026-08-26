"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type KhairoDietClinicTheme =
  | "light"
  | "dark";

type ThemeContextValue = {
  theme: KhairoDietClinicTheme;
  setTheme: (
    theme: KhairoDietClinicTheme
  ) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY =
  "khairo-theme";

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

function appliedTheme():
  KhairoDietClinicTheme {
  if (
    typeof document ===
    "undefined"
  ) {
    return "dark";
  }

  return document
    .documentElement
    .dataset.theme ===
    "light"
    ? "light"
    : "dark";
}

function applyTheme(
  theme: KhairoDietClinicTheme
) {
  const root =
    document.documentElement;

  root.dataset.theme =
    theme;

  root.style.colorScheme =
    theme;

  const meta =
    document.querySelector<HTMLMetaElement>(
      'meta[name="khairo-theme-color"]'
    );

  if (meta) {
    meta.content =
      theme === "light"
        ? "#f7f7f8"
        : "#0a0a0b";
  }
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    theme,
    setThemeState,
  ] =
    useState<KhairoDietClinicTheme>(
      "dark"
    );

  useEffect(() => {
    setThemeState(
      appliedTheme()
    );

    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleSystemChange =
      () => {
        if (
          localStorage.getItem(
            STORAGE_KEY
          )
        ) {
          return;
        }

        const next =
          media.matches
            ? "dark"
            : "light";

        applyTheme(next);
        setThemeState(next);
      };

    media.addEventListener(
      "change",
      handleSystemChange
    );

    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        STORAGE_KEY
      ) {
        return;
      }

      const next =
        event.newValue ===
        "light"
          ? "light"
          : event.newValue ===
              "dark"
            ? "dark"
            : window.matchMedia(
                  "(prefers-color-scheme: dark)"
                ).matches
              ? "dark"
              : "light";

      applyTheme(next);
      setThemeState(next);
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      media.removeEventListener(
        "change",
        handleSystemChange
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const setTheme =
    useCallback(
      (
        next:
          KhairoDietClinicTheme
      ) => {
        localStorage.setItem(
          STORAGE_KEY,
          next
        );

        applyTheme(next);
        setThemeState(next);
      },
      []
    );

  const toggleTheme =
    useCallback(() => {
      const current =
        appliedTheme();

      setTheme(
        current === "dark"
          ? "light"
          : "dark"
      );
    }, [setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }

  return context;
}
