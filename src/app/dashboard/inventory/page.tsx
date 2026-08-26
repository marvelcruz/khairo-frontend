"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  ProductsServicesHeader,
} from "@/components/products-services/ProductsServicesHeader";

import { api } from "@/lib/api";

type Supplement = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  costPerUnit: number;
  stock: number;
  reorderThreshold: number;
  unit: string;
};

type Stocktake = {
  _id: string;
  createdAt?: string;
  items?: Array<{
    supplement?: string;
    name?: string;
    expected?: number;
    counted?: number;
    discrepancy?: number;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dateLabel(value?: string) {
  if (!value) return "No stocktake yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No stocktake yet";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stockStatus(item: Supplement) {
  if (item.stock === 0) return "Out of stock";
  if (item.stock <= item.reorderThreshold) return "Low stock";
  return "In stock";
}

export default function InventoryPage() {
  const [supplements, setSupplements] =
    useState<Supplement[]>([]);

  const [stocktakes, setStocktakes] =
    useState<Stocktake[]>([]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [supplementResponse, stocktakeResponse] =
        await Promise.all([
          api.get<{ supplements?: Supplement[] }>(
            "/supplements"
          ),
          api.get<{ stocktakes?: Stocktake[] }>(
            "/supplements/stocktakes"
          ),
        ]);

      setSupplements(
        supplementResponse.supplements || []
      );

      setStocktakes(
        stocktakeResponse.stocktakes || []
      );
    } catch (err) {
      setSupplements([]);
      setStocktakes([]);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load inventory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return supplements;

    return supplements.filter((item) =>
      [
        item.name,
        item.description || "",
        item.unit,
        stockStatus(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [supplements, query]);

  const totalUnits = supplements.reduce(
    (sum, item) => sum + item.stock,
    0
  );

  const lowStock = supplements.filter(
    (item) => item.stock <= item.reorderThreshold
  );

  const saleValue = supplements.reduce(
    (sum, item) =>
      sum + item.stock * item.price,
    0
  );

  const lastStocktake = stocktakes[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <ProductsServicesHeader
        title="Inventory"
        description="Live operational stock from the existing KhairoDietClinic Supplements inventory system."
        badge="Connected"
      />

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-200">
        Supplements is the current stock authority. Stock adjustments and physical counts remain in the existing Supplements workflow so KhairoDietClinic maintains one inventory balance and one audit trail.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
            <Boxes className="h-4 w-4" />
            Units in stock
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {totalUnits}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
            <AlertTriangle className="h-4 w-4" />
            Low / out of stock
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {lowStock.length}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="text-xs text-[var(--theme-text-muted)]">
            Stock value at sale price
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {money(saleValue)}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
            <ClipboardCheck className="h-4 w-4" />
            Last inventory check
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {dateLabel(lastStocktake?.createdAt)}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 sm:flex-row">
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
          <Search className="h-4 w-4 text-[var(--theme-text-muted)]" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search inventory"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] px-4 text-sm text-[var(--theme-text-secondary)] hover:bg-neutral-900"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        <Link
          href="/dashboard/supplements"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-pink-400"
        >
          Manage stock
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          Loading inventory…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          No inventory items match the current search.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => {
              const status = stockStatus(item);

              return (
                <article
                  key={item._id}
                  className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-white">
                        {item.name}
                      </div>

                      <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        Supplements inventory
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${
                        status === "In stock"
                          ? "border-emerald-500/20 text-emerald-300"
                          : "border-red-500/20 text-red-300"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--theme-border)] pt-3 text-sm">
                    <div>
                      <div className="text-xs text-[var(--theme-text-muted)]">
                        Stock
                      </div>
                      <div className="mt-1 text-[var(--theme-text)]">
                        {item.stock} {item.unit}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--theme-text-muted)]">
                        Reorder at
                      </div>
                      <div className="mt-1 text-[var(--theme-text)]">
                        {item.reorderThreshold}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--theme-text-muted)]">
                        Sale price
                      </div>
                      <div className="mt-1 text-[var(--theme-text)]">
                        {money(item.price)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--theme-text-muted)]">
                        Stock value
                      </div>
                      <div className="mt-1 text-[var(--theme-text)]">
                        {money(item.stock * item.price)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--theme-border)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--theme-surface)] text-xs uppercase tracking-wide text-[var(--theme-text-muted)]">
                <tr>
                  <th className="px-4 py-3">
                    Item
                  </th>
                  <th className="px-4 py-3">
                    Stock
                  </th>
                  <th className="px-4 py-3">
                    Reorder at
                  </th>
                  <th className="px-4 py-3">
                    Sale price
                  </th>
                  <th className="px-4 py-3">
                    Stock value
                  </th>
                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800">
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        Supplements inventory
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                      {item.stock} {item.unit}
                    </td>

                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                      {item.reorderThreshold}
                    </td>

                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                      {money(item.price)}
                    </td>

                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                      {money(item.stock * item.price)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          stockStatus(item) ===
                          "In stock"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {stockStatus(item)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-xs leading-5 text-[var(--theme-text-muted)]">
        General CatalogueItem inventory fields remain reserved for future non-supplement product inventory. They are intentionally not being used as a second stock ledger.
      </div>
    </main>
  );
}
