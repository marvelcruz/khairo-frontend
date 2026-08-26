"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import CrmWorkspaceHome from "@/components/crm/CrmWorkspaceHome";

const CRM_NAV = [
  { href: "/dashboard/crm", label: "CRM" },
  { href: "/dashboard/crm/qualification", label: "Qualification Review" },
  { href: "/dashboard/crm/consultations", label: "Consultations" },
  { href: "/dashboard/crm/medical-review", label: "Medical Review" },
  { href: "/dashboard/crm/payment-pending", label: "Payment Pending" },
];

export default function CrmLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forceClosed, setForceClosed] = useState(false);

  const contactId = pathname === "/dashboard/crm" ? searchParams.get("contact") : null;
  const showAdvancedCrm = pathname === "/dashboard/crm" && searchParams.get("advanced") === "1";
  const showWorkspaceHome = pathname === "/dashboard/crm" && !showAdvancedCrm;
  const showContactOverlay = showWorkspaceHome && Boolean(contactId) && !forceClosed;

  useEffect(() => {
    setForceClosed(false);
  }, [contactId]);

  const closeContact = useCallback(() => {
    setForceClosed(true);

    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", "/dashboard/crm");
    }

    router.replace("/dashboard/crm", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!showContactOverlay) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeContact();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button[aria-label="Close contact"]')) return;

      event.preventDefault();
      event.stopPropagation();
      closeContact();
    };

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [closeContact, showContactOverlay]);

  return (
    <div>
      <nav
        aria-label="CRM sections"
        data-crm-nav-version="payment-pending-v1"
        className="mb-4 flex flex-wrap items-center gap-2 border-b border-[var(--theme-border)] pb-3"
      >
        {CRM_NAV.map((item) => {
          const active =
            item.href === "/dashboard/crm"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

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

      {showWorkspaceHome && (
        <div className="crm-primary-workspace">
          <CrmWorkspaceHome />
          <style jsx global>{`
            .crm-primary-workspace > div > section:first-of-type {
              display: none !important;
            }
          `}</style>
        </div>
      )}

      {showContactOverlay && (
        <div className="crm-contact-overlay-host">
          {children}
          <style jsx global>{`
            .crm-contact-overlay-host > [data-testid="crm-root"] {
              margin: 0 !important;
              max-width: none !important;
              padding: 0 !important;
            }

            .crm-contact-overlay-host > [data-testid="crm-root"] > :not(.fixed) {
              display: none !important;
            }
          `}</style>
        </div>
      )}

      {!showWorkspaceHome && children}
    </div>
  );
}
