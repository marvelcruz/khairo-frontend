"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "@/lib/api";

export type WebsiteContentValues = Record<string, unknown>;

type WebsiteContentResponse = {
  values?: WebsiteContentValues;
};

const WebsiteContentContext =
  createContext<WebsiteContentValues>({});

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

    api.get<WebsiteContentResponse>(
      `/public/website/content/${encodeURIComponent(pageKey)}`,
      {
        suppressGlobalError: true,
        suppressAuthExpired: true,
      }
    )
      .then((data) => {
        if (active && data?.values) {
          setValues(data.values);
        }
      })
      .catch(() => {
        // Marketing content has static fallbacks, so an unavailable CMS does
        // not need to interrupt the visitor experience.
      });

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
