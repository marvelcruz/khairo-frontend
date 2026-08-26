"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  RefreshCw,
  Search,
  UserRoundCheck,
} from "lucide-react";
import { api } from "@/lib/api";

type Person = {
  _id: string;
  name: string;
};

type OnboardingSteps = {
  loggedWeight: boolean;
  tickedMeal: boolean;
  bookedCall: boolean;
  joinedGroup: boolean;
};

type OnboardingItem = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  program?: string;
  cycleWeeks?: number;
  programStartedAt?: string;
  programEndsAt?: string;
  portalActive?: boolean;
  accountStage?: string;
  assignedCoach?: Person | null;
  assignedDoctor?: Person | null;
  onboarding: OnboardingSteps;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  onboardingStatus: "not_started" | "in_progress" | "complete";
  daysSinceActivation: number | null;
};

type QueueResponse = {
  success: boolean;
  count: number;
  items: OnboardingItem[];
};

type Filter = "all" | OnboardingItem["onboardingStatus"];

const STEP_LABELS: Array<{
  key: keyof OnboardingSteps;
  label: string;
}> = [
  { key: "loggedWeight", label: "Logged starting weight" },
  { key: "tickedMeal", label: "Completed first meal action" },
  { key: "bookedCall", label: "Booked onboarding call" },
  { key: "joinedGroup", label: "Joined support group" },
];

function humanize(value?: string) {
  if (!value) return "Not set";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: OnboardingItem["onboardingStatus"]) {
  if (status === "complete") return "Complete";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function statusClass(status: OnboardingItem["onboardingStatus"]) {
  if (status === "complete") return "bg-emerald-500/10 text-emerald-400";
  if (status === "in_progress") return "bg-amber-500/10 text-amber-400";
  return "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]";
}

export default function StaffOnboardingPage() {
  const router = useRouter();
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const loadQueue = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      setError("");
      const response = await api.get<QueueResponse>("/staff/onboarding");
      setItems(response.items || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the onboarding queue."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      not_started: items.filter((item) => item.onboardingStatus === "not_started").length,
      in_progress: items.filter((item) => item.onboardingStatus === "in_progress").length,
      complete: items.filter((item) => item.onboardingStatus === "complete").length,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      if (filter !== "all" && item.onboardingStatus !== filter) return false;
      if (!term) return true;

      return [
        item.fullName,
        item.email,
        item.phone,
        item.program,
        item.assignedCoach?.name,
        item.assignedDoctor?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [filter, items, search]);

  const filterButtons: Array<{
    key: Filter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "not_started", label: "Not started", count: counts.not_started },
    { key: "in_progress", label: "In progress", count: counts.in_progress },
    { key: "complete", label: "Complete", count: counts.complete },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0d9488]">
            Client activation
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Onboarding</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--theme-text-secondary)]">
            Track activated clients from payment completion through their first onboarding actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQueue(true)}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Activated" value={counts.all} icon={<UserRoundCheck size={18} />} />
        <SummaryCard label="Not started" value={counts.not_started} icon={<Circle size={18} />} />
        <SummaryCard label="In progress" value={counts.in_progress} icon={<Clock3 size={18} />} />
        <SummaryCard label="Complete" value={counts.complete} icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((button) => (
              <button
                key={button.key}
                type="button"
                onClick={() => setFilter(button.key)}
                className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                  filter === button.key
                    ? "bg-[#0d9488] text-white"
                    : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
                }`}
              >
                {button.label} · {button.count}
              </button>
            ))}
          </div>

          <div className="flex min-h-10 w-full items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 lg:max-w-sm">
            <Search size={15} className="shrink-0 text-[var(--theme-text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search onboarding clients"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center text-sm text-[var(--theme-text-secondary)]">
          Loading onboarding clients…
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center">
          <CheckCircle2 size={28} className="mx-auto text-[var(--theme-text-muted)]" />
          <p className="mt-3 text-sm font-semibold text-white">No clients in this view</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
            Change the filter or search to see another onboarding group.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-white">
                      {item.fullName}
                    </h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.onboardingStatus)}`}>
                      {statusLabel(item.onboardingStatus)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--theme-text-secondary)]">
                    <span>{humanize(item.program)}</span>
                    <span>
                      Activated {item.daysSinceActivation === null ? "date unavailable" : item.daysSinceActivation === 0 ? "today" : `${item.daysSinceActivation} day${item.daysSinceActivation === 1 ? "" : "s"} ago`}
                    </span>
                    <span>Ends {formatDate(item.programEndsAt)}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-white">Onboarding progress</span>
                      <span className="text-[var(--theme-text-secondary)]">
                        {item.completedSteps}/{item.totalSteps} · {item.progressPercent}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                      <div
                        className="h-full rounded-full bg-[#0d9488] transition-[width]"
                        style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {STEP_LABELS.map((step) => {
                      const complete = item.onboarding[step.key];
                      return (
                        <div
                          key={step.key}
                          className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 py-2.5 text-xs"
                        >
                          {complete ? (
                            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                          ) : (
                            <Circle size={15} className="shrink-0 text-[var(--theme-text-muted)]" />
                          )}
                          <span className={complete ? "text-white" : "text-[var(--theme-text-secondary)]"}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid shrink-0 gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-page)] p-3 text-xs sm:grid-cols-2 xl:w-72 xl:grid-cols-1">
                  <div>
                    <p className="text-[var(--theme-text-muted)]">Coach</p>
                    <p className="mt-1 font-medium text-white">
                      {item.assignedCoach?.name || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--theme-text-muted)]">Doctor</p>
                    <p className="mt-1 font-medium text-white">
                      {item.assignedDoctor?.name || "Not assigned"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/clients/${item._id}`)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white transition hover:bg-[#d6007f] sm:col-span-2 xl:col-span-1"
                  >
                    Open client <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--theme-text-secondary)]">{label}</p>
        <span className="text-[var(--theme-text-muted)]">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
