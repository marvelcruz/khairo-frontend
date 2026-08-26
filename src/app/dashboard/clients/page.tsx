"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Download, Upload } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { PageTicker } from "../../../components/PageTicker";

type Client = {
  _id: string;
  clientId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  status: string;
  isArchived?: boolean;
  program?: string;
  startDate?: string;
  portalActive?: boolean;
};

type ClientsResponse = {
  clients?: Client[];
  data?: Client[];
};


const getTrafficLight = (client: Client, flaggedIds: Set<string>): { color: string; label: string } => {
  if (flaggedIds.has(client._id)) return { color: "bg-red-500", label: "Needs attention - missed logs, weight trend, or low adherence" };
  if (client.status === "active") return { color: "bg-green-500", label: "Active & on track" };
  if (client.status === "paused") return { color: "bg-yellow-500", label: "Program paused" };
  if (client.status === "completed") return { color: "bg-gray-500", label: "Program completed" };
  if (client.status === "cancelled") return { color: "bg-gray-500", label: "Program cancelled" };
  return { color: "bg-gray-500", label: "Inactive" };
};

const getStatusBadgeClass = (status?: string) => {
  if (status === "active") return "bg-green-500/10 text-green-400";
  if (status === "paused") return "bg-yellow-500/10 text-yellow-400";
  if (status === "completed") return "bg-blue-500/10 text-blue-400";
  if (status === "cancelled") return "bg-red-500/10 text-red-400";
  return "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]";
};

