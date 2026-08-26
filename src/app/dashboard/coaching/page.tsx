"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardCheck, Rocket } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { PageTicker } from "../../../components/PageTicker";

type ReviewClient = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  lastReviewedAt?: string;
  currentWeightKg?: number;
  goalWeightKg?: number;
};

type Flag = { type: string; detail: string };
type FlaggedClient = {
  client: { _id: string; fullName: string; email: string; phone: string; program: string };
  flags: Flag[];
};

type OnboardingItem = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  onboardingStatus: "complete" | "not_started" | "in_progress";
  daysSinceActivation: number | null;
  onboarding: {
    loggedWeight: boolean;
    tickedMeal: boolean;
    bookedCall: boolean;
    joinedGroup: boolean;
  };
  assignedCoach?: { name?: string } | null;
};

type OnboardingResponse = {
  items?: OnboardingItem[];
};

type CoachingTab = "attention" | "review" | "onboarding";

const FLAG_LABELS: Record<string, string> = {
  missed_logs: "Missed logs",
  weight_trend: "Weight trending wrong way",
  low_adherence: "Low workout adherence",
};

const ONBOARDING_LABELS: Array<[keyof OnboardingItem["onboarding"], string]> = [
  ["loggedWeight", "Weight"],
  ["tickedMeal", "Meal"],
  ["bookedCall", "Call"],
  ["joinedGroup", "Group"],
];

