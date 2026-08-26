"use client";

import { useEffect, useState } from "react";

export function PageTicker({ items }: { items: string[] }) {
  const messages = items.filter(Boolean);
  const messageKey = messages.join("\u0000");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [messageKey]);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [messages.length, messageKey]);

  if (messages.length === 0) return null;

  const safeIndex = index % messages.length;

  return (
    <div
      className="mb-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2.5 shadow-[var(--theme-shadow)] sm:mb-6 sm:px-4 sm:py-3"
      aria-label="Today's dashboard brief"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="mt-0.5 shrink-0 rounded-full bg-[#0d9488]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          Today
        </span>

        <p className="min-w-0 flex-1 text-sm leading-5 text-[var(--theme-text-secondary)]">
          {messages[safeIndex]}
        </p>

        {messages.length > 1 && (
          <span className="shrink-0 pt-1 text-[11px] tabular-nums text-[var(--theme-text-muted)]">
            {safeIndex + 1}/{messages.length}
          </span>
        )}
      </div>
    </div>
  );
}
