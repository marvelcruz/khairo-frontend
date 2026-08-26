"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Phone, MessageCircle, Mail, Plus, X, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";
import ReviewsSection from "./ReviewsSection";
import RemarksSection from "../RemarksSection";
import DraftsSection from "../DraftsSection";
import ClientSessions from "../ClientSessions";
import CustomFieldsEditor from "../../../../components/custom-fields/CustomFieldsEditor";
import RecordForms from "../../../../components/forms/RecordForms";
import CareTeamPanel from "../../../../components/care-team/CareTeamPanel";

type TimetableItem = { _id: string; text: string; period: "morning" | "afternoon" | "evening" };
type Exercise = { _id: string; text: string; reps?: string; duration?: string };
type TimetableDay = { _id: string; dayNumber: number; items: TimetableItem[]; exercises: Exercise[] };

type Client = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  status: string;
  startDate?: string;
  cycleWeeks?: number;
  startingWeightKg?: number;
  goalWeightKg?: number;
  currentWeightKg?: number;
  mealPlanNotes?: string;
  privateNotes?: string;
  referredBy?: string;
  isArchived?: boolean;
  lastReviewedAt?: string;
  assignedCoach?: { _id: string; name: string } | null;
  mealTimetableMode?: "weekly" | "full_cycle";
  mealTimetable?: TimetableDay[];
};

type DailyLog = {
  _id: string;
  logDate: string;
  weightKg?: number;
  calories?: number;
  waterMl?: number;
  steps?: number;
  workoutDone?: boolean;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  if (digits.startsWith("234")) return digits;
  return digits;
}

