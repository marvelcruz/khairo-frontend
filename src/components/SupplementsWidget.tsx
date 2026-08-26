"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Package, ClipboardCheck } from "lucide-react";

type WidgetSupplement = {
  _id: string;
  name: string;
  stock: number;
  price: number;
  unit: string;
  reorderThreshold: number;
};

type WidgetStocktake = {
  _id?: string;
  createdAt: string;
  items?: Array<{ discrepancy?: number }>;
};
export default function SupplementsWidget() {
  const [supplements, setSupplements] = useState<WidgetSupplement[]>([]);
  const [stocktakes, setStocktakes] = useState<WidgetStocktake[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get<{ supplements?: WidgetSupplement[] }>("/supplements"),
      api.get<{ stocktakes?: WidgetStocktake[] }>("/supplements/stocktakes"),
    ]).then(([s, st]) => {
      if (s.status === "fulfilled") setSupplements(s.value.supplements || []);
      if (st.status === "fulfilled") setStocktakes(st.value.stocktakes || []);
      setLoaded(true);
    });
  }, []);

  if (!loaded || supplements.length === 0) return null;

  const low = supplements.filter((s) => s.stock <= s.reorderThreshold);
  const last = stocktakes[0];
  const days = last ? Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 86400000) : null;
  const overdue = !last || (days !== null && days >= 3);
  const stockValue = supplements.reduce((sum, s) => sum + s.stock * s.price, 0);

  return (
    <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Package size={16} className="text-[#0d9488]" />
          <p className="font-medium text-white">Supplements</p>
        </div>
        <Link href="/dashboard/supplements" className="text-xs text-[#0d9488] hover:underline">Manage →</Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-white">{supplements.reduce((n, s) => n + s.stock, 0)}</p>
          <p className="text-xs text-[var(--theme-text-secondary)]">units in stock</p>
        </div>
        <div>
          <p className="text-xl font-bold text-white">₦{stockValue.toLocaleString()}</p>
          <p className="text-xs text-[var(--theme-text-secondary)]">stock value</p>
        </div>
        <div>
          <p className={`text-xl font-bold ${low.length ? "text-red-400" : "text-green-400"}`}>{low.length}</p>
          <p className="text-xs text-[var(--theme-text-secondary)]">low stock</p>
        </div>
      </div>

      {low.length > 0 && (
        <div className="mt-3 rounded-sm border border-red-500/30 bg-red-500/5 p-2">
          {low.slice(0, 3).map((s) => (
            <p key={s._id} className="text-xs text-red-400"> {s.name}: {s.stock} {s.unit} left (reorder at {s.reorderThreshold})</p>
          ))}
        </div>
      )}

      {overdue && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-sm border border-amber-500/30 bg-amber-500/5 p-2">
          <ClipboardCheck size={12} className="text-amber-400" />
          <p className="text-xs text-amber-400">{last ? `Inventory check overdue — ${days} day${days === 1 ? "" : "s"} since last count` : "No inventory check yet — run your first physical count"}</p>
        </div>
      )}
    </div>
  );
}
