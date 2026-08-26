"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard/workflows", label: "Workflows" },
  { href: "/dashboard/workflows/tag-automation", label: "Tag automation" },
];

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav
        aria-label="Workflow sections"
        className="mx-auto mb-4 flex max-w-7xl flex-wrap items-center gap-2 border-b border-[var(--theme-border)] px-4 pb-3 pt-2 sm:px-6 lg:px-8"
      >
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard/workflows"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-[#0d9488]/10 text-[#0d9488]"
                  : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-text)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