type ClientTranscript = {
  _id?: string;
  source?: string;
  text?: string;
  createdAt: string;
  createdBy?: { name?: string } | null;
  session?: {
    sessionType?: string;
    startsAt?: string;
    staff?: { name?: string } | null;
  } | null;
};
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [streak, setStreak] = useState(0);

  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [privateNotes, setPrivateNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [reviewing, setReviewing] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const [selectedDay, setSelectedDay] = useState(1);
  const [newItemText, setNewItemText] = useState("");
  const [newItemPeriod, setNewItemPeriod] = useState<"morning" | "afternoon" | "evening">("morning");
  const [itemSaving, setItemSaving] = useState(false);
  const [newExerciseText, setNewExerciseText] = useState("");
  const [newExerciseReps, setNewExerciseReps] = useState("");
  const [newExerciseDuration, setNewExerciseDuration] = useState("");
  const [exerciseSaving, setExerciseSaving] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);
  const [staffList, setStaffList] = useState<{ _id: string; name: string }[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [manualMethod, setManualMethod] = useState<"cash" | "bank_transfer" | "other">("cash");
  const [manualNote, setManualNote] = useState("");
  const [manualActivating, setManualActivating] = useState(false);
  const [manualError, setManualError] = useState("");
  const [transcripts, setTranscripts] = useState<ClientTranscript[]>([]);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchTranscripts = async () => {
    try {
      const res = await api.get<{ transcripts?: ClientTranscript[] }>(`/transcripts/client/${id}`);
      setTranscripts(res.transcripts || []);
    } catch {}
  };

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>(`/clients/${id}`);
      const c =
        typeof res === "object" && res !== null && "client" in res
          ? (res as { client?: NonNullable<typeof client> }).client
          : (res as NonNullable<typeof client>);

      if (!c) throw new Error("Client not found");

      setClient(c);
      setPrivateNotes(c.privateNotes || "");
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTrackerData = useCallback(async () => {
    try {
      const [logsRes, streakRes] = await Promise.all([
        api.get<{ logs: DailyLog[] }>(`/clients/${id}/daily-logs?days=90`),
        api.get<{ streak: number }>(`/clients/${id}/streak`),
      ]);
      setLogs(logsRes.logs);
      setStreak(streakRes.streak);
    } catch {
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
    fetchTrackerData();
    api.get<{ staff?: typeof staffList; users?: typeof staffList }>("/auth/directory")
      .then((res) => setStaffList(res.staff || res.users || []))
      .catch(() => {});
  }, [fetchClient, fetchTrackerData]);

  const handleAssignCoach = async (coachId: string) => {
    setAssignSaving(true);
    try {
      const res = await api.patch<{ client: Client }>(`/clients/${id}`, { assignedCoach: coachId || null });
      setClient(res.client);
    } catch {
    } finally {
      setAssignSaving(false);
    }
  };

  const maxDay = useMemo(() => {
    if (!client) return 7;
    return client.mealTimetableMode === "full_cycle" ? (client.cycleWeeks || 8) * 7 : 7;
  }, [client]);

  const currentDayEntry = client?.mealTimetable?.find((d) => d.dayNumber === selectedDay);

  const handleGenerateLink = async () => {
    setLinkError("");
    setLinkLoading(true);
    setPaymentLink("");
    setCopied(false);
    try {
      const res = await api.post<{ success: boolean; authorizationUrl: string }>(`/clients/${id}/payment-link`);
      setPaymentLink(res.authorizationUrl);
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.message : "Could not generate payment link.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await api.post(`/clients/${id}/restore`);
      router.push("/dashboard/clients");
    } catch {
      alert("Could not restore client.");
    } finally {
      setRestoring(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm(`Are you sure you want to archive ${client?.fullName}? They will be removed from active lists but their data will be preserved forever.`)) return;
    setArchiving(true);
    try {
      await api.del(`/clients/${id}`);
      router.push("/dashboard/clients");
    } catch {
      alert("Could not archive client.");
    } finally {
      setArchiving(false);
    }
  };

  const handleManualActivate = async () => {
    setManualError("");
    setManualActivating(true);
    setManualSuccess(false);
    try {
      const res = await api.post<{ client: Client }>(`/clients/${id}/manual-activate`, {
        method: manualMethod,
        note: manualNote,
      });
      setClient(res.client);
      setManualSuccess(true);
      setManualNote("");
      setTimeout(() => setManualSuccess(false), 3000);
    } catch (err) {
      setManualError(err instanceof ApiError ? err.message : "Could not activate client.");
    } finally {
      setManualActivating(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      await api.patch(`/clients/${id}`, { privateNotes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
    } finally {
      setNotesSaving(false);
    }
  };

  const handleMarkReviewed = async () => {
    setReviewing(true);
    try {
      const res = await api.post<{ client: Client }>(`/clients/${id}/mark-reviewed`);
      setClient(res.client);
      setReviewed(true);
      setTimeout(() => setReviewed(false), 2000);
    } catch {
      alert("Could not mark reviewed. Try again.");
    } finally {
      setReviewing(false);
    }
  };

  const handleSetMode = async (mode: "weekly" | "full_cycle") => {
    setModeSaving(true);
    try {
      const res = await api.patch<{ client: Client }>(`/clients/${id}/timetable-mode`, { mode });
      setClient(res.client);
      setSelectedDay(1);
    } catch {
    } finally {
      setModeSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItemSaving(true);
    try {
      const res = await api.post<{ client: Client }>(`/clients/${id}/timetable/${selectedDay}`, { text: newItemText.trim(), period: newItemPeriod });
      setClient(res.client);
      setNewItemText("");
    } catch {
    } finally {
      setItemSaving(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await api.del<{ client: Client }>(`/clients/${id}/timetable/${selectedDay}/${itemId}`);
      setClient(res.client);
    } catch {
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseText.trim()) return;
    setExerciseSaving(true);
    try {
      const res = await api.post<{ client: Client }>(`/clients/${id}/timetable/${selectedDay}/exercises`, {
        text: newExerciseText.trim(),
        reps: newExerciseReps.trim() || undefined,
        duration: newExerciseDuration.trim() || undefined,
      });
      setClient(res.client);
      setNewExerciseText("");
      setNewExerciseReps("");
      setNewExerciseDuration("");
    } catch {
    } finally {
      setExerciseSaving(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      const res = await api.del<{ client: Client }>(`/clients/${id}/timetable/${selectedDay}/exercises/${exerciseId}`);
      setClient(res.client);
    } catch {
    }
  };

  const { hasRole, hasPermission } = useAuth();
  const canSeeContact = hasPermission("view_contact_info");
  const canSeeMoney = hasPermission("view_financials");

  if (loading) return <p className="text-sm text-[var(--theme-text-secondary)]">Loading…</p>;
  if (notFound || !client) return <p className="text-sm text-[var(--theme-text-secondary)]">Client not found.</p>;

  const latestLog = [...logs].reverse().find((l) => l.weightKg || l.calories || l.steps || l.waterMl);
  const weightLogs = logs.filter((l) => typeof l.weightKg === "number");
  const latestLoggedWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weightKg : null;

  const loggedDateSet = new Set(logs.map((l) => l.logDate));
  const startKey = client.startDate ? new Date(client.startDate).toISOString().slice(0, 10) : "";
  const heatmapDays: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    heatmapDays.push(d.toISOString().slice(0, 10));
  }

  return (
    <div>
      <button onClick={() => router.push("/dashboard/clients")} className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--theme-text-secondary)] hover:text-white">
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">{client.fullName}</h1>
          {client.referredBy && (
            <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
              Referred by: <span className="font-medium text-[#0d9488]">{client.referredBy}</span>
            </p>
          )}
          {canSeeContact && <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{client.email} · {client.phone}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs capitalize text-green-400">{client.status}</span>
          {hasRole("admin") && (
          <select
            value={client.assignedCoach?._id || ""}
            onChange={(e) => handleAssignCoach(e.target.value)}
            disabled={assignSaving}
            className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">Unassigned</option>
            {(staffList || []).map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          )}
          <button onClick={handleMarkReviewed} disabled={reviewing} className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)] disabled:opacity-50">
            <ClipboardCheck size={14} /> {reviewing ? "Marking…" : reviewed ? "Reviewed " : "Mark reviewed"}
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
        {client.lastReviewedAt ? `Last reviewed ${new Date(client.lastReviewedAt).toLocaleDateString()}` : "Never reviewed"}
      </p>

            {client.isArchived && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-400">This client is archived and hidden from active lists.</p>
          <button onClick={handleRestore} disabled={restoring} className="shrink-0 rounded-full border border-yellow-500/50 px-4 py-2 text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50">
            {restoring ? "Restoring…" : "Restore client"}
          </button>
        </div>
      )}

      {canSeeContact && (
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:${client.phone}`} className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)]"><Phone size={14} /> Call</a>
        <a href={`https://wa.me/${toWhatsAppNumber(client.phone)}`} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)]"><MessageCircle size={14} /> WhatsApp</a>
        <a href={`mailto:${client.email}`} className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)]"><Mail size={14} /> Email</a>
      </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
          <p className="text-2xl font-bold text-white capitalize">{client.program}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Program</p>
        </div>
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
          <p className="text-2xl font-bold text-white">{latestLoggedWeight ?? client.currentWeightKg ?? "—"} kg</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Latest logged weight</p>
        </div>
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
          <p className="text-2xl font-bold text-white">{client.goalWeightKg ?? "—"} kg</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Goal weight</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <p className="font-medium text-white">Daily streak</p>
            <p className="text-2xl font-bold text-white">{streak} <span className="text-sm font-normal text-[var(--theme-text-secondary)]">day{streak === 1 ? "" : "s"}</span></p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {heatmapDays.map((day) => (
              <div key={day} title={day} className={`h-3.5 w-3.5 rounded-sm ${loggedDateSet.has(day) ? "bg-emerald-400" : day >= startKey && day <= todayKey() ? "bg-red-500/80" : "bg-[var(--theme-surface-soft)]"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <p className="font-medium text-white">Most recent daily log</p>
          {latestLog ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[var(--theme-text-secondary)]">Date</p><p className="text-white">{new Date(latestLog.logDate).toLocaleDateString()}</p></div>
              <div><p className="text-[var(--theme-text-secondary)]">Weight</p><p className="text-white">{latestLog.weightKg ? `${latestLog.weightKg} kg` : "—"}</p></div>
              <div><p className="text-[var(--theme-text-secondary)]">Calories</p><p className="text-white">{latestLog.calories ?? "—"}</p></div>
              <div><p className="text-[var(--theme-text-secondary)]">Water</p><p className="text-white">{latestLog.waterMl ? `${latestLog.waterMl} ml` : "—"}</p></div>
              <div><p className="text-[var(--theme-text-secondary)]">Steps</p><p className="text-white">{latestLog.steps ?? "—"}</p></div>
              <div><p className="text-[var(--theme-text-secondary)]">Workout</p><p className="text-white">{latestLog.workoutDone ? "Done" : "Not done"}</p></div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No daily logs yet.</p>
          )}
        </div>
      </div>

      <ClientSessions clientId={id as string} />

      <CareTeamPanel clientId={id as string} />

      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">Meal timetable</p>
            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Starts the day their subscription begins. Client sees today&apos;s plan automatically.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-[var(--theme-border)] p-1">
            <button
              onClick={() => handleSetMode("weekly")}
              disabled={modeSaving}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${client.mealTimetableMode !== "full_cycle" ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
            >
              Repeats weekly
            </button>
            <button
              onClick={() => handleSetMode("full_cycle")}
              disabled={modeSaving}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${client.mealTimetableMode === "full_cycle" ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
            >
              Unique per day
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2">
          <button
            onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
            disabled={selectedDay <= 1}
            className="rounded-full p-1.5 text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white">
            Day {selectedDay} {client.mealTimetableMode !== "full_cycle" ? "(weekly)" : `of ${maxDay}`}
          </span>
          <button
            onClick={() => setSelectedDay((d) => Math.min(maxDay, d + 1))}
            disabled={selectedDay >= maxDay}
            className="rounded-full p-1.5 text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {(["morning", "afternoon", "evening"] as const).map((period) => {
            const items = (currentDayEntry?.items || []).filter((i) => i.period === period);
            if (items.length === 0) return null;
            return (
              <div key={period}>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--theme-text-secondary)]">{period}</p>
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <div key={item._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm">
                      <span className="text-[var(--theme-text)]">{item.text}</span>
                      <button onClick={() => handleRemoveItem(item._id)} className="text-[var(--theme-text-secondary)] hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {(!currentDayEntry || currentDayEntry.items.length === 0) && (
            <p className="text-sm text-[var(--theme-text-secondary)]">No items yet for Day {selectedDay}.</p>
          )}
        </div>

        <form onSubmit={handleAddItem} className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-1 rounded-full border border-[var(--theme-border)] p-1 w-fit">
            {(["morning", "afternoon", "evening"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setNewItemPeriod(period)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${newItemPeriod === period ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              placeholder={`e.g. Oats + banana (Day ${selectedDay})`}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
            />
            <button type="submit" disabled={itemSaving} className="flex flex-wrap shrink-0 items-center gap-1 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              <Plus size={14} /> Add
            </button>
          </div>
        </form>
      </div>


      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <p className="font-medium text-white">Exercises for Day {selectedDay}</p>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Recommend exercises for this day. Client can check them off when done.</p>

        <div className="mt-4 space-y-2">
          {(currentDayEntry?.exercises || []).length === 0 ? (
            <p className="text-sm text-[var(--theme-text-secondary)]">No exercises yet for Day {selectedDay}.</p>
          ) : (
            (currentDayEntry?.exercises || []).map((ex) => (
              <div key={ex._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2 text-sm">
                <div>
                  <span className="text-[var(--theme-text)]">{ex.text}</span>
                  {(ex.reps || ex.duration) && (
                    <span className="ml-2 text-xs text-[var(--theme-text-secondary)]">
                      {ex.reps && `${ex.reps} reps`}
                      {ex.reps && ex.duration && " · "}
                      {ex.duration && ex.duration}
                    </span>
                  )}
                </div>
                <button onClick={() => handleRemoveExercise(ex._id)} className="text-[var(--theme-text-secondary)] hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddExercise} className="mt-4 space-y-2">
          <input
            placeholder="e.g. Push-ups, Squats, Plank"
            value={newExerciseText}
            onChange={(e) => setNewExerciseText(e.target.value)}
            className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Reps (optional, e.g. 3x10)"
              value={newExerciseReps}
              onChange={(e) => setNewExerciseReps(e.target.value)}
              className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
            />
            <input
              placeholder="Duration (optional, e.g. 30s)"
              value={newExerciseDuration}
              onChange={(e) => setNewExerciseDuration(e.target.value)}
              className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
            />
          </div>
          <button type="submit" disabled={exerciseSaving} className="flex flex-wrap items-center gap-1 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            <Plus size={14} /> Add exercise
          </button>
        </form>
      </div>
      <div className="mt-6">
        <CustomFieldsEditor entityType="client" entityId={id as string} canEdit={hasRole("admin", "coach")} />
      </div>
      <div className="mt-6">
        <RecordForms entityType="client" entityId={id as string} />
      </div>

      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <p className="font-medium text-white">Private staff notes</p>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Only visible to staff, never shown to the client.</p>
        <textarea
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          rows={5}
          placeholder="Observations, concerns, things to follow up on…"
          className="mt-3 w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
        />
        <button onClick={handleSaveNotes} disabled={notesSaving} className="mt-3 rounded-full bg-[#0d9488] px-5 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          {notesSaving ? "Saving…" : notesSaved ? "Saved" : "Save notes"}
        </button>
      </div>

      {canSeeMoney && (
      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <p className="font-medium text-white">Mark as paid manually</p>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">For cash, bank transfer, or activating before Paystack is live. Activates the client and starts a fresh 30-day cycle immediately.</p>

        <div className="mt-4 flex flex-wrap gap-1 rounded-full border border-[var(--theme-border)] p-1 w-fit">
          {(["cash", "bank_transfer", "other"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setManualMethod(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${manualMethod === m ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>

        <input
          placeholder="Optional note (e.g. paid at gym reception)"
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          className="mt-3 w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
        />

        {manualError && <p className="mt-3 rounded-sm bg-red-500/10 px-3 py-2 text-sm text-red-400">{manualError}</p>}
        {manualSuccess && <p className="mt-3 rounded-sm bg-green-500/10 px-3 py-2 text-sm text-green-400">Client activated.</p>}

        <button
          onClick={handleManualActivate}
          disabled={manualActivating}
          className="mt-3 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {manualActivating ? "Activating…" : "Mark as paid & activate"}
        </button>
      </div>

      )}
      {canSeeMoney && (
      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <p className="font-medium text-white">Payment link</p>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Generate a link for this client&apos;s {client.program} program and send it to them directly.</p>

        {linkError && <p className="mt-3 rounded-sm bg-red-500/10 px-3 py-2 text-sm text-red-400">{linkError}</p>}

        {paymentLink ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2.5">
            <input readOnly value={paymentLink} className="w-full bg-transparent text-sm text-[var(--theme-text)] outline-none" onFocus={(e) => e.target.select()} />
            <button onClick={handleCopy} className="flex flex-wrap shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : (
          <button onClick={handleGenerateLink} disabled={linkLoading} className="mt-4 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
            {linkLoading ? "Generating…" : "Generate payment link"}
          </button>
        )}
      </div>

      )}
      {client.mealPlanNotes && (
        <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <p className="font-medium text-white">Meal plan notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--theme-text-secondary)]">{client.mealPlanNotes}</p>
        </div>
      )}
    
            <DraftsSection entityType="Client" entityId={id as string} />

      <RemarksSection entityType="Client" entityId={id as string} />

      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
        <h3 className="text-lg font-medium text-white">Transcripts ({transcripts.length})</h3>
        <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Session transcripts from Zoom/Google Meet calls. Admin, assigned coach and assigned doctor have access.</p>
        {transcripts.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-[var(--theme-text-secondary)]">No transcripts yet. Paste a transcript from tl;dv below.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {transcripts.map((t) => (
              <div key={t._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{t.session?.sessionType || "Session"} — {new Date(t.session?.startsAt || t.createdAt).toLocaleDateString()}</p>
                    <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">{t.session?.staff?.name || "Unassigned"} · {t.source} · {new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--theme-text-secondary)]">{t.text}</pre>
              </div>
            ))}
          </div>
        )}
        <form className="mt-4 space-y-2" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const sessionId = fd.get("sessionId") as string; const text = fd.get("text") as string; if (!sessionId || !text) return; await api.post("/transcripts", { sessionId, text }); (e.target as HTMLFormElement).reset(); await fetchTranscripts(); }}>
          <select name="sessionId" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none">
            <option value="">Select session…</option>
            {transcripts.length === 0 && <option value="" disabled>No sessions available</option>}
          </select>
          <textarea name="text" placeholder="Paste transcript from tl;dv…" rows={4} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none" />
          <button type="submit" className="rounded-full bg-[#0d9488] px-5 py-2 text-xs font-medium text-white hover:bg-teal-700">Save transcript</button>
        </form>
      </div>

      {hasRole("admin") && !client.isArchived && (
        <div className="mt-8 rounded-sm border border-red-500/30 bg-red-500/5 p-4 sm:p-6">
          <p className="font-medium text-red-400">Danger Zone</p>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Archiving removes this client from all active lists. Their data is preserved and can be restored by an administrator if needed.</p>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="mt-4 rounded-full border border-red-500/50 bg-transparent px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            {archiving ? "Archiving…" : "Archive Client"}
          </button>
        </div>
      )}

      <ReviewsSection clientId={id as string} />
      </div>
  );
}
