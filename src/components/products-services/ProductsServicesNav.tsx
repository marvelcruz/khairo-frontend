"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Overview", "/dashboard/products-services"],
  ["Catalogue", "/dashboard/catalogue"],
  ["Products", "/dashboard/products"],
  ["Services", "/dashboard/services"],
  ["Packages", "/dashboard/packages"],
  ["Programs & Memberships", "/dashboard/programs-memberships"],
  ["Add-ons", "/dashboard/add-ons"],
  ["Subscriptions", "/dashboard/subscriptions"],
  ["Inventory", "/dashboard/inventory"],
] as const;

export function ProductsServicesNav() {
  const pathname = usePathname();

  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <nav className="flex min-w-max gap-2 px-1">
        {links.map(([label, href]) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-emerald-600 bg-emerald-500 text-white"
                  : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-secondary)] hover:border-neutral-700 hover:text-white",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
