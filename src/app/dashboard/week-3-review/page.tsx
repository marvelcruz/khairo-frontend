"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type CoachRef = { _id: string; name: string; roles?: string[] };
type ReviewItem = {
  clientId: string;
  fullName: string;
  email?: string;
  phone?: string;
  program: string;
  assignedCoach?: CoachRef | null;
  startAt?: string;
  dueAt?: string;
  daysActive: number;
  overdueDays: number;
};

type QueueResponse = {
  success: boolean;
  count: number;
  items: ReviewItem[];
};

type Outcome = "on_track" | "needs_support" | "escalate";

const OUTCOMES: Array<{
  value: Outcome;
  label: string;
  description: string;
  tone: string;
}> = [
  {
    value: "on_track",
    label: "On track",
    description: "Progress is appropriate. Continue the current plan.",
    tone: "border-emerald-500/30 bg-emerald-600/[0.06]",
  },
  {
    value: "needs_support",
    label: "Needs support",
    description: "Record what support or follow-up is needed.",
    tone: "border-amber-500/30 bg-amber-500/[0.06]",
  },
  {
    value: "escalate",
    label: "Escalate",
    description: "Create an immediate escalation task for the care team.",
    tone: "border-rose-500/30 bg-rose-500/[0.06]",
  },
];

function humanize(value?: string) {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateLabel(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date needs correction";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Could not complete the Week 3 review.";
}

export default function Week3ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<ReviewItem | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("on_track");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get<QueueResponse>("/clients/queue/week3-review");
      setItems(response.items || []);
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

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!target) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target, saving]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.fullName, item.email, item.phone, item.program, item.assignedCoach?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, search]);

  const openReview = (item: ReviewItem) => {
    setTarget(item);
    setOutcome("on_track");
    setNotes("");
    setError("");
  };

  const saveReview = async () => {
    if (!target || saving) return;
    setSaving(true);
    setError("");

    try {
      await api.post(`/clients/${target.clientId}/week3-review`, {
        outcome,
        notes: notes.trim(),
      });
      setNotice(`${target.fullName}'s Week 3 review was completed.`);
      setTarget(null);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <header className="flex flex-col gap-3 border-b border-[var(--theme-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0d9488]">Client success</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--theme-text)]">Week 3 Reviews</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            Review active clients once they reach day 21 and route any support needs immediately.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={refreshing} onClick={() => void load(true)}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </Button>
      </header>

      {notice && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-600/[0.06] px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}
      {error && !target && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3">
          <p className="text-xs text-[var(--theme-text-muted)]">Due now</p>
          <p className="mt-0.5 text-2xl font-semibold text-[var(--theme-text)]">{items.length}</p>
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client, program, or coach"
            className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="hidden border-b border-[var(--theme-border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)] md:grid md:grid-cols-[minmax(0,2fr)_120px_160px_110px_120px_auto] md:gap-4">
          <span>Client</span><span>Program</span><span>Coach</span><span>Day</span><span>Due</span><span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading Week 3 reviews…</div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <CheckCircle2 size={26} className="mx-auto text-emerald-300" />
              <p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">No Week 3 reviews waiting</p>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{search ? "Clear the search to see all due clients." : "The queue is caught up."}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-border-soft)]">
            {visible.map((item) => (
              <article key={item.clientId} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,2fr)_120px_160px_110px_120px_auto] md:items-center md:gap-4 md:px-5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--theme-text)]">{item.fullName}</p>
                  <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">{item.email || item.phone || "No contact detail"}</p>
                </div>
                <div className="text-xs font-medium text-[var(--theme-text-secondary)]">{humanize(item.program)}</div>
                <div className="truncate text-xs text-[var(--theme-text-secondary)]">{item.assignedCoach?.name || "Unassigned"}</div>
                <div className="text-xs text-[var(--theme-text-secondary)]">Day {item.daysActive}</div>
                <div className="text-xs text-[var(--theme-text-secondary)]">
                  <span>{dateLabel(item.dueAt)}</span>
                  {item.overdueDays > 0 && <span className="mt-1 block text-[11px] text-amber-300">{item.overdueDays}d overdue</span>}
                </div>
                <div className="md:text-right">
                  <Button type="button" size="sm" onClick={() => openReview(item)}>Complete review</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {target && (
        <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/65 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setTarget(null); }}>
          <div className="my-6 w-full max-w-xl overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff7ac7]">Week 3 review</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{target.fullName}</h2>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Day {target.daysActive} · {humanize(target.program)}</p>
              </div>
              <button type="button" onClick={() => !saving && setTarget(null)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close"><X size={16} /></button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-2 sm:grid-cols-3">
                {OUTCOMES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOutcome(option.value)}
                    className={`rounded-lg border p-3 text-left transition ${outcome === option.value ? `${option.tone} ring-1 ring-[#0d9488]/40` : "border-[var(--theme-border)] bg-[var(--theme-page)] hover:bg-[var(--theme-surface-soft)]"}`}
                  >
                    <p className="text-sm font-semibold text-[var(--theme-text)]">{option.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--theme-text-muted)]">{option.description}</p>
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Notes {outcome === "on_track" ? "(optional)" : ""}</span>
                <textarea
                  rows={5}
                  maxLength={3000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Record useful context, actions, or support needed."
                  className="w-full resize-y rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]"
                />
              </label>

              {error && (
                <div className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-sm text-rose-300">{error}</div>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-[var(--theme-border)] px-5 py-4">
              <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setTarget(null)}>Cancel</Button>
              <Button type="button" size="sm" disabled={saving} onClick={() => void saveReview()}>{saving ? "Saving…" : "Complete review"}</Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
