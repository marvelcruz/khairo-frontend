import Link from "next/link";
import {
  Boxes,
  Package,
  Repeat2,
  Warehouse,
} from "lucide-react";

import { ProductsServicesHeader } from "@/components/products-services/ProductsServicesHeader";

const cards = [
  {
    title: "Catalogue",
    description: "Master list of sellable and configurable offerings.",
    href: "/dashboard/catalogue",
    icon: Boxes,
  },
  {
    title: "Products",
    description: "Physical and inventory-backed items.",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Subscriptions",
    description: "Customer recurring relationships to offerings.",
    href: "/dashboard/subscriptions",
    icon: Repeat2,
  },
  {
    title: "Inventory",
    description: "Stock levels, SKUs and replenishment.",
    href: "/dashboard/inventory",
    icon: Warehouse,
  },
];

export default function ProductsServicesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <ProductsServicesHeader
        title="Products & Services"
        description="A unified workspace for the things KhairoDietClinic sells, delivers, bundles and tracks. Catalogue and Subscriptions are live; Inventory now reflects the existing Supplements stock system while general catalogue-product inventory remains staged."
        badge="Mixed status"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 transition hover:border-teal-500/60"
            >
              <Icon className="h-5 w-5 text-teal-500" />

              <h2 className="mt-5 font-semibold text-white">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-5 text-[var(--theme-text-muted)]">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
        <h2 className="font-semibold text-white">
          Framework architecture
        </h2>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Products",
            "Services",
            "Packages",
            "Programs & Memberships",
            "Add-ons",
            "Subscriptions",
            "Inventory",
          ].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text-secondary)]"
            >
              {item}
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs leading-5 text-[var(--theme-text-muted)]">
          Orders remain a separate operational module. Subscriptions are customer relationships to catalogue offerings, not catalogue item types.
        </p>
      </div>
    </main>
  );
}
