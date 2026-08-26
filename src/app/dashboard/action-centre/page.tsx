"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";

type AlertStatus =
  | "open"
  | "resolved"
  | "dismissed";

type Severity =
  | "info"
  | "warning"
  | "urgent";

type ActionAlert = {
  _id: string;
  ruleKey: string;
  entityType: string;
  entityId: string;
  status: AlertStatus;
  severity: Severity;
  title: string;
  summary: string;
  recommendedAction: string;
  href: string;
  ageDays: number;
  thresholdDays: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string;
  slaState?: "new" | "acknowledged" | "escalated" | "breached";
  slaDueAt?: string | null;
  slaEscalationAt?: string | null;
  slaManagerEscalationAt?: string | null;
  managerEscalatedAt?: string | null;
  subject?: {
    name?: string;
    email?: string;
    phone?: string;
    context?: string;
  };
};

type Response = {
  success: boolean;
  alerts: ActionAlert[];
  stats: {
    open: number;
    urgent: number;
    warning: number;
    resolved: number;
  };
};

const box =
  "rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]";

const soft =
  "rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]";

const actionButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 text-xs font-semibold text-white transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-45";

function severityClasses(
  severity: Severity
) {
  if (severity === "urgent") {
    return {
      icon:
        "bg-rose-500/10 text-rose-300",
      badge:
        "border-rose-500/20 bg-rose-500/10 text-rose-300",
      border:
        "border-rose-500/25",
    };
  }

  if (severity === "warning") {
    return {
      icon:
        "bg-amber-500/10 text-amber-300",
      badge:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
      border:
        "border-amber-500/20",
    };
  }

  return {
    icon:
      "bg-sky-500/10 text-sky-300",
    badge:
      "border-sky-500/20 bg-sky-500/10 text-sky-300",
    border:
      "border-sky-500/20",
  };
}

function niceDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString();
}