export default function CoachingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CoachingTab>("attention");

  const [flagged, setFlagged] = useState<FlaggedClient[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewClient[]>([]);
  const [onboardingQueue, setOnboardingQueue] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();
  const canSeeContact = hasPermission("view_contact_info");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "onboarding" || requestedTab === "review" || requestedTab === "attention") {
      setTab(requestedTab);
    }
  }, []);

  const dismissFlag = async (clientId: string, flagType: string) => {
    try {
      await api.post(`/clients/${clientId}/dismiss-flag`, { flagType });
      fetchData();
    } catch {}
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [attentionRes, reviewRes, onboardingRes] = await Promise.all([
        api.get<{ results: FlaggedClient[] }>("/clients/queue/needs-attention"),
        api.get<{ clients: ReviewClient[] }>("/clients/queue/review"),
        api.get<OnboardingResponse>("/staff/onboarding"),
      ]);
      setFlagged(attentionRes.results || []);
      setReviewQueue(reviewRes.clients || []);
      setOnboardingQueue(onboardingRes.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => fetchData(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") fetchData(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchData]);

  const flagAdvice = (type: string) =>
    type.includes("missed") ? "they've been missing their daily logs — a quick nudge usually fixes it"
    : type.includes("weight") ? "their weight is trending the wrong way — review their meal plan on a 2-min call"
    : (type.includes("workout") || type.includes("adherence")) ? "their workout adherence is dropping — send a motivational voice note"
    : "they need a quick check-in";

  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const stalledOnboarding = onboardingQueue.filter((item) => {
    const days = item.daysSinceActivation || 0;
    return item.onboardingStatus !== "complete" && ((item.completedSteps === 0 && days >= 1) || (item.completedSteps > 0 && days >= 3));
  });

  const tickerItems = (() => {
    if (loading) return ["Reading the coaching queue…"];
    const items: string[] = [];

    if (tab === "attention") {
      if (flagged.length === 0) {
        items.push("coaching queue is clear right now — nobody needs attention and no check-ins are overdue");
      } else {
        items.push(flagged.length + " client" + (flagged.length === 1 ? "" : "s") + " need" + (flagged.length === 1 ? "s" : "") + " attention right now: " + nameList(flagged.map((x) => x.client.fullName)));
        flagged.slice(0, 2).forEach(({ client, flags }) => {
          if (flags.length > 0) items.push(client.fullName + " — " + flagAdvice(flags[0].type));
        });
      }
    } else if (tab === "review") {
      if (reviewQueue.length === 0) {
        items.push("everyone has been checked in recently — the review queue is empty");
      } else {
        items.push(reviewQueue.length + " client" + (reviewQueue.length === 1 ? "" : "s") + " due for a check-in: " + nameList(reviewQueue.map((c) => c.fullName)));
        items.push("a 2-min call or WhatsApp message keeps them accountable and on track");
      }
    } else {
      if (stalledOnboarding.length === 0) {
        items.push("no activated clients are currently stalled in onboarding");
      } else {
        items.push(stalledOnboarding.length + " client" + (stalledOnboarding.length === 1 ? " is" : "s are") + " stalled in onboarding: " + nameList(stalledOnboarding.map((item) => item.fullName)));
        items.push("start with anyone who has completed 0 steps or has been active for 7+ days");
      }
    }

    return items;
  })();

  const selectTab = (next: CoachingTab) => {
    setTab(next);
    router.replace(next === "attention" ? "/dashboard/coaching" : `/dashboard/coaching?tab=${next}`, { scroll: false });
  };

  return (
    <div>
      <PageTicker items={tickerItems} />

      <h1 className="text-2xl font-medium text-white">Coaching</h1>
      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Clients who need attention, a check-in, or help completing onboarding.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => selectTab("attention")}
          className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium sm:min-h-0 ${
            tab === "attention" ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
          }`}
        >
          <AlertTriangle size={14} /> Needs attention ({flagged.length})
        </button>
        <button
          onClick={() => selectTab("review")}
          className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium sm:min-h-0 ${
            tab === "review" ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
          }`}
        >
          <ClipboardCheck size={14} /> Due for check-in ({reviewQueue.length})
        </button>
        <button
          onClick={() => selectTab("onboarding")}
          className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium sm:min-h-0 ${
            tab === "onboarding" ? "bg-[#0d9488] text-white" : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
          }`}
        >
          <Rocket size={14} /> Onboarding ({stalledOnboarding.length})
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</p>
        ) : tab === "attention" ? (
          flagged.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--theme-text-secondary)]">No clients currently flagged. Nice work.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map(({ client, flags }) => (
                    <tr key={client._id} onClick={() => router.push(`/dashboard/clients/${client._id}`)} className="cursor-pointer border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-surface-hover)]">
                      <td className="px-4 py-3">
                        <div className="text-white">{client.fullName}</div>
                        {canSeeContact && <div className="text-xs text-[var(--theme-text-secondary)]">{client.email}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--theme-text-secondary)]">{client.program}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {flags.map((f, i) => (
                            <span key={i} title={f.detail} className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                              {FLAG_LABELS[f.type] || f.type}
                              <button onClick={(e) => { e.stopPropagation(); dismissFlag(client._id, f.type); }} className="ml-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300 sm:min-h-0 sm:min-w-0" title="Dismiss this flag for 7 days"></button>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "review" ? (
          reviewQueue.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--theme-text-secondary)]">Everyone&apos;s been checked in recently.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Last check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewQueue.map((c) => (
                    <tr key={c._id} onClick={() => router.push(`/dashboard/clients/${c._id}`)} className="cursor-pointer border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-surface-hover)]">
                      <td className="px-4 py-3">
                        <div className="text-white">{c.fullName}</div>
                        {canSeeContact && <div className="text-xs text-[var(--theme-text-secondary)]">{c.email}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--theme-text-secondary)]">{c.program}</td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{c.lastReviewedAt ? new Date(c.lastReviewedAt).toLocaleDateString() : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : stalledOnboarding.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--theme-text-secondary)]">No clients are currently stalled in onboarding.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Steps</th>
                  <th className="px-4 py-3 font-medium">Days active</th>
                  <th className="px-4 py-3 font-medium">Coach</th>
                </tr>
              </thead>
              <tbody>
                {stalledOnboarding
                  .slice()
                  .sort((a, b) => (b.daysSinceActivation || 0) - (a.daysSinceActivation || 0))
                  .map((item) => (
                    <tr key={item._id} onClick={() => router.push(`/dashboard/clients/${item._id}`)} className="cursor-pointer border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-surface-hover)]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.fullName}</div>
                        <div className="text-xs capitalize text-[var(--theme-text-secondary)]">{item.program}</div>
                        {canSeeContact && <div className="text-xs text-[var(--theme-text-muted)]">{item.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                            <div className="h-full rounded-full bg-[#0d9488]" style={{ width: `${item.progressPercent}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-white">{item.completedSteps}/{item.totalSteps}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ONBOARDING_LABELS.map(([key, label]) => (
                            <span key={key} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.onboarding[key] ? "bg-emerald-400/10 text-emerald-300" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)]"}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{item.daysSinceActivation ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{item.assignedCoach?.name || "Unassigned"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
