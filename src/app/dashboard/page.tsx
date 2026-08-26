"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardCheck, Package, Clock, Inbox, Phone, MessageCircle, Pencil, Target, CalendarClock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PipelineFunnel from "./PipelineFunnel";
import { api } from "../../lib/api";
import SupplementsWidget from "../../components/SupplementsWidget";
import { PageTicker } from "../../components/PageTicker";

type FlaggedClient = {
  client: { _id: string; fullName: string; email: string; phone: string; program: string };
  flags: { type: string; detail: string }[];
};

type ReviewClient = { _id: string; fullName: string; email: string; phone: string; program: string };

type ExpiringSub = {
  _id: string;
  currentPeriodEnd: string;
  amount: number;
  client: { _id: string; fullName: string; email: string; phone: string } | null;
};

type Order = {
  _id: string;
  currentStage: string;
  meterColor: "red" | "yellow" | "green";
  client: { _id: string; fullName: string; email: string; phone: string } | null;
  createdAt: string;
};

type FollowUpQueueItem = {
  id: string;
  name: string;
  days: number;
  activated: boolean;
  status: string;
  waLink: string;
};

type HygieneIssue = {
  name: string;
  problem: string;
  email?: string;
  phone?: string;
};

type FollowUpQueueResponse = {
  success: boolean;
  queue: FollowUpQueueItem[];
};

type HygieneResponse = {
  success: boolean;
  issues: HygieneIssue[];
};

type DashboardSession = {
  _id: string;
  startsAt: string;
  status: string;
  sessionType?: string;
  isTeam?: boolean;
  title?: string;
  zoomLink?: string;
  client?: { fullName: string } | null;
  staff?: { _id: string; name?: string } | null;
};

type DashboardUser = {
  _id?: string;
  name?: string;
  role?: string;
  roles?: string[];
};

type CrmDashboardOverview = {
  openCount: number;
  overdueFollowUps: number;
  unassigned: number;
};

const STAGE_LABELS: Record<string, string> = {
  created: "Order Created",
  prepared: "Prepared",
  packed: "Packed",
  shipped: "Shipped",
};

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  if (digits.startsWith("234")) return digits;
  return digits;
}