export default function ActionCentrePage() {
  const [data, setData] =
    useState<Response | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [tab, setTab] =
    useState<"open" | "resolved">(
      "open"
    );

  const load = useCallback(
    async () => {
      try {
        setError("");

        const response =
          await api.get<Response>(
            "/action-centre",
            {
              timeoutMs: 15000,
            }
          );

        setData(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Action Centre."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visible =
    useMemo(() => {
      const alerts =
        data?.alerts || [];

      return alerts
        .filter((alert) =>
          tab === "open"
            ? alert.status ===
              "open"
            : alert.status ===
              "resolved"
        )
        .sort((a, b) => {
          const rank = {
            urgent: 3,
            warning: 2,
            info: 1,
          };

          const severity =
            rank[b.severity] -
            rank[a.severity];

          if (severity !== 0) {
            return severity;
          }

          return (
            new Date(
              b.lastDetectedAt
            ).getTime() -
            new Date(
              a.lastDetectedAt
            ).getTime()
          );
        });
    }, [data, tab]);

  async function runScan() {
    try {
      setBusy(true);
      setError("");

      await api.post(
        "/action-centre/scan",
        {}
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not run Action Centre scan."
      );
    } finally {
      setBusy(false);
    }
  }

  async function resolve(
    alert: ActionAlert
  ) {
    try {
      setBusy(true);
      setError("");

      await api.patch(
        `/action-centre/${alert._id}/resolve`,
        {
          note:
            "Marked resolved from Action Centre.",
        }
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resolve alert."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 p-6 text-sm text-[var(--theme-text-muted)]">
        <Loader2
          size={16}
          className="animate-spin"
        />
        Loading Action Centre...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#ff76c5]">
            <Activity size={14} />
            Operations
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--theme-text)]">
            Action Centre
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--theme-text-muted)]">
            KhairoDietClinic watches for work
            that is overdue, stuck or
            needs human attention and
            tells the team what to do
            next.
          </p>
        </div>

        <button
          className={actionButton}
          disabled={busy}
          onClick={() =>
            void runScan()
          }
        >
          {busy ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <RefreshCw
              size={14}
            />
          )}
          Run scan now
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${box} p-4`}>
          <Activity
            size={18}
            className="text-[#0d9488]"
          />

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
            Open
          </p>

          <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">
            {data?.stats.open || 0}
          </p>
        </div>

        <div className={`${box} p-4`}>
          <ShieldAlert
            size={18}
            className="text-rose-300"
          />

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
            Urgent
          </p>

          <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">
            {data?.stats.urgent || 0}
          </p>
        </div>

        <div className={`${box} p-4`}>
          <AlertTriangle
            size={18}
            className="text-amber-300"
          />

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
            Warning
          </p>

          <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">
            {data?.stats.warning || 0}
          </p>
        </div>

        <div className={`${box} p-4`}>
          <CheckCircle2
            size={18}
            className="text-emerald-300"
          />

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
            Resolved
          </p>

          <p className="mt-1 text-2xl font-semibold text-[var(--theme-text)]">
            {data?.stats.resolved || 0}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() =>
            setTab("open")
          }
          className={
            tab === "open"
              ? "rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white"
              : "rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)]"
          }
        >
          Needs attention
        </button>

        <button
          onClick={() =>
            setTab("resolved")
          }
          className={
            tab === "resolved"
              ? "rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white"
              : "rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)]"
          }
        >
          Resolved
        </button>
      </div>

      <section className="space-y-3">
        {visible.length === 0 && (
          <div className={`${box} py-16 text-center`}>
            <CheckCircle2
              size={28}
              className="mx-auto text-emerald-300/70"
            />

            <p className="mt-3 text-sm font-medium text-[var(--theme-text)]">
              {tab === "open"
                ? "Nothing needs attention right now."
                : "No resolved alerts yet."}
            </p>

            {tab === "open" && (
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                Action Centre will keep
                watching the business.
              </p>
            )}
          </div>
        )}

        {visible.map((alert) => {
          const style =
            severityClasses(
              alert.severity
            );

          return (
            <article
              key={alert._id}
              className={`${box} ${style.border} overflow-hidden`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.icon}`}
                    >
                      {alert.severity ===
                      "urgent" ? (
                        <ShieldAlert
                          size={18}
                        />
                      ) : (
                        <AlertTriangle
                          size={18}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[var(--theme-text)]">
                          {alert.title}
                        </h2>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${style.badge}`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)]">
                        {alert.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {alert.href && (
                      <a
                        href={alert.href}
                        className={actionButton}
                      >
                        Open request
                        <ExternalLink
                          size={13}
                        />
                      </a>
                    )}

                    {alert.status ===
                      "open" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void resolve(
                            alert
                          )
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] disabled:opacity-40"
                      >
                        <CheckCircle2
                          size={13}
                        />
                        Mark resolved
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <div className={`${soft} p-4`}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text)]">
                      <UserRound
                        size={14}
                        className="text-[#0d9488]"
                      />
                      Applicant Information
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <p className="font-semibold text-[var(--theme-text)]">
                        {alert.subject
                          ?.name ||
                          "Unknown applicant"}
                      </p>

                      {alert.subject
                        ?.email && (
                        <p className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
                          <Mail
                            size={13}
                            className="shrink-0"
                          />
                          {
                            alert.subject
                              .email
                          }
                        </p>
                      )}

                      {alert.subject
                        ?.phone && (
                        <p className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
                          <Phone
                            size={13}
                            className="shrink-0"
                          />
                          {
                            alert.subject
                              .phone
                          }
                        </p>
                      )}

                      {alert.subject
                        ?.context && (
                        <p className="text-xs text-[var(--theme-text-muted)]">
                          {
                            alert.subject
                              .context
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`${soft} p-4`}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--theme-text)]">
                      <Clock3
                        size={14}
                        className="text-[#0d9488]"
                      />
                      Recommended next action
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--theme-text-secondary)]">
                      {
                        alert.recommendedAction
                      }
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--theme-border)] pt-3 text-[10px] text-[var(--theme-text-muted)]">
                      <span>
                        Pending:{" "}
                        {alert.ageDays} days
                      </span>

                      <span>
                        Detected:{" "}
                        {niceDate(
                          alert.firstDetectedAt
                        )}
                      </span>

                      {alert.resolvedAt && (
                        <span>
                          Resolved:{" "}
                          {niceDate(
                            alert.resolvedAt
                          )}
                        </span>
                      )}
                    </div>

                    {alert.slaState && (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[10px] text-zinc-400">
                        <span className={`mr-2 rounded-full px-2 py-0.5 font-semibold ${
                          alert.slaState === "breached"
                            ? "bg-amber-500/10 text-amber-300"
                            : alert.slaState === "escalated"
                              ? "bg-rose-500/10 text-rose-300"
                              : "bg-sky-500/10 text-sky-300"
                        }`}>
                          SLA: {alert.slaState.replaceAll("_", " ")}
                        </span>
                        <span className="mr-3">Due: {niceDate(alert.slaDueAt)}</span>
                        <span className="mr-3">Escalate: {niceDate(alert.slaEscalationAt)}</span>
                        {alert.managerEscalatedAt && <span>Manager: {niceDate(alert.managerEscalatedAt)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
