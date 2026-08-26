"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Mail, RefreshCw, Search, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type Payment = {
  _id: string;
  receiptNumber?: string;
  amount: number;
  currency?: string;
  purpose: string;
  status: "pending" | "success" | "failed" | "abandoned";
  paidAt?: string;
  createdAt: string;
};

type PaymentPendingItem = {
  opportunityId: string;
  contactId: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  program: string;
  assignedTo?: { _id: string; name: string; roles?: string[] } | null;
  stageEnteredAt?: string;
  payment?: Payment | null;
  readyForPayment: boolean;
};

type QueueResponse = {
  success: boolean;
  count: number;
  items: PaymentPendingItem[];
};

const statusClass: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300",
  success: "bg-emerald-500/10 text-emerald-300",
  failed: "bg-red-500/10 text-red-300",
  abandoned: "bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)]",
};

function humanize(value?: string) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(amount?: number, currency = "NGN") {
  if (amount === undefined || amount === null) return "Not generated";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₦${Number(amount).toLocaleString()}`;
  }
}

function daysWaiting(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Could not complete payment action.";
}

export default function PaymentPendingPage() {
  const { hasRole } = useAuth();
  const canSendPayment = hasRole("admin", "sales");
  const canRecordManual = hasRole("admin");

  const [items, setItems] = useState<PaymentPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get<QueueResponse>("/crm/payment-pending");
      setItems(response.items || []);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.fullName, item.email, item.phone, item.program]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [items, search]);

  const counts = useMemo(() => ({
    total: items.length,
    noLink: items.filter((item) => !item.payment).length,
    awaiting: items.filter((item) => item.payment?.status === "pending").length,
    problem: items.filter((item) => ["failed", "abandoned"].includes(item.payment?.status || "")).length,
  }), [items]);

  async function sendLink(item: PaymentPendingItem) {
    if (!item.clientId) return;
    setBusyId(item.clientId);
    setNotice("");
    setError("");
    try {
      await api.post(`/clients/${item.clientId}/email-payment-link`, {});
      setNotice(`Payment link emailed to ${item.fullName}.`);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  async function copyLink(item: PaymentPendingItem) {
    if (!item.clientId) return;
    setBusyId(item.clientId);
    setNotice("");
    setError("");
    try {
      const response = await api.post<{ authorizationUrl: string }>(`/clients/${item.clientId}/payment-link`, {});
      await navigator.clipboard.writeText(response.authorizationUrl);
      setNotice(`Payment link copied for ${item.fullName}.`);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  async function recordManual(item: PaymentPendingItem) {
    if (!item.clientId) return;
    const method = window.prompt("Payment method: cash, bank_transfer, or other", "bank_transfer");
    if (!method) return;
    if (!["cash", "bank_transfer", "other"].includes(method)) {
      setError("Choose cash, bank_transfer, or other.");
      return;
    }
    const note = window.prompt("Optional payment note", "") || "";
    if (!window.confirm(`Confirm manual payment and activate ${item.fullName}?`)) return;

    setBusyId(item.clientId);
    setNotice("");
    setError("");
    try {
      await api.post(`/clients/${item.clientId}/manual-activate`, { method, note });
      setNotice(`${item.fullName} was activated from the recorded manual payment.`);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0d9488]">Revenue handoff</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">Payment Pending</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">Medical-cleared prospects waiting to complete program payment.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={refreshing} onClick={() => void load(true)}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["In queue", counts.total],
          ["Link not sent", counts.noLink],
          ["Awaiting payment", counts.awaiting],
          ["Needs attention", counts.problem],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
            <p className="text-xs text-[var(--theme-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">{value}</p>
          </div>
        ))}
      </div>

      {notice && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, phone, or program"
          className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="hidden border-b border-[var(--theme-border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)] lg:grid lg:grid-cols-[minmax(0,2fr)_120px_150px_130px_minmax(260px,auto)] lg:gap-4">
          <span>Client</span><span>Program</span><span>Payment</span><span>Waiting</span><span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading payment queue…</div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <CheckCircle2 size={24} className="mx-auto text-emerald-300" />
              <p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">Nothing waiting for payment</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-border-soft)]">
            {visible.map((item) => {
              const paymentStatus = item.payment?.status || "not_sent";
              const busy = busyId === item.clientId;
              return (
                <article key={item.opportunityId} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_120px_150px_130px_minmax(260px,auto)] lg:items-center lg:gap-4 lg:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--theme-text)]">{item.fullName}</p>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">{item.email || item.phone || "Contact details incomplete"}</p>
                    {item.assignedTo?.name && <p className="mt-1 text-[11px] text-[var(--theme-text-muted)]">Owner: {item.assignedTo.name}</p>}
                  </div>
                  <div className="text-xs font-medium text-[var(--theme-text-secondary)]">{humanize(item.program)}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[paymentStatus] || "bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)]"}`}>
                      {paymentStatus === "not_sent" ? "Link not sent" : humanize(paymentStatus)}
                    </span>
                    <p className="mt-1 text-[11px] text-[var(--theme-text-muted)]">{formatMoney(item.payment?.amount, item.payment?.currency)}</p>
                  </div>
                  <div className="text-xs text-[var(--theme-text-secondary)]">{daysWaiting(item.stageEnteredAt)} day{daysWaiting(item.stageEnteredAt) === 1 ? "" : "s"}</div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {canSendPayment && item.readyForPayment && item.payment?.status !== "success" && (
                      <>
                        <Button type="button" size="sm" disabled={busy} onClick={() => void sendLink(item)}>
                          <Mail size={14} /> {item.payment ? "Resend link" : "Send link"}
                        </Button>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void copyLink(item)}>
                          <Copy size={14} /> Copy link
                        </Button>
                      </>
                    )}
                    {canRecordManual && item.clientId && item.payment?.status !== "success" && (
                      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void recordManual(item)}>
                        <WalletCards size={14} /> Manual payment
                      </Button>
                    )}
                    {!canSendPayment && <span className="text-xs text-[var(--theme-text-muted)]">Payment actions are restricted to sales/admin.</span>}
                    {!item.readyForPayment && <span className="text-xs text-amber-300">Client payment record needs attention.</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
