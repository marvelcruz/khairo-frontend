"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { api, ApiError } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus, Video, X, CalendarPlus, Copy } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";

type Staff = { _id: string; name: string; roles?: string[]; isActive?: boolean };

type Session = {
  _id: string;
  startsAt: string;
  durationMins: number;
  sessionType: string;
  zoomLink?: string;
  note?: string;
  status: string;
  requestedBy: string;
  isTeam?: boolean;
  title?: string;
  createdAt?: string;
  decidedAt?: string;
  confirmedAt?: string;
  transcriptCount?: number;
  client: { _id: string; fullName: string; email?: string; phone?: string; program?: string } | null;
  staff?: Staff | null;
  decidedBy?: Staff | null;
  confirmedBy?: Staff | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  confirmed: "bg-green-500/10 text-green-400",
  declined: "bg-red-500/10 text-red-400",
  completed: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]",
};

const inputClass =
  "w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] [color-scheme:inherit]";

function getWaitTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

type TranscriptEntry = {
  source?: string;
  createdBy?: { name?: string } | null;
  createdAt?: string;
  text?: string;
};

function googleCalUrl(s: Session) {
  const start = new Date(s.startsAt);
  const end = new Date(start.getTime() + (s.durationMins || 60) * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Khairo Diet Clinic ${s.sessionType} session - ${s.isTeam ? s.title || "Team meeting" : s.client?.fullName || "Client"}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Session type: ${s.sessionType}${s.zoomLink ? " | Zoom: " + s.zoomLink : ""}${s.note ? " | Note: " + s.note : ""}`,
    location: s.zoomLink || "Khairo Diet Clinic Studio",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function BookSessionModal({ onClose, onBooked, staffList }: { onClose: () => void; onBooked: () => void; staffList: Staff[] }) {
  const [clients, setClients] = useState<{ _id: string; fullName: string; reconciled?: boolean }[]>([]);
  const [form, setForm] = useState({ clientId: "", staffId: "", date: "", time: "", sessionType: "training", zoomLink: "", note: "", isTeam: false, title: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{
          clients?: { _id: string; fullName: string; reconciled?: boolean }[];
          data?: { _id: string; fullName: string; reconciled?: boolean }[];
        }>("/clients?limit=100");
        setClients(res.clients || res.data || []);
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if ((!form.isTeam && !form.clientId) || !form.date || !form.time) {
      setError("Client, date and time are required.");
      return;
    }
    setSaving(true);
    try {
      const startsAt = new Date(`${form.date}T${form.time}`);

      if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
        setError("Choose a future date and time.");
        setSaving(false);
        return;
      }

      await api.post("/sessions", {
        clientId: form.isTeam ? undefined : form.clientId,
        isTeam: form.isTeam,
        title: form.title,
        staffId: form.staffId || undefined,
        startsAt: startsAt.toISOString(),
        sessionType: form.sessionType,
        zoomLink: form.zoomLink,
        note: form.note,
      });
      onBooked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not book session.");
    } finally {
      setSaving(false);
    }
  };

  const availableClients =
    form.sessionType === "consultation"
      ? clients
      : clients.filter((client) => client.reconciled);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5">
      <div className="w-full max-w-md rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="text-xl font-medium text-white">Book session</h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--theme-text-secondary)] hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setForm({ ...form, isTeam: false })} className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${!form.isTeam ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"}`}>Client session</button>
            <button type="button" onClick={() => setForm({ ...form, isTeam: true })} className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${form.isTeam ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"}`}>Team meeting</button>
          </div>
          {form.isTeam ? (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Meeting title</p>
              <input placeholder="e.g. Weekly team sync" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
          ) : (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Client name</p>
              <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass}>
                <option value="">Select client…</option>
                {availableClients.map((cl) => (<option key={cl._id} value={cl._id}>{cl.fullName}</option>))}
              </select>
            </div>
          )}
          {!form.isTeam && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Professional</p>
              <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} className={inputClass}>
                <option value="">Auto-assign coach / doctor</option>
                {staffList.map((st) => (<option key={st._id} value={st._id}>{st.name}</option>))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Date</p>
              <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Time</p>
              <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Session type</p>
            <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })} className={inputClass}>
              <option value="training">Training</option>
              <option value="consultation">Consultation</option>
              <option value="review">Review</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Zoom link</p>
            <input placeholder="https://zoom.us/… (optional)" value={form.zoomLink} onChange={(e) => setForm({ ...form, zoomLink: e.target.value })} className={inputClass} />
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--theme-text-secondary)]">Note</p>
            <input placeholder="Anything the professional should know (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputClass} />
          </div>
          {error && <p className="rounded-sm bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-full bg-[#0d9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
            {saving ? "Booking…" : "Book session"}
          </button>
        </form>
      </div>
    </div>
  );
}