export default function DashboardOverview() {
  const router = useRouter();
  const { user, hasRole, hasPermission } = useAuth();
  const isAdmin = hasRole("admin");
  const isStaff = hasRole("staff");
  const canSeeRequests = hasPermission("view_requests");
  const canSeeCrm = hasPermission("view_crm");
  const canSeeBilling = hasPermission("view_billing");
  const canSeeContact = hasPermission("view_contact_info");
  // Admin/staff see whole org; everyone else is locked to their own scope
  const forceMineOnly = !isAdmin && !isStaff;
  const currentUser = user as DashboardUser | null;
  const [pendingApplications, setPendingApplications] = useState<number | null>(null);
  const [crmOverview, setCrmOverview] = useState<CrmDashboardOverview | null>(null);
  const [queue, setQueue] = useState<FollowUpQueueItem[]>([]);
  const [hygiene, setHygiene] = useState<HygieneIssue[]>([]);
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<FlaggedClient[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewClient[]>([]);
  const [expiringThisWeek, setExpiringThisWeek] = useState<ExpiringSub[]>([]);
  const [outstandingOrders, setOutstandingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [goal, setGoal] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [mineOnly, setMineOnly] = useState(!isAdmin && !isStaff);
  const [todaySessions, setTodaySessions] = useState<DashboardSession[]>([]);

  const fetchAll = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    const mineParam = (mineOnly || forceMineOnly) ? "?mine=true" : "";
    const results = await Promise.allSettled([
      api.get<{ total: number }>("/applications?status=pending&limit=1"),
      api.get<{ total: number }>("/clients?status=active&reconciled=true&limit=1"),
      api.get<{ results: FlaggedClient[] }>(`/clients/queue/needs-attention${mineParam}`),
      api.get<{ clients: ReviewClient[] }>(`/clients/queue/review${mineParam}`),
      api.get<{ expiringThisWeek: ExpiringSub[]; currentMonthRevenue: number }>("/reports/revenue"),
      api.get<{ orders: Order[] }>(`/orders${(mineOnly || forceMineOnly) ? "?mine=true" : ""}`),
      api.get<{ target: number }>("/reports/goal"),
      api.get<{ sessions: DashboardSession[] }>("/sessions"),
      canSeeCrm
        ? api.get<CrmDashboardOverview>("/crm/overview")
        : Promise.resolve({ openCount: 0, overdueFollowUps: 0, unassigned: 0 }),
    ]);

    const [apps, clients, attention, review, revenue, orders, goalRes, sessionsRes, crmRes] = results;

    setPendingApplications(apps.status === "fulfilled" ? apps.value.total : 0);
    setCrmOverview(crmRes.status === "fulfilled" ? crmRes.value : { openCount: 0, overdueFollowUps: 0, unassigned: 0 });
    setActiveClients(clients.status === "fulfilled" ? clients.value.total : 0);
    setFlagged(attention.status === "fulfilled" ? attention.value.results : []);
    setReviewQueue(review.status === "fulfilled" ? review.value.clients : []);
    setExpiringThisWeek(revenue.status === "fulfilled" ? revenue.value.expiringThisWeek : []);
    setCurrentRevenue(revenue.status === "fulfilled" ? revenue.value.currentMonthRevenue || 0 : 0);
    setGoal(goalRes.status === "fulfilled" ? goalRes.value.target || 0 : 0);
    setOutstandingOrders(
      orders.status === "fulfilled" ? orders.value.orders.filter((o) => o.currentStage !== "delivered") : []
    );

    const allSessions = sessionsRes.status === "fulfilled" ? sessionsRes.value.sessions || [] : [];
    const nowD = new Date();
    const todays = allSessions.filter((s) => new Date(s.startsAt).toDateString() === nowD.toDateString() && s.status !== "declined" && s.status !== "cancelled");
    const myId = currentUser?._id;
    const myRoles = currentUser?.roles || [];
    const mine = todays.filter((s) => s.isTeam || s.staff?._id === myId || (s.status === "pending" && myRoles.some((r) => r === "coach" || r === "doctor")));
    setTodaySessions(mineOnly ? mine : todays);

    setLoading(false);
  }, [mineOnly, forceMineOnly, currentUser, canSeeCrm]);

  
  const loadQueue = async () => {
    try {
      const res = await api.get<FollowUpQueueResponse>("/follow-up/queue");
      if (res.success) setQueue(res.queue || []);
    } catch (err) { console.error("Queue fetch failed:", err); }
  };
  const loadHygiene = async () => {
    try {
      const res = await api.get<HygieneResponse>("/follow-up/hygiene");
      if (res.success) setHygiene(res.issues || []);
    } catch (err) { console.error("Hygiene fetch failed:", err); }
  };
  const voidClient = async (id: string) => {
    if (!confirm("Archive this client? They will be hidden but not deleted.")) return;
    try {
      await api.post(`/follow-up/void/${id}`);
      setQueue(queue.filter((q) => q.id !== id));
      alert(" Archived");
    } catch { alert(" Could not archive"); }
  };
  useEffect(() => {
    fetchAll();
    const t = setInterval(() => fetchAll(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") fetchAll(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchAll]);

  const saveGoal = async () => {
    const t = Number(goalInput);
    if (!t || t <= 0) return;
    setGoalSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("khairo_staff_token") : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/reports/goal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target: t }),
      });
      const data = await res.json().catch(() => ({}));
      console.log("RAW GOAL RESPONSE:", res.status, data);
      if (!res.ok) throw new Error(`Status ${res.status}: ${data.message || JSON.stringify(data)}`);
      setGoal(t);
      setEditingGoal(false);
    } catch (err) {
      alert("Could not save goal: " + (err instanceof Error ? err.message : "is the backend running?"));
    } finally {
      setGoalSaving(false);
    }
  };

  const totalTasksToday =
    flagged.length +
    reviewQueue.length +
    (canSeeCrm ? crmOverview?.overdueFollowUps || 0 : 0) +
    (canSeeBilling ? expiringThisWeek.length : 0) +
    (canSeeBilling ? outstandingOrders.length : 0) +
    todaySessions.length;

  const flagReason = (type: string) =>
    type.includes("missed") ? "they have been missing their daily logs"
    : type.includes("weight") ? "their weight is trending the wrong way"
    : (type.includes("workout") || type.includes("adherence")) ? "their workout adherence is dropping"
    : "they need a quick check-in";

  const nameList = (list: string[]) => list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    if (loading) return ["Reading your dashboard…"];
    const items: string[] = [];
    const hour = new Date().getHours();
    const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const first = (currentUser?.name || "there").split(" ")[0];
    items.push("Good " + part + ", " + first + " — here is what is happening right now");

    items.push(todaySessions.length === 0
      ? "your calendar is free today — no sessions booked, a good day for client check-ins"
      : "you have " + todaySessions.length + " session" + (todaySessions.length === 1 ? "" : "s") + " today; the next one starts at " + new Date(todaySessions[0].startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

    items.push(flagged.length === 0
      ? "no clients are slipping right now — every routine looks on track"
      : flagged.length + " client" + (flagged.length === 1 ? "" : "s") + " need" + (flagged.length === 1 ? "s" : "") + " a nudge: " + nameList(flagged.map((x) => x.client.fullName)) + " — " + flagReason((flagged[0].flags[0] || {}).type || "") + ", and a short encouraging message usually brings them back");

    items.push(reviewQueue.length === 0
      ? "everyone has been reviewed recently — no check-ins are overdue"
      : nameList(reviewQueue.map((c) => c.fullName)) + (reviewQueue.length === 1 ? " is" : " are") + " due for a check-in review this week");

    if (canSeeCrm) {
      items.push((crmOverview?.overdueFollowUps || 0) > 0
        ? (crmOverview?.overdueFollowUps || 0) + " CRM follow-up" + ((crmOverview?.overdueFollowUps || 0) === 1 ? " is" : "s are") + " overdue — clear these before leads go cold"
        : (crmOverview?.openCount || 0) > 0
          ? (crmOverview?.openCount || 0) + " open lead" + ((crmOverview?.openCount || 0) === 1 ? " is" : "s are") + " moving through the CRM with no overdue follow-ups"
          : "the CRM has no open leads right now");
    }

    if (canSeeRequests) {
      items.push((pendingApplications ?? 0) > 0
        ? pendingApplications + " new application" + (pendingApplications === 1 ? " is" : "s are") + " waiting for a first reply"
        : "no new applications waiting — the pipeline is quiet");
    }

    if (isAdmin) {
      items.push("you are looking after " + (activeClients ?? 0) + " active client" + ((activeClients ?? 0) === 1 ? "" : "s") + ", with " + totalTasksToday + " small task" + (totalTasksToday === 1 ? "" : "s") + " to clear today");
    }

    if (canSeeBilling) {
      if (goal > 0) {
        const pct = Math.min(100, Math.round((currentRevenue / goal) * 100));
        items.push(pct >= 100
          ? "this month's revenue goal is already hit — great month!"
          : "you have collected ₦" + currentRevenue.toLocaleString() + " of the ₦" + goal.toLocaleString() + " monthly goal (" + pct + "%) — " + (pct >= 50 ? "you are past halfway, keep pushing" : "the month is still ramping up") + ", ₦" + Math.max(0, goal - currentRevenue).toLocaleString() + " to go");
      } else {
        items.push("no monthly revenue goal is set yet — set one to track progress");
      }
      items.push(expiringThisWeek.length === 0
        ? "no subscriptions expire this week, so no renewal reminders are needed"
        : expiringThisWeek.length + " subscription" + (expiringThisWeek.length === 1 ? "" : "s") + " expire" + (expiringThisWeek.length === 1 ? "s" : "") + " this week (" + nameList(expiringThisWeek.map((s) => s.client ? s.client.fullName : "Unknown")) + ") — worth sending a renewal reminder");
      items.push(outstandingOrders.length === 0
        ? "no orders are waiting on fulfillment"
        : outstandingOrders.length + " order" + (outstandingOrders.length === 1 ? " is" : "s are") + " still being fulfilled: " + outstandingOrders.slice(0, 3).map((o) => (o.client ? o.client.fullName : "Unknown") + " (" + (STAGE_LABELS[o.currentStage] || o.currentStage).toLowerCase() + ")").join(", "));
    }
    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />
      
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">Overview</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">What needs your attention today.</p>
        </div>
        {!forceMineOnly && (
          <div className="flex flex-wrap gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1">
            <button
              onClick={() => setMineOnly(false)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${!mineOnly ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
            >
              Whole team
            </button>
            <button
              onClick={() => setMineOnly(true)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${mineOnly ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
            >
              My tasks
            </button>
          </div>
        )}
      </div>

      {isAdmin && <PipelineFunnel />}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 sm:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {canSeeCrm && (
        <Link href="/dashboard/crm" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-colors hover:bg-[var(--theme-surface-hover)] sm:rounded-2xl sm:p-5">
          <Target size={18} className="text-[var(--theme-text-muted)]" />
          <p className="mt-3 font-mono text-2xl text-[var(--theme-text)]">{crmOverview?.openCount ?? "…"}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Open CRM leads</p>
          {(crmOverview?.overdueFollowUps || 0) > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-amber-300">{crmOverview?.overdueFollowUps} follow-up{crmOverview?.overdueFollowUps === 1 ? "" : "s"} overdue</p>
          )}
        </Link>
        )}
        {canSeeRequests && (
        <Link href="/dashboard/requests" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-colors hover:bg-[var(--theme-surface-hover)] sm:rounded-2xl sm:p-5">
          <Inbox size={18} className="text-[var(--theme-text-muted)]" />
          <p className="mt-3 font-mono text-2xl text-[var(--theme-text)]">{pendingApplications ?? "…"}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Pending applications</p>
        </Link>
        )}
        {hasRole("admin") && (
        <Link href="/dashboard/clients?status=active" className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 transition-colors hover:bg-[var(--theme-surface-hover)] sm:rounded-2xl sm:p-5">
          <ClipboardCheck size={18} className="text-[var(--theme-text-muted)]" />
          <p className="mt-3 font-mono text-2xl text-[var(--theme-text)]">{activeClients ?? "…"}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Active clients</p>
        </Link>
        )}
        {hasRole("admin") && (
        <div className="rounded-xl sm:rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-4 sm:p-5">
          <AlertTriangle size={18} className="text-[#0d9488]" />
          <p className="mt-3 font-mono text-2xl text-[var(--theme-text)]">{loading ? "…" : totalTasksToday}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Things to do today</p>
        </div>
        )}
      </div>

      {hasRole("admin") && (
      <div className="mt-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            
      {/* Prospects Queue Card */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 sm:p-6 mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white"> Prospects Queue</h2>
              <p className="text-sm text-[var(--theme-text-secondary)]">{queue.length} unpaid client{queue.length !== 1 ? "s" : ""} waiting (oldest first)</p>
            </div>
            <button onClick={loadQueue} className="text-xs text-orange-400 hover:text-orange-300">↻ Refresh</button>
          </div>
          <div className="space-y-2">
            {queue.slice(0, 5).map((q) => (
              <div key={q.id} className="flex flex-wrap gap-3 items-center justify-between rounded-lg bg-[var(--theme-input)] px-4 py-3">
                <div className="flex-1">
                  <p className="font-semibold text-white">{q.name}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">
                    {q.days} day{q.days !== 1 ? "s" : ""} waiting · {q.activated ? " Activated" : " Not activated"} · {q.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={q.waLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-500">
                    WhatsApp
                  </a>
                  <button onClick={() => voidClient(q.id)} className="rounded-full border border-red-500/50 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10">
                    Void
                  </button>
                </div>
              </div>
            ))}
            {queue.length > 5 && <p className="text-center text-xs text-[var(--theme-text-secondary)] pt-2">+{queue.length - 5} more...</p>}
          </div>
        </div>
      )}

      {/* Hygiene Report Card */}
      {hygiene.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 sm:p-6 mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white"> Data Hygiene Issues</h2>
              <p className="text-sm text-[var(--theme-text-secondary)]">{hygiene.length} problem{hygiene.length !== 1 ? "s" : ""} found</p>
            </div>
            <button onClick={loadHygiene} className="text-xs text-yellow-400 hover:text-yellow-300">↻ Refresh</button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {hygiene.slice(0, 10).map((h, i) => (
              <div key={i} className="flex flex-wrap items-start gap-3 rounded-lg bg-[var(--theme-input)] px-4 py-2.5 text-sm">
                <span className="text-yellow-400"></span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--theme-text)]">{h.name}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">{h.problem} {h.email && `· ${h.email}`} {h.phone && `· ${h.phone}`}</p>
                </div>
              </div>
            ))}
            {hygiene.length > 10 && <p className="text-center text-xs text-[var(--theme-text-secondary)] pt-2">+{hygiene.length - 10} more...</p>}
          </div>
        </div>
      )}

      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0d9488]/10">
              <Target size={18} className="text-[#0d9488]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--theme-text)]">Monthly Revenue Goal</p>
              <p className="text-xs text-[var(--theme-text-muted)]">
                {goal > 0
                  ? `₦${currentRevenue.toLocaleString()} of ₦${goal.toLocaleString()}`
                  : "No goal set yet"}
              </p>
            </div>
          </div>
          {currentUser?.role === "admin" && !editingGoal && (
            <button
              onClick={() => { setGoalInput(goal ? String(goal) : ""); setEditingGoal(true); }}
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[#0d9488] hover:text-[#0d9488]"
              aria-label="Edit goal"
              title="Edit goal"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {/* Horizontal progress bar */}
        <div className="mt-5">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#0d9488] to-pink-400 transition-all duration-700"
              style={{ width: `${goal > 0 ? Math.min(100, (currentRevenue / goal) * 100) : 0}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 items-center justify-between text-xs">
            <span className="font-mono font-bold text-[var(--theme-text)]">
              {goal > 0 ? `${Math.min(100, Math.round((currentRevenue / goal) * 100))}%` : "—"}
            </span>
            <span className="text-[var(--theme-text-muted)]">
              {goal > 0 ? `₦${Math.max(0, goal - currentRevenue).toLocaleString()} to go` : "Set a goal to track progress"}
            </span>
          </div>
        </div>

        {/* Inline edit (admin only) */}
        {editingGoal && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-2">
            <span className="px-2 text-sm text-[var(--theme-text-secondary)]">₦</span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 500000"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]"
              autoFocus
            />
            <button
              onClick={saveGoal}
              disabled={goalSaving}
              className="rounded-full bg-[#0d9488] px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {goalSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditingGoal(false)}
              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--theme-text-secondary)]">Loading today&apos;s priorities…</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarClock size={16} className="text-[#0d9488]" />
              <p className="font-medium text-[var(--theme-text)]">Today&apos;s sessions ({todaySessions.length})</p>
            </div>
            {todaySessions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No sessions today.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {todaySessions.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2.5">
                    <div>
                      <p className="text-sm text-[var(--theme-text)]">
                        {new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {s.isTeam ? s.title || "Team meeting" : s.client?.fullName || "Client"}
                      </p>
                      <p className="text-xs capitalize text-[var(--theme-text-muted)]">{s.sessionType} · {s.status}{s.staff ? ` · with ${s.staff.name}` : ""}</p>
                    </div>
                    {s.zoomLink ? (
                      <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0d9488] hover:underline">Join</a>
                    ) : (
                      <Link href="/dashboard/appointments" className="text-xs text-[var(--theme-text-secondary)] hover:text-white">Open</Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <p className="font-medium text-[var(--theme-text)]">Needs attention ({flagged.length})</p>
            </div>
            {flagged.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No clients flagged. Nice work.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {flagged.slice(0, 5).map(({ client, flags }) => (
                  <div key={client._id} className="space-y-2 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-3">
                    <div className="cursor-pointer" onClick={() => router.push(`/dashboard/clients/${client._id}`)}>
                      <p className="text-sm font-semibold text-[var(--theme-text)]">{client.fullName}</p>
                      <div className="mt-1.5 space-y-1.5">
                        {flags.map((f) => {
                          const details = (() => {
                            if (f.type.includes("missed")) return { problem: "Routine is slipping (lost streak)", action: "Send a quick WhatsApp nudge" };
                            if (f.type.includes("weight")) return { problem: "Weight trending the wrong way", action: "Review meal plan on a 2-min call" };
                            if (f.type.includes("workout") || f.type.includes("adherence")) return { problem: "Workout adherence is dropping", action: "Send a motivational voice note" };
                            return { problem: f.type.replace(/_/g, " "), action: "Check in with client" };
                          })();
                          return (
                            <div key={f.type} className="text-xs">
                              <p className="text-amber-400/90"> {details.problem}</p>
                              <p className="text-[var(--theme-text-secondary)]"> <span className="font-medium text-[var(--theme-text)]">Action:</span> {details.action}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {canSeeContact && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a href={`tel:${client.phone}`} className="flex flex-wrap items-center gap-1.5 rounded-full bg-[var(--theme-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]">
                          <Phone size={12} /> Call
                        </a>
                        <a href={`https://wa.me/${toWhatsAppNumber(client.phone)}`} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-1.5 rounded-full bg-green-500/20 hover:bg-green-500/30 px-3 py-1.5 text-xs text-green-400 font-medium">
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {flagged.length > 5 && (
                  <Link href="/dashboard/coaching" className="block text-xs text-[#0d9488] hover:underline">
                    +{flagged.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <ClipboardCheck size={16} className="text-purple-400" />
              <p className="font-medium text-[var(--theme-text)]">Due for review ({reviewQueue.length})</p>
            </div>
            {reviewQueue.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">Everyone&apos;s been reviewed recently.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {reviewQueue.slice(0, 5).map((c) => (
                  <div
                    key={c._id}
                    onClick={() => router.push(`/dashboard/clients/${c._id}`)}
                    className="cursor-pointer rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2.5 hover:bg-[var(--theme-surface-hover)]"
                  >
                    <p className="text-sm text-[var(--theme-text)]">{c.fullName}</p>
                    <p className="text-xs capitalize text-[var(--theme-text-muted)]">{c.program} program</p>
                  </div>
                ))}
                {reviewQueue.length > 5 && (
                  <Link href="/dashboard/coaching" className="block text-xs text-[#0d9488] hover:underline">
                    +{reviewQueue.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </div>

          {canSeeBilling && (
          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <p className="font-medium text-[var(--theme-text)]">Renewals expiring this week ({expiringThisWeek.length})</p>
            </div>
            {expiringThisWeek.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">Nothing expiring in the next 7 days.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {expiringThisWeek.slice(0, 5).map((s) => (
                  <div key={s._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2.5">
                    <div className="cursor-pointer" onClick={() => s.client && router.push(`/dashboard/clients/${s.client._id}`)}>
                      <p className="text-sm text-[var(--theme-text)]">{s.client?.fullName || "Unknown"}</p>
                      <p className="text-xs text-[var(--theme-text-muted)]">Expires {new Date(s.currentPeriodEnd).toLocaleDateString()}</p>
                    </div>
                    {s.client && canSeeContact && (
                      <a href={`tel:${s.client.phone}`} className="rounded-full border border-[var(--theme-border)] p-1.5 text-[var(--theme-text-secondary)] hover:text-white"><Phone size={13} /></a>
                    )}
                  </div>
                ))}
                {expiringThisWeek.length > 5 && (
                  <Link href="/dashboard/reports" className="block text-xs text-[#0d9488] hover:underline">
                    +{expiringThisWeek.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </div>

          )}
          {canSeeBilling && (
          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Package size={16} className="text-blue-400" />
              <p className="font-medium text-[var(--theme-text)]">Outstanding orders ({outstandingOrders.length})</p>
            </div>
            {outstandingOrders.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">Nothing waiting on fulfillment.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {outstandingOrders.slice(0, 5).map((o) => {
                  const stages = ["created", "prepared", "packed", "shipped", "delivered"];
                  const idx = Math.max(0, stages.indexOf(o.currentStage));
                  const pct = Math.round((idx / (stages.length - 1)) * 100);
                  const barColor =
                    o.meterColor === "red" ? "bg-red-500" : o.meterColor === "yellow" ? "bg-amber-400" : "bg-green-500";
                  return (
                    <div
                      key={o._id}
                      onClick={() => router.push(`/dashboard/orders/${o._id}`)}
                      className="cursor-pointer rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2.5 hover:bg-[var(--theme-surface-hover)]"
                    >
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <p className="text-sm text-[var(--theme-text)]">{o.client?.fullName || "Unknown client"}</p>
                        <p className="text-xs font-medium text-[var(--theme-text-secondary)]">{STAGE_LABELS[o.currentStage] || o.currentStage}</p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap justify-between gap-3 text-[9px] uppercase tracking-wide text-[var(--theme-text-muted)]">
                        <span>Created</span>
                        <span>Prepared</span>
                        <span>Packed</span>
                        <span>Shipped</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  );
                })}
                {outstandingOrders.length > 5 && (
                  <Link href="/dashboard/orders" className="block text-xs text-[#0d9488] hover:underline">
                    +{outstandingOrders.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </div>          )}

        </div>
      )}
    <SupplementsWidget />
      </div>
  );
}