export default function ClientsPage() {
  const { hasRole: hasAuthRole } = useAuth();
  const doctorRosterOnly =
    hasAuthRole("doctor") && !hasAuthRole("admin");

  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const archivedView = searchParams.get("archived") === "true";
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
    const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const { hasPermission } = useAuth();
  const canSeeContact = hasPermission("view_contact_info");

  const classify = (c: Client) => {
    if (c.isArchived) return "archived";
    if (flaggedIds.has(c._id)) return "red";
    if (c.status === "active") return "green";
    if (c.status === "paused") return "yellow";
    return "gray";
  };

  const nameList = (list: Client[]) =>
    list.length <= 3 ? list.map((c) => c.fullName).join(", ")
    : list.slice(0, 3).map((c) => c.fullName).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    if (loading) return ["Reading your roster…"];
    const items: string[] = [];

    if (archivedView) {
      items.push("you are viewing the archived clients right now — " + clients.length + " client" + (clients.length === 1 ? "" : "s") + " hidden from the active roster");
      if (clients.length === 0) items.push("no archived clients in the system");
      return items;
    }

    const red = clients.filter((c) => classify(c) === "red");
    const green = clients.filter((c) => classify(c) === "green");
    const yellow = clients.filter((c) => classify(c) === "yellow");
    const gray = clients.filter((c) => classify(c) === "gray");

    if (search) {
      items.push("you are searching for [" + search + "] — " + clients.length + " match" + (clients.length === 1 ? "" : "es") + " on the roster");
      if (clients.length === 0) items.push("nothing matches that search — try a shorter name or clear the search box");
      return items;
    }

    items.push(
      "your active roster holds " + clients.length + " client" + (clients.length === 1 ? "" : "s") +
      (green.length > 0 ? " — " + green.length + " active and on track" : "") +
      (red.length > 0 ? " — " + red.length + " need attention" : "") +
      (yellow.length > 0 ? " — " + yellow.length + " paused" : "") +
      (gray.length > 0 ? " — " + gray.length + " completed, cancelled or otherwise inactive" : "")
    );

    if (red.length === 0) {
      items.push("nobody needs urgent attention right now — all routines look on track");
    } else {
      items.push(
        red.length + " client" + (red.length === 1 ? "" : "s") + " need" + (red.length === 1 ? "s" : "") + " a check-in: " + nameList(red) +
        " — a short WhatsApp message or 2-min call usually brings them back"
      );
    }

    if (yellow.length > 0) {
      items.push(
        yellow.length + " client" + (yellow.length === 1 ? "" : "s") + " currently paused: " + nameList(yellow) +
        " — these clients remain reconciled but are not currently active"
      );
    }

    if (gray.length > 0) {
      items.push(
        gray.length + " client" + (gray.length === 1 ? "" : "s") + " completed, cancelled or otherwise inactive: " + nameList(gray)
      );
    }

    if (green.length === clients.length && clients.length > 0) {
      items.push("every active client is on track — the roster is healthy right now");
    }

    return items;
  })();

  const exportCSV = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/clients/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("khairo_staff_token")}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `khairo-clients-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { alert("Could not export CSV."); }
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/clients/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("khairo_staff_token")}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert(`Imported: ${data.created} created, ${data.skipped} skipped${data.errors.length ? ". Errors: " + data.errors.join(", ") : ""}`);
        fetchClients();
      } else alert(data.message || "Import failed");
    } catch { alert("Could not import CSV."); }
    finally { setImporting(false); }
  };

  const [error, setError] = useState<string | null>(null);
  const fetchClients = useCallback(async (q = "", silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (statusFilter) params.set("status", statusFilter);
      if (archivedView) params.set("archived", "true");
      params.set("limit", "25");
      if (!doctorRosterOnly) {
        params.set("reconciled", "true");
      }
      const res = await api.get<ClientsResponse | Client[]>(`/clients?${params.toString()}`);
      const list = Array.isArray(res) ? res : res.clients || res.data || [];
      setClients(list);
    } catch (err) {
      setClients([]);
      setError(err instanceof Error ? err.message : "Could not load clients");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, archivedView, doctorRosterOnly]);

  useEffect(() => {
    fetchClients();
    const refreshFlags = () =>
      api
        .get<{ results: { client: { _id: string } }[] }>("/clients/queue/needs-attention")
        .then((res) => setFlaggedIds(new Set(res.results.map((r) => r.client._id))))
        .catch(() => {});
    refreshFlags();
    const t = setInterval(() => { fetchClients(search, true); refreshFlags(); }, 45000);
    const onVis = () => { if (document.visibilityState === "visible") { fetchClients(search, true); refreshFlags(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchClients, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchClients(search), 350);
    return () => clearTimeout(timeout);
  }, [search, fetchClients]);

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-white">{doctorRosterOnly ? "My Clients" : "Clients"}</h1>
          {statusFilter && (
            <button
              onClick={() => router.push("/dashboard/clients")}
              className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-full bg-[#0d9488]/10 px-3 py-1 text-xs capitalize text-[#0d9488] sm:min-h-0"
            >
              {statusFilter} 
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCSV} className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)] sm:min-h-0"><Download size={14} /> Export CSV</button>
          <label className={`flex min-h-10 flex-wrap cursor-pointer items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)] sm:min-h-0 ${importing ? "opacity-50" : ""}`}>
            <Upload size={14} /> {importing ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={importCSV} disabled={importing} className="hidden" />
          </label>
          <button
            onClick={() => router.push(archivedView ? "/dashboard/clients" : "/dashboard/clients?archived=true")}
            className={`min-h-10 rounded-full border px-4 py-2 text-xs font-medium sm:min-h-0 ${archivedView ? "border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488]" : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-secondary)] hover:text-white"}`}
          >
            {archivedView ? "Viewing archived — show active" : "Show archived"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-xs">
        <span className="text-[var(--theme-text-secondary)]">Status dot:</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="h-2 w-2 rounded-full bg-red-500" /> Needs attention (missed logs, weight trend, or low adherence)</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="h-2 w-2 rounded-full bg-green-500" /> Active & on track</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Paused program</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[var(--theme-text-secondary)]"><span className="h-2 w-2 rounded-full bg-gray-500" /> Completed / cancelled</span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-0 sm:py-2.5">
        <Search size={16} className="text-[var(--theme-text-secondary)]" />
        <input
          placeholder={canSeeContact ? "Search by name, phone, or email" : "Search by name"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)] sm:min-h-0"
        />
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-center text-sm text-red-400">
            Could not load clients — {error}.
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">No clients found.</div>
        ) : (
          clients.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => router.push(`/dashboard/clients/${c._id}`)}
              className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.isArchived ? "bg-gray-600" : getTrafficLight(c, flaggedIds).color}`} />
                    <span className="truncate">{c.fullName || `${c.firstName} ${c.lastName}`}</span>
                  </div>
                  {canSeeContact && <p className="mt-1 truncate text-xs text-[var(--theme-text-secondary)]">{c.email || c.phone || "No contact details"}</p>}
                </div>
                {c.isArchived ? (
                  <span className="shrink-0 rounded-full bg-[var(--theme-surface-soft)] px-2 py-1 text-[11px] text-[var(--theme-text-secondary)]">Archived</span>
                ) : (
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] capitalize ${getStatusBadgeClass(c.status)}`}>
                    {c.status || "active"}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-2 text-xs">
                <span className="text-[var(--theme-text-secondary)]">Program</span>
                <span className="capitalize text-[var(--theme-text-secondary)]">{c.program || "—"}</span>
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
              {canSeeContact && <th className="px-4 py-3 font-medium">Phone</th>}
              <th className="px-4 py-3 font-medium">Program</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-red-400">Could not load clients — {error}. Check your connection or refresh.</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">No clients found.</td></tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => router.push(`/dashboard/clients/${c._id}`)}
                  className="cursor-pointer border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-surface-hover)] transition-colors"
                >
                  <td className="px-4 py-3">
                     <div className="flex flex-wrap items-center gap-2 text-white"><span className={`h-2.5 w-2.5 rounded-full ${c.isArchived ? "bg-gray-600" : getTrafficLight(c, flaggedIds).color}`} title={getTrafficLight(c, flaggedIds).label}></span>{c.fullName || `${c.firstName} ${c.lastName}`}</div>
                     {canSeeContact && <div className="text-xs text-[var(--theme-text-secondary)]">{c.email}</div>}
                  </td>
                  {canSeeContact && <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{c.phone}</td>}
                  <td className="px-4 py-3 capitalize text-[var(--theme-text-secondary)]">{c.program || "—"}</td>
                  <td className="px-4 py-3">
                    {c.isArchived ? (
                      <span className="rounded-full bg-[var(--theme-surface-soft)] px-2.5 py-1 text-xs text-[var(--theme-text-secondary)]">Archived</span>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${getStatusBadgeClass(c.status)}`}>
                        {c.status || "active"}
                      </span>
                    )}
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
