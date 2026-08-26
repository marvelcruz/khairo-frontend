"use client";

import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  CreditCard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import ConnectionsHub from "@/components/connections/ConnectionsHub";

type SetupLink = {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
};

const SETUP_LINKS: SetupLink[] = [
  {
    href: "/dashboard/accounts",
    title: "Staff Access",
    description: "Add Khairo Diet Clinic team members and choose Staff or Doctor access.",
    icon: Users,
  },
  {
    href: "/dashboard/products-services",
    title: "Products & Services",
    description: "Manage what Khairo Diet Clinic sells, including services, packages and memberships.",
    icon: Boxes,
  },
  {
    href: "/dashboard/billing",
    title: "Payments",
    description: "Review payments and billing activity that needs attention.",
    icon: CreditCard,
  },
  {
    href: "/dashboard/business-configuration",
    title: "Khairo Diet Clinic Settings",
    description: "Manage Khairo Diet Clinic contact details and operating settings.",
    icon: Settings,
  },
  {
    href: "/dashboard/launch-readiness",
    title: "System Check",
    description: "Check that the important Khairo Diet Clinic systems are ready and healthy.",
    icon: ShieldCheck,
  },
];

export default function SetupPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-7">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
          <CheckCircle2 size={14} />
          Khairo Diet Clinic
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Setup</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--theme-text-secondary)]">
          Manage the Khairo Diet Clinic accounts and settings your team uses. Nothing here requires technical setup from staff.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 sm:p-6">
        <ConnectionsHub
          title="Khairo Diet Clinic Connections"
          description="Connect Khairo Diet Clinic’s Gmail and social accounts. Click Connect, sign in normally, and approve access."
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Other setup</h2>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Choose what you want to manage.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETUP_LINKS.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 transition hover:bg-[var(--theme-surface-hover)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
                <Icon size={18} />
              </span>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--theme-text-secondary)]">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
