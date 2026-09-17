"use client";

import { useEffect } from "react";

import { dispatchAppError } from "@/lib/appErrors";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    dispatchAppError({
      kind: "unexpected",
      title: "This page hit an error",
      message: "KhairoDietClinic couldn’t finish loading this page.",
      source: error.digest ? `route:${error.digest}` : "route",
    });
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center bg-[var(--theme-page)] px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center shadow-xl">
        <p className="text-base font-semibold text-[var(--theme-text-primary)]">
          We couldn’t load this page
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--theme-text-secondary)]">
          Your data has not been intentionally changed. Try loading this section again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
