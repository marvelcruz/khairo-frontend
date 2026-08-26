"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";
import { ChevronRight } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";

type Order = {
  _id: string;
  program?: string;
  offering?: { _id?: string; name?: string; type?: string; sku?: string } | null;
  lineItems?: Array<{ name?: string; quantity?: number; unitPrice?: number; currency?: string }>;
  totalAmount?: number;
  currency?: string;
  fulfillmentRequired?: boolean;
  currentStage: string;
  meterColor: "red" | "yellow" | "green";
  client: { _id: string; fullName: string; email: string; phone: string } | null;
  createdAt: string;
};

const STAGE_LABELS: Record<string, string> = {
  created: "Order Created",
  prepared: "Prepared",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  confirmed: "Confirmed",
};

const METER_STYLES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-green-500",
};

const STAGE_FILTERS = ["created", "prepared", "packed", "shipped", "delivered", "confirmed"];

function orderLabel(order: Order) {
  return (
    order.lineItems?.[0]?.name ||
    order.offering?.name ||
    order.program ||
    "Subscription"
  );
}

function orderProgress(order: Order) {
  if (order.currentStage === "confirmed" || order.currentStage === "delivered") return 100;
  if (order.currentStage === "shipped") return 80;
  if (order.currentStage === "packed") return 60;
  if (order.currentStage === "prepared") return 40;
  return 10;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageFilter = searchParams.get("stage") || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const query = stageFilter ? `?stage=${stageFilter}` : "";
      const res = await api.get<{ orders: Order[] }>(`/orders${query}`);
      setOrders(res.orders);
      setError(null);
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(() => fetchOrders(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") fetchOrders(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchOrders]);

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const stageAdvice: Record<string, string> = {
    created: "still needs to be prepared",
    prepared: "packing is next",
    packed: "ready to ship",
    shipped: "on the way",
    confirmed: "no physical fulfillment required",
  };

  const tickerItems = (() => {
    if (loading) return ["Reading the order line…"];
    const items: string[] = [];
    if (stageFilter) {
      items.push("you are looking at the " + (STAGE_LABELS[stageFilter] || stageFilter) + " stage only — " + orders.length + " order" + (orders.length === 1 ? "" : "s") + " here");
    }
    if (orders.length === 0) {
      items.push(stageFilter ? "nothing sitting at this stage right now" : "the order line is empty — new subscription orders appear here after activation");
      return items;
    }
    const moving = orders.filter((o) => !["delivered", "confirmed"].includes(o.currentStage));
    const complete = orders.filter((o) => ["delivered", "confirmed"].includes(o.currentStage));
    if (!stageFilter) {
      items.push("the order line holds " + orders.length + " order" + (orders.length === 1 ? "" : "s") + " — " + moving.length + " still moving, " + complete.length + " complete or confirmed");
    }
    moving.slice(0, 3).forEach((o) => {
      const nm = o.client ? o.client.fullName : "Unknown client";
      items.push(nm + " (" + orderLabel(o) + ") is at " + (STAGE_LABELS[o.currentStage] || o.currentStage) + " after " + daysSince(o.createdAt) + " day" + (daysSince(o.createdAt) === 1 ? "" : "s") + " — " + (stageAdvice[o.currentStage] || "keep it moving"));
    });
    if (moving.length > 3) items.push("…and " + (moving.length - 3) + " more still in the pipeline");
    const stuck = moving.filter((o) => daysSince(o.createdAt) >= 3);
    if (stuck.length > 0) {
      items.push(stuck.length + " order" + (stuck.length === 1 ? " has" : "s have") + " been in the pipeline 3+ days: " + stuck.slice(0, 3).map((o) => (o.client ? o.client.fullName : "Unknown")).join(", "));
    }
    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Orders</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Every activated subscription has its own linked order. Physical fulfillment is tracked here when required.</p>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1 sm:mt-5 sm:w-fit sm:rounded-full">
        <button
          onClick={() => router.push("/dashboard/orders")}
          className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-medium sm:min-h-0 ${!stageFilter ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)] hover:text-white"}`}
        >
          All
        </button>
        {STAGE_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => router.push(`/dashboard/orders?stage=${s}`)}
            className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-medium sm:min-h-0 ${stageFilter === s ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)] hover:text-white"}`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center text-sm text-red-400">Could not load orders — {error}.</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">No orders yet.</div>
        ) : (
          orders.map((o) => (
            <button
              key={o._id}
              type="button"
              onClick={() => o.client && router.push(`/dashboard/orders/${o._id}`)}
              className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{o.client?.fullName || "Unknown client"}</p>
                  <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">{orderLabel(o)} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[var(--theme-text-secondary)]">{STAGE_LABELS[o.currentStage] || o.currentStage}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                <div className={`h-full rounded-full ${METER_STYLES[o.meterColor]}`} style={{ width: `${orderProgress(o)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)]">
                <span>{daysSince(o.createdAt)}d since order</span>
                <span className="inline-flex items-center gap-1">Open <ChevronRight size={12} /></span>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-red-400">Could not load orders — {error}. Check your connection or refresh.</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o._id}
                  onClick={() => o.client && router.push(`/dashboard/orders/${o._id}`)}
                  className="cursor-pointer border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-surface-hover)]"
                >
                  <td className="px-4 py-3">
                    <div className="text-white">{o.client?.fullName || "Unknown client"}</div>
                    <div className="text-xs text-[var(--theme-text-secondary)]">{o.client?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{orderLabel(o)}</td>
                  <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{STAGE_LABELS[o.currentStage] || o.currentStage}</td>
                  <td className="px-4 py-3">
                    <div className="w-56">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                        <div className={`h-full rounded-full ${METER_STYLES[o.meterColor]} transition-all duration-500`} style={{ width: `${orderProgress(o)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (o.client) router.push(`/dashboard/orders/${o._id}`); }}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--theme-border)] bg-black/40 px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:border-[#0d9488]/40 hover:text-white sm:min-h-0"
                    >
                      Open <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}