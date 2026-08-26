"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import { api } from "../../../lib/api";

type Payment = {
  _id: string;
  receiptNumber: string;
  amount: number;
  purpose: string;
  status: "pending" | "success" | "failed" | "abandoned";
  paidAt?: string;
  createdAt: string;
  client: { _id: string; fullName: string; email: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-500/10 text-green-400",
  pending: "bg-amber-500/10 text-amber-400",
  failed: "bg-red-500/10 text-red-400",
  abandoned: "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]",
};

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDunning, setShowDunning] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const fetchPayments = useCallback(async (q = "", silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await api.get<{ payments: Payment[] }>(`/reports/payments?${params.toString()}`);
      setPayments(res.payments);
    } catch (err) {
      setPayments([]);
      setError(err instanceof Error ? err.message : "Could not load payments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
    const t = setInterval(() => fetchPayments(search, true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") fetchPayments(search, true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchPayments, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPayments(search), 350);
    return () => clearTimeout(timeout);
  }, [search, fetchPayments]);

  const totalCollected = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0);
  const awaitingPayments = payments.filter((p) => p.status === "pending" && p.client);
  const daysWaiting = (p: Payment) => Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);

  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    if (loading) return ["Reading the billing ledger…"];
    const items: string[] = [];

    if (search) {
      items.push("you are searching for [" + search + "] — " + payments.length + " payment" + (payments.length === 1 ? "" : "s") + " match");
      if (payments.length === 0) items.push("nothing matches that search — try a shorter name or clear the search box");
      return items;
    }

    if (statusFilter) {
      items.push("you are viewing only " + statusFilter + " payments — " + payments.length + " payment" + (payments.length === 1 ? "" : "s") + " here");
    }

    if (payments.length === 0) {
      items.push("no payments recorded yet — the first one is always the hardest, then revenue starts flowing");
      return items;
    }

    const successful = payments.filter((p) => p.status === "success");
    const failed = payments.filter((p) => p.status === "failed");
    const pending = payments.filter((p) => p.status === "pending");
    const abandoned = payments.filter((p) => p.status === "abandoned");

    const totalSuccess = successful.reduce((sum, p) => sum + p.amount, 0);
    const totalFailed = failed.reduce((sum, p) => sum + p.amount, 0);
    const totalAbandoned = abandoned.reduce((sum, p) => sum + p.amount, 0);

    if (successful.length > 0) {
      items.push(
        "total collected: ₦" + totalSuccess.toLocaleString() + " across " + successful.length + " successful payment" +
        (successful.length === 1 ? "" : "s")
      );
    } else {
      items.push("no payments collected yet — the first successful payment unlocks momentum");
    }

    if (failed.length > 0) {
      const failedWithClients = failed.filter((p) => p.client);
      if (failedWithClients.length > 0) {
        items.push(
          failedWithClients.length + " payment attempt" + (failedWithClients.length === 1 ? "" : "s") + " failed — ₦" +
          totalFailed.toLocaleString() + " still on the table: " +
          nameList(failedWithClients.sort((a, b) => b.amount - a.amount).map((p) => p.client!.fullName + " (₦" + p.amount.toLocaleString() + ")")) +
          " — failed payers already showed intent, resending the link today usually recovers it"
        );
      }
    }

    if (pending.length > 0) {
      const oldest = pending.reduce((a, b) => (daysWaiting(a) > daysWaiting(b) ? a : b));
      items.push(
        pending.length + " payment" + (pending.length === 1 ? "" : "s") + " waiting for follow-up: " +
        nameList(pending.filter((p) => p.client).map((p) => p.client!.fullName)) +
        " — oldest is " + (oldest.client ? oldest.client.fullName : "Unknown") + " (" + daysWaiting(oldest) + " day" +
        (daysWaiting(oldest) === 1 ? "" : "s") + " ago)"
      );
    }

    if (abandoned.length > 0) {
      items.push(
        abandoned.length + " payment" + (abandoned.length === 1 ? "" : "s") + " abandoned before completion — ₦" +
        totalAbandoned.toLocaleString() + " left on the table"
      );
    }

    if (successful.length > 0) {
      const newest = successful.reduce((a, b) => (new Date(a.paidAt || a.createdAt).getTime() > new Date(b.paidAt || b.createdAt).getTime() ? a : b));
      items.push(
        "newest payment: " + (newest.client ? newest.client.fullName : "Unknown") + " paid ₦" +
        newest.amount.toLocaleString() + " on " + new Date(newest.paidAt || newest.createdAt).toLocaleDateString()
      );
    }

    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-medium text-white">Billing</h1>
            {statusFilter && (
              <button
                onClick={() => router.push("/dashboard/billing")}
                className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#0d9488]/10 px-3 py-1 text-xs capitalize text-[#0d9488]"
              >
                {statusFilter} 
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">All subscription payments, newest first.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowDunning(!showDunning)} className={`rounded-full px-4 py-2 text-xs font-medium ${showDunning ? "bg-amber-500 text-black" : "border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"}`}>
            {showDunning ? "Showing dunning" : "Awaiting payment"} {awaitingPayments.length > 0 && `(${awaitingPayments.length})`}
          </button>
          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm">
            <span className="text-[var(--theme-text-secondary)]">Total collected: </span>
            <span className="font-mono text-white">₦{totalCollected.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5">
        <Search size={16} className="text-[var(--theme-text-secondary)]" />
        <input
          placeholder="Search by client name, email, or receipt number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
        />
      </div>

      {showDunning && (
        <div className="mt-6 rounded-sm border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-medium text-white"> Daily dunning list</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Links sent but not yet paid. Oldest first. Reach out and close them.</p>
          <div className="mt-4 space-y-2">
            {awaitingPayments.length === 0 ? (
              <p className="text-sm text-[var(--theme-text-secondary)]">All caught up — no payments waiting.</p>
            ) : (
              awaitingPayments.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)).map((p) => (
                <div key={p._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3">
                  <div>
                    <button onClick={() => router.push(`/dashboard/clients/${p.client!._id}`)} className="text-sm font-medium text-white hover:text-[#0d9488] hover:underline">{p.client!.fullName}</button>
                    <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">{p.client!.email} · ₦{p.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${daysWaiting(p) >= 3 ? "bg-red-500/10 text-red-400" : daysWaiting(p) >= 1 ? "bg-amber-500/10 text-amber-400" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"}`}>
                      {daysWaiting(p)}d waiting
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center text-sm text-red-400">
            Could not load payments — {error}.
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">No payments found.</div>
        ) : (
          payments.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => p.client && router.push(`/dashboard/clients/${p.client._id}`)}
              className={`w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left ${p.client ? "transition-colors hover:bg-[var(--theme-surface-hover)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{p.client?.fullName || "Unknown client"}</p>
                  <p className="mt-1 truncate text-xs text-[var(--theme-text-secondary)]">{p.client?.email || p.receiptNumber || "No receipt"}</p>
                </div>
                <span className="shrink-0 font-mono text-sm text-white">₦{p.amount.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-2">
                <span className={`rounded-full px-2 py-1 text-[11px] capitalize ${STATUS_STYLES[p.status] || "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"}`}>
                  {p.status}
                </span>
                <span className="text-[11px] capitalize text-[var(--theme-text-secondary)]">
                  {p.purpose.replace("_", " ")} · {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                </span>
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
              <th className="px-4 py-3 font-medium">Purpose</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-red-400">Could not load payments — {error}. Check your connection or refresh.</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">No payments found.</td></tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => p.client && router.push(`/dashboard/clients/${p.client._id}`)}
                  className={`border-b border-[var(--theme-border)] last:border-0 ${p.client ? "cursor-pointer hover:bg-[var(--theme-surface-hover)]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-white">{p.client?.fullName || "Unknown client"}</div>
                    <div className="text-xs text-[var(--theme-text-secondary)]">{p.client?.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--theme-text-secondary)]">{p.purpose.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-mono text-[var(--theme-text-secondary)]">₦{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[p.status] || "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                    {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--theme-text-secondary)]">{p.receiptNumber}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
