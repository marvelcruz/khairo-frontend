"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../../lib/api";

type Subscription = {
  _id: string;
  client?: {
    fullName?: string;
    email?: string;
    phone?: string;
    status?: string;
  } | null;
  program?: string;
  offering?: { name?: string } | null;
  amount?: number;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  gracePeriodEnd?: string;
  gracePeriodNotifiedAt?: string;
};

type Response = {
  success: boolean;
  subscriptions: Subscription[];
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function lifecycleStage(sub: Subscription): string {
  if (sub.status === "active" && sub.currentPeriodEnd) {
    const daysLeft = Math.ceil(
      (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000
    );
    if (daysLeft <= 7 && daysLeft > 0) return "Approaching Expiry";
    if (daysLeft <= 0) return "Grace Period";
    return "Active";
  }
  if (sub.status === "grace_period") return "Grace Period";
  if (sub.status === "expired") return "Expired";
  if (sub.status === "paused") return "Paused";
  if (sub.status === "cancelled") return "Cancelled";
  if (sub.status === "pending") return "Pending";
  return label(sub.status);
}

export default function SubscriptionLifecyclePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<Response>("/subscriptions", {
        params: { status: "all", limit: 200 },
      });
      setSubscriptions(response.subscriptions || []);
    } catch (err) {
      setSubscriptions([]);
      setError(err instanceof Error ? err.message : "Could not load subscription lifecycle.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return subscriptions;
    return subscriptions.filter((sub) =>
      [
        sub.client?.fullName || "",
        sub.client?.email || "",
        sub.program || "",
        sub.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [subscriptions, query]);

  const counts = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter((sub) => sub.status === "active").length;
    const approaching = subscriptions.filter((sub) => {
      if (sub.status !== "active" || !sub.currentPeriodEnd) return false;
      const daysLeft = Math.ceil(
        (new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000
      );
      return daysLeft <= 7 && daysLeft > 0;
    }).length;
    const grace = subscriptions.filter((sub) => sub.status === "grace_period").length;
    const expired = subscriptions.filter((sub) => sub.status === "expired").length;
    const paused = subscriptions.filter((sub) => sub.status === "paused").length;
    const cancelled = subscriptions.filter((sub) => sub.status === "cancelled").length;
    return { total, active, approaching, grace, expired, paused, cancelled };
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Subscription Lifecycle</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          See every active, approaching, grace, expired, paused, or cancelled subscription in one place.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-white">{counts.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{counts.active}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Approaching expiry</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{counts.approaching}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Grace</p>
          <p className="mt-1 text-2xl font-semibold text-orange-300">{counts.grace}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Expired</p>
          <p className="mt-1 text-2xl font-semibold text-red-300">{counts.expired}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4">
          <p className="text-xs text-zinc-500">Paused</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-300">{counts.paused}</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client, email, program, or status"
          className="h-10 w-full rounded-lg border border-white/10 bg-[var(--theme-input)] pl-9 pr-3 text-sm text-white outline-none focus:border-[#0d9488]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--theme-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.08em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Lifecycle stage</th>
              <th className="px-4 py-3">Period end</th>
              <th className="px-4 py-3">Grace end</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Loading...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">No subscriptions found.</td></tr>
            ) : visible.map((sub) => (
              <tr key={sub._id} className="text-zinc-400 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{sub.client?.fullName || "Unknown"}</p>
                  <p className="text-xs text-zinc-600">{sub.client?.email || ""}</p>
                </td>
                <td className="px-4 py-3">{label(sub.program || "Program")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    sub.status === "active"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : sub.status === "grace_period"
                        ? "bg-orange-500/10 text-orange-300"
                        : sub.status === "expired"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-zinc-700 text-zinc-300"
                  }`}>
                    {lifecycleStage(sub)}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(sub.currentPeriodEnd)}</td>
                <td className="px-4 py-3">{formatDate(sub.gracePeriodEnd)}</td>
                <td className="px-4 py-3">₦{Number(sub.amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