export default function AppointmentsPage() {
  const { hasRole, hasPermission, user } = useAuth();
  const router = useRouter();
  const canSeeContact = hasPermission("view_contact_info");
  const canDecide = hasRole("admin", "coach", "doctor");
  const canBook = hasRole("admin", "coach", "staff");
  const canComplete = hasRole("admin", "coach", "doctor");
  const canArchive = hasRole("admin", "staff");
  const canAssign = hasRole("admin", "staff");
  const doctorAppointmentView =
    hasRole("doctor") && !hasRole("admin");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");
  const [mineOnly, setMineOnly] = useState(false);
  const [transcriptForms, setTranscriptForms] = useState<Record<string, boolean>>({});
  const [transcriptViews, setTranscriptViews] = useState<Record<string, TranscriptEntry[]>>({});

  const fetchSessions = useCallback(async (mode: "active" | "archived", silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await api.get<{ sessions: Session[] }>(`/sessions?archived=${mode === "archived"}`);
      setSessions(res.sessions || []);
      setError("");
    } catch (err) {
      setSessions([]);
      setError(err instanceof Error ? err.message : "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(view);
    const t = setInterval(() => fetchSessions(view, true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") fetchSessions(view, true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [view, fetchSessions]);

  useEffect(() => {
    api.get<{ staff?: Staff[]; users?: Staff[] }>("/auth/directory")
      .then((r) => {
        const list = r.staff || r.users || [];
        setStaffList(
          list.filter(
            (staff) =>
              staff.isActive !== false &&
              (staff.roles || []).some((role) => role === "coach" || role === "doctor")
          )
        );
      })
      .catch(() => {});
  }, []);

  const setStatus = async (id: string, status: string) => {
    setActingId(id);
    try {
      await api.patch(`/sessions/${id}/status`, { status });
      await fetchSessions(view);
    } catch {}
    setActingId(null);
  };

  const assignStaffFn = async (id: string, staffId: string) => {
    try {
      await api.patch(`/sessions/${id}/assign`, { staffId: staffId || null });
      await fetchSessions(view);
    } catch {}
  };

  const archiveSessionFn = async (id: string) => {
    setActingId(id);
    try {
      await api.patch(`/sessions/${id}/archive`);
      await fetchSessions(view);
    } catch {}
    setActingId(null);
  };

  const loadTranscripts = async (sessionId: string) => {
    try {
      const res = await api.get<{ transcripts: TranscriptEntry[] }>(`/transcripts/session/${sessionId}`);
      setTranscriptViews((v) => ({ ...v, [sessionId]: res.transcripts || [] }));
    } catch {}
  };

  const myId =
    user && typeof user === "object" && "_id" in user
      ? String((user as { _id?: string })._id || "")
      : "";
  const filteredSessions = mineOnly
    ? sessions.filter((s) => s.staff?._id === myId || s.confirmedBy?._id === myId)
    : sessions;

  const hoursSince = (dateStr?: string) => dateStr ? Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000) : 0;

  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    if (loading) return ["Reading the appointments board…"];
    const items: string[] = [];
    const sessions = filteredSessions;

    if (view === "archived") {
      items.push("you are viewing the archived session history — " + sessions.length + " completed session" + (sessions.length === 1 ? "" : "s") + " on record");
      if (sessions.length === 0) items.push("no archived sessions yet — completed sessions move here automatically after 7 days");
      else {
        const teamCount = sessions.filter((s) => s.isTeam).length;
        const clientCount = sessions.length - teamCount;
        if (teamCount > 0 && clientCount > 0) items.push(teamCount + " team meeting" + (teamCount === 1 ? "" : "s") + " and " + clientCount + " client session" + (clientCount === 1 ? "" : "s") + " in the archive");
      }
      return items;
    }

    if (sessions.length === 0) {
      items.push(mineOnly ? "no sessions assigned to you right now" : "no active sessions booked yet");
      return items;
    }

    const pending = sessions.filter((s) => s.status === "pending");
    const confirmed = sessions.filter((s) => s.status === "confirmed");
    const completed = sessions.filter((s) => s.status === "completed");
    const openPastDue = sessions.filter(
      (s) =>
        (s.status === "pending" || s.status === "confirmed") &&
        new Date(s.startsAt).getTime() < Date.now()
    );
    const futureConfirmed = confirmed.filter(
      (s) => new Date(s.startsAt).getTime() >= Date.now()
    );
    const declined = sessions.filter((s) => s.status === "declined");
    const unassigned = sessions.filter((s) => !s.isTeam && !s.staff && s.status !== "declined" && s.status !== "completed");
    const missingTranscript = completed.filter((s) => (s.transcriptCount || 0) === 0);
    const teamMeetings = sessions.filter((s) => s.isTeam);
    const clientSessions = sessions.length - teamMeetings.length;

    if (mineOnly) {
      items.push("showing only your appointments — " + sessions.length + " session" + (sessions.length === 1 ? "" : "s") + " assigned to you");
    } else {
      items.push(
        sessions.length + " active session" + (sessions.length === 1 ? "" : "s") + " on the board" +
        (teamMeetings.length > 0 ? " — " + teamMeetings.length + " team meeting" + (teamMeetings.length === 1 ? "" : "s") : "") +
        (clientSessions > 0 ? " — " + clientSessions + " client session" + (clientSessions === 1 ? "" : "s") : "")
      );
    }

    if (openPastDue.length > 0) {
      items.push(
        openPastDue.length +
          " past-due session" +
          (openPastDue.length === 1 ? " needs" : "s need") +
          " resolution — review whether each was completed, declined or should be rescheduled"
      );
    }

    if (pending.length > 0) {
      const oldest = pending.reduce((a, b) => (hoursSince(a.createdAt) > hoursSince(b.createdAt) ? a : b));
      const nm = oldest.isTeam ? oldest.title || "Team meeting" : (oldest.client ? oldest.client.fullName : "Unknown");
      items.push(
        pending.length + " session" + (pending.length === 1 ? "" : "s") + " waiting for a decision — " +
        nm + " has been waiting " + hoursSince(oldest.createdAt) + "h — confirm or decline today so nobody is left hanging"
      );
    } else if (confirmed.length > 0) {
      items.push("no pending decisions right now — " + confirmed.length + " session" + (confirmed.length === 1 ? " is" : "s are") + " confirmed and ready to go");
    }

    if (unassigned.length > 0) {
      items.push(
        unassigned.length + " session" + (unassigned.length === 1 ? "" : "s") + " need" + (unassigned.length === 1 ? "s" : "") + " a professional assigned: " +
        nameList(unassigned.map((s) => s.client ? s.client.fullName : "Unknown")) +
        " — assign someone so they can confirm the slot"
      );
    }

    if (missingTranscript.length > 0) {
      items.push(
        missingTranscript.length + " completed session" + (missingTranscript.length === 1 ? "" : "s") + " still waiting on a transcript: " +
        nameList(missingTranscript.map((s) => s.client ? s.client.fullName : "Unknown")) +
        " — paste the transcript from tl;dv when it arrives"
      );
    }

    if (futureConfirmed.length > 0) {
      const next = futureConfirmed.reduce((a, b) => (new Date(a.startsAt).getTime() < new Date(b.startsAt).getTime() ? a : b));
      const when = new Date(next.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const who = next.isTeam ? "team meeting" : (next.client ? next.client.fullName : "the client");
      items.push("next confirmed session is at " + when + " — " + who);
    }

    if (declined.length > 0) {
      items.push(declined.length + " session" + (declined.length === 1 ? "" : "s") + " declined — consider offering an alternative time");
    }

    return items;
  })();

  return (
    <div className="[&_button]:min-h-10 [&_input]:min-h-10 [&_select]:min-h-10 [&_textarea]:min-h-10 sm:[&_button]:min-h-0 sm:[&_input]:min-h-0 sm:[&_select]:min-h-0 sm:[&_textarea]:min-h-0">
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Appointments</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Every session moves through a four-stage pipeline: request, assignment, professional confirmation and completion. Each completed stage unlocks the next.</p>
        </div>
        {canBook && (
          <button onClick={() => setShowModal(true)} className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-teal-700">
            <Plus size={14} /> Book Session
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {!doctorAppointmentView && (
          <button onClick={() => setMineOnly(!mineOnly)} className={`rounded-full px-4 py-2 text-xs font-medium ${mineOnly ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"}`}>{mineOnly ? "My appointments" : "Whole team"}</button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
        <button onClick={() => setView("active")} className={`rounded-full px-4 py-2 text-xs font-medium ${view === "active" ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"}`}>Active sessions</button>
        <button onClick={() => setView("archived")} className={`rounded-full px-4 py-2 text-xs font-medium ${view === "archived" ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"}`}>Archived history</button>
        </div>
      </div>

      {view === "archived" && (
        <p className="mt-3 text-xs text-[var(--theme-text-secondary)]">Completed sessions older than 7 days. Read-only — no actions available.</p>
      )}

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-400">Could not load sessions — {error}. Check your connection or refresh.</p>
        ) : filteredSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--theme-text-secondary)]">{view === "archived" ? "No archived sessions yet." : mineOnly ? "No sessions assigned to you." : "No sessions booked yet."}</p>
        ) : (
          filteredSessions.map((s) => (
            <div key={s._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {s.isTeam ? (
                    <p className="font-medium text-white">{s.title || "Team meeting"}</p>
                  ) : s.client ? (
                    <button onClick={() => router.push(`/dashboard/clients/${s.client?._id}`)} className="font-medium text-white hover:text-[#0d9488] hover:underline cursor-pointer">{s.client.fullName}</button>
                  ) : (
                    <p className="font-medium text-white">Unknown</p>
                  )}
                  {s.isTeam && <p className="mt-1 text-[10px] uppercase tracking-wide text-sky-400">Team meeting · all staff</p>}
                  {!s.isTeam && s.requestedBy === "client" && <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-400">Client request</p>}
                  {canSeeContact && !s.isTeam && <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">{s.client?.email} · {s.client?.phone}</p>}
                  <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                    {new Date(s.startsAt).toLocaleDateString()} · {new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · <span className="capitalize">{s.sessionType}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {s.zoomLink && (
                      <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs text-[#0d9488] hover:underline sm:min-h-0">
                        <Video size={12} /> Join Zoom
                      </a>
                    )}
                    <a href={googleCalUrl(s)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-xs text-[var(--theme-text-secondary)] hover:text-[#0d9488] hover:underline sm:min-h-0">
                      <CalendarPlus size={12} /> Add to Google Calendar
                    </a>
                    {s.zoomLink && (
                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(`Session: ${s.isTeam ? s.title || "Team meeting" : s.client?.fullName || "Client"} | ${new Date(s.startsAt).toLocaleString()} | ${s.zoomLink}`);
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.innerText = "Copied ";
                          setTimeout(() => { btn.innerText = "Copy for tl;dv"; }, 1500);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-[var(--theme-text-secondary)] hover:text-[#0d9488]"
                      >
                        <Copy size={12} /> Copy for tl;dv
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {(s.status === "pending" || s.status === "confirmed") &&
                    new Date(s.startsAt).getTime() < Date.now() && (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                        Past due
                      </span>
                    )}
                  <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[s.status] || "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"}`}>{s.status}</span>
                  {s.status === "pending" && s.createdAt && (
                    <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-400">Waiting {getWaitTime(s.createdAt)}</span>
                  )}
                  {s.status === "completed" && (
                    <span className={`rounded-full px-2.5 py-1 text-xs ${(s.transcriptCount || 0) > 0 ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {(s.transcriptCount || 0) > 0 ? "Transcript received " : "Transcript pending"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                  {(() => {
                    const stages = s.isTeam
                      ? [
                          { key: "requested", label: "Requested", done: true, event: { by: "Staff", at: s.createdAt } },
                          { key: "completed", label: "Completed", done: s.status === "completed", event: s.status === "completed" && s.decidedAt ? { by: s.decidedBy?.name || "Staff", at: s.decidedAt } : null },
                        ]
                      : [
                          { key: "requested", label: "Requested", done: true, event: { by: s.requestedBy === "client" ? "Client" : "Staff", at: s.createdAt } },
                          { key: "assigned", label: "Assigned", done: !!s.staff, event: s.staff ? { by: s.staff.name, at: s.createdAt } : null },
                          { key: "confirmed", label: "Confirmed", done: s.status === "confirmed" || s.status === "completed", event: s.confirmedAt ? { by: s.confirmedBy?.name || "Professional", at: s.confirmedAt } : null },
                          { key: "completed", label: "Completed", done: s.status === "completed", event: s.status === "completed" && s.decidedAt ? { by: s.decidedBy?.name || "Staff", at: s.decidedAt } : null },
                        ];
                    const finePrint = stages
                      .filter((st) => st.event)
                      .map((st) => {
                        const event = st.event;
                        const when = event?.at
                          ? new Date(event.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                          : "";
                        return event ? `${st.label} by ${event.by} ${when}` : "";
                      });
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center">
                          {stages.map((st, i) => (
                            <div key={st.key} className="flex items-center">
                              {i > 0 && <div className={`mx-1.5 h-px w-4 sm:w-8 ${st.done ? "bg-[#0d9488]" : "bg-[var(--theme-surface-soft)]"}`} />}
                              <div className="flex flex-wrap items-center gap-1">
                                <span className={`h-2 w-2 rounded-full ${st.done ? "bg-[#0d9488]" : "bg-white/15"}`} />
                                <span className={`text-[10px] ${st.done ? "text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}>{st.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {finePrint.length > 0 && (
                          <p className="text-[10px] leading-relaxed text-[var(--theme-text-secondary)]">{finePrint.join(" · ")}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {!s.isTeam && canAssign && view === "active" && (
                  <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                    <p className="text-xs font-medium text-white mb-2">Assign professional</p>
                    <select
                      value={s.staff?._id || ""}
                      onChange={(e) => assignStaffFn(s._id, e.target.value)}
                      className="w-full rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1.5 text-xs text-white outline-none focus:border-[#0d9488]"
                    >
                      <option value="">Unassigned (auto-assign)</option>
                      {staffList.map((st) => (<option key={st._id} value={st._id}>{st.name}</option>))}
                    </select>
                  </div>
                )}

                {view === "active" && (
                  <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                    <div className="flex flex-wrap gap-2">
                      {canDecide &&
                        s.status === "pending" &&
                        new Date(s.startsAt).getTime() >= Date.now() && (
                        <>
                          <button onClick={() => setStatus(s._id, "confirmed")} disabled={actingId === s._id} className="rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50">Confirm session</button>
                          <button onClick={() => setStatus(s._id, "declined")} disabled={actingId === s._id} className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50">Decline</button>
                        </>
                      )}
                      {canComplete && s.status === "confirmed" && (
                        <button onClick={() => setStatus(s._id, "completed")} disabled={actingId === s._id} className="rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 disabled:opacity-50">Mark completed</button>
                      )}
                      {canArchive && s.status === "completed" && (
                        <button onClick={() => archiveSessionFn(s._id)} disabled={actingId === s._id} className="rounded-full bg-[var(--theme-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50">Archive session</button>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Meeting transcript</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${(s.transcriptCount || 0) > 0 ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {(s.transcriptCount || 0) > 0 ? `Received  (${s.transcriptCount})` : "Pending"}
                    </span>
                  </div>
                  {(transcriptViews[s._id] || []).map((t, i) => (
                    <div key={i} className="mt-3 rounded-sm bg-black/40 p-3">
                      <div className="mb-2 flex flex-wrap gap-3 items-center justify-between text-[10px]">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${t.source === "webhook" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                          {t.source === "webhook" ? "AUTO" : "MANUAL"}
                        </span>
                        <span className="text-[var(--theme-text-secondary)]">
                          {t.createdBy?.name ? `by ${t.createdBy.name} · ` : ""}
                          {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--theme-text-secondary)]">{t.text}</pre>
                    </div>
                  ))}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => loadTranscripts(s._id)} className="rounded-full bg-[var(--theme-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]">View</button>
                    {view === "active" && (
                      <button onClick={() => setTranscriptForms({ ...transcriptForms, [s._id]: !transcriptForms[s._id] })} className="rounded-full bg-[var(--theme-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]">Paste transcript</button>
                    )}
                  </div>
                  {transcriptForms[s._id] && view === "active" && (
                    <form
                      className="mt-3 space-y-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const text = (e.currentTarget.elements.namedItem("text") as HTMLTextAreaElement).value;
                        if (!text) return;
                        await api.post("/transcripts", { sessionId: s._id, text });
                        (e.target as HTMLFormElement).reset();
                        setTranscriptForms({ ...transcriptForms, [s._id]: false });
                        await fetchSessions(view);
                        await loadTranscripts(s._id);
                      }}
                    >
                      <textarea name="text" rows={4} placeholder="Paste transcript from tl;dv…" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none" />
                      <button type="submit" className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-teal-700">Save transcript</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <BookSessionModal
          staffList={staffList}
          onClose={() => setShowModal(false)}
          onBooked={() => {
            setShowModal(false);
            fetchSessions(view);
          }}
        />
      )}
    </div>
  );
}
