"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type WebsiteContentValues = Record<string, unknown>;

const WebsiteContentContext =
  createContext<WebsiteContentValues>({});

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export function WebsiteContentProvider({
  pageKey,
  children,
}: {
  pageKey: string;
  children: React.ReactNode;
}) {
  const [values, setValues] =
    useState<WebsiteContentValues>({});

  useEffect(() => {
    let active = true;

    fetch(
      `${API_BASE_URL}/public/website/content/${encodeURIComponent(pageKey)}`
    )
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then((data) => {
        if (active && data?.values) {
          setValues(data.values);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [pageKey]);

  return (
    <WebsiteContentContext.Provider value={values}>
      {children}
    </WebsiteContentContext.Provider>
  );
}

export function useWebsiteContent() {
  return useContext(WebsiteContentContext);
}

export function cmsText(
  values: WebsiteContentValues,
  key: string,
  fallback: string
): string {
  const value = values[key];

  return typeof value === "string" && value.length
    ? value
    : fallback;
}

export function cmsNumber(
  values: WebsiteContentValues,
  key: string,
  fallback: number
): number {
  const value = Number(values[key]);

  return Number.isFinite(value) ? value : fallback;
}
