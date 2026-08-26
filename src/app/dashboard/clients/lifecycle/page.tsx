"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MailPlus,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Square,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type ClientStatus = "active" | "paused" | "completed" | "cancelled";
type Client = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  program?: string;
  status: ClientStatus;
  isArchived?: boolean;
};
type ClientsResponse = { clients?: Client[]; data?: Client[] };

const STATUS_TONE: Record<ClientStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-300",
  paused: "bg-amber-500/10 text-amber-300",
  completed: "bg-slate-500/10 text-slate-300",
  cancelled: "bg-rose-500/10 text-rose-300",
};

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Could not update client lifecycle.";
}

export default function ClientLifecyclePage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "coach");
  const canSendRenewal = hasRole("admin");
  const [clients, setClients] = useState<Client[]>([]);
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
      const response = await api.get<ClientsResponse | Client[]>(
        "/clients?limit=200&reconciled=true"
      );
      const list = Array.isArray(response)
        ? response
        : response.clients || response.data || [];
      setClients(list.filter((client) => !client.isArchived));
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
    const list = [...clients].sort((a, b) => a.fullName.localeCompare(b.fullName));
    if (!term) return list;
    return list.filter((client) =>
      [client.fullName, client.email, client.phone, client.program, client.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [clients, search]);

  const counts = useMemo(
    () => ({
      active: clients.filter((client) => client.status === "active").length,
      paused: clients.filter((client) => client.status === "paused").length,
      completed: clients.filter((client) => client.status === "completed").length,
      cancelled: clients.filter((client) => client.status === "cancelled").length,
    }),
    [clients]
  );

  async function changeStatus(client: Client, status: ClientStatus) {
    if (!canManage || busyId) return;

    let reason = "";
    if (status === "cancelled") {
      reason = window.prompt("Cancellation reason (required)", "")?.trim() || "";
      if (!reason) return;
    } else {
      reason = window.prompt("Optional reason or note", "")?.trim() || "";
    }

    const label = status === "active" ? "resume" : status;
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} ${client.fullName}?`)) {
      return;
    }

    setBusyId(client._id);
    setNotice("");
    setError("");
    try {
      await api.patch(`/clients/${client._id}/lifecycle`, { status, reason });
      setNotice(`${client.fullName} is now ${status}.`);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  async function sendRenewalLink(client: Client) {
    if (!canSendRenewal || busyId) return;

    if (!client.email) {
      setError(`${client.fullName} needs an email address before a renewal link can be sent.`);
      return;
    }

    if (
      !window.confirm(
        `Email a renewal/reactivation payment link to ${client.fullName} at ${client.email}?\n\nTheir client status will remain ${client.status} until payment is verified.`
      )
    ) {
      return;
    }

    setBusyId(client._id);
    setNotice("");
    setError("");

    try {
      await api.post(`/clients/${client._id}/email-payment-link`, {});
      setNotice(
        `Renewal link sent to ${client.fullName}. Reactivation will happen automatically only after verified payment.`
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0d9488]">Client operations</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">Client Lifecycle</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            Pause, resume, complete, cancel, or safely reactivate clients without deleting their history.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={refreshing} onClick={() => void load(true)}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </Button>
      </header>

      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3 text-xs leading-5 text-[var(--theme-text-muted)]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
          <ShieldCheck size={13} /> Payment-gated reactivation
        </span>{" "}
        Completed and cancelled clients are never reactivated by a status edit. Their new journey starts only after a renewal payment is verified.
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
            <p className="text-xs capitalize text-[var(--theme-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">{value}</p>
          </div>
        ))}
      </div>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">{error}</div>}

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search client, programme, or status"
          className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading clients…</div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">No clients found.</div>
        ) : (
          <div className="divide-y divide-[var(--theme-border-soft)]">
            {visible.map((client) => {
              const busy = busyId === client._id;
              const terminal = client.status === "completed" || client.status === "cancelled";
              return (
                <article key={client._id} className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--theme-text)]">{client.fullName}</p>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
                      {client.program ? client.program.toUpperCase() : "Programme not set"} · {client.email || client.phone || "No contact detail"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_TONE[client.status]}`}>
                      {client.status}
                    </span>

                    {canManage && client.status === "active" && (
                      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void changeStatus(client, "paused")}>
                        <Pause size={13} /> Pause
                      </Button>
                    )}
                    {canManage && client.status === "paused" && (
                      <Button type="button" size="sm" disabled={busy} onClick={() => void changeStatus(client, "active")}>
                        <Play size={13} /> Resume
                      </Button>
                    )}
                    {canManage && !terminal && (
                      <>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void changeStatus(client, "completed")}>
                          <CheckCircle2 size={13} /> Complete
                        </Button>
                        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void changeStatus(client, "cancelled")}>
                          <XCircle size={13} /> Cancel
                        </Button>
                      </>
                    )}
                    {terminal && canSendRenewal && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy || !client.email}
                        onClick={() => void sendRenewalLink(client)}
                        title={!client.email ? "Add a client email first" : "Send renewal/reactivation payment link"}
                      >
                        <MailPlus size={13} /> Send reactivation link
                      </Button>
                    )}
                    {terminal && !canSendRenewal && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)]">
                        <Square size={11} /> Admin sends the payment-gated reactivation link.
                      </span>
                    )}
                    {!canManage && !terminal && (
                      <span className="text-xs text-[var(--theme-text-muted)]">Lifecycle changes are restricted to admin/coach.</span>
                    )}
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
