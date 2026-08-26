"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { canAccessRoute } from "../../../lib/accessControl";
import { api } from "../../../lib/api";

type ReadinessCheck = {
  key: string;
  label: string;
  count: number;
  severity: "urgent" | "warning" | "info";
  href: string;
  description: string;
  clear: boolean;
};

type ConfigurationCheck = {
  key: string;
  label: string;
  configured: boolean;
  critical: boolean;
};

type ReadinessResponse = {
  success: boolean;
  generatedAt: string;
  status: "ready" | "watch" | "attention";
  summary: {
    activeClients: number;
    blockingCount: number;
    warningCount: number;
  };
  system: {
    databaseReady: boolean;
    emailConfigured: boolean;
    uptimeSeconds: number;
    criticalConfigurationMissing: number;
    configuration: ConfigurationCheck[];
  };
  checks: ReadinessCheck[];
};

const STATUS_COPY = {
  ready: {
    title: "Operationally ready",
    body: "No urgent or warning conditions are currently blocking the core client journey.",
    className: "border-emerald-600/20 bg-emerald-400/[0.05] text-emerald-300",
    icon: CheckCircle2,
  },
  watch: {
    title: "Ready with items to watch",
    body: "Core systems are available, but there are operational items that should be cleared.",
    className: "border-amber-400/20 bg-amber-400/[0.05] text-amber-300",
    icon: AlertTriangle,
  },
  attention: {
    title: "Attention required",
    body: "One or more urgent operational conditions should be resolved before relying on the affected workflow.",
    className: "border-rose-400/20 bg-rose-400/[0.05] text-rose-300",
    icon: ShieldAlert,
  },
} as const;

function severityClass(severity: ReadinessCheck["severity"]) {
  if (severity === "urgent") return "border-rose-400/20 bg-rose-400/[0.05] text-rose-300";
  if (severity === "warning") return "border-amber-400/20 bg-amber-400/[0.05] text-amber-300";
  return "border-sky-400/20 bg-sky-400/[0.05] text-sky-300";
}

function formatUptime(seconds: number) {
  const minutes = Math.floor(Number(seconds || 0) / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function LaunchReadinessPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get<ReadinessResponse>("/reports/launch-readiness");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load launch readiness.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 45000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-[var(--theme-text-secondary)]">
        Reading launch readiness…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-rose-400/20 bg-rose-400/[0.04] p-6 text-sm text-rose-300">
        {error || "Could not load launch readiness."}
      </div>
    );
  }

  const status = STATUS_COPY[data.status];
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#ff76c5]">
            <Activity size={14} /> Operations
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Launch Readiness</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--theme-text-secondary)]">
            A focused check of conditions that could interrupt the real lead-to-client journey today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-xs font-semibold text-white hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <section className={`rounded-2xl border p-5 sm:p-6 ${status.className}`}>
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-black/10">
            <StatusIcon size={19} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">{status.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--theme-text-secondary)]">{status.body}</p>
            <p className="mt-2 text-[11px] text-[var(--theme-text-muted)]">
              Last checked {new Date(data.generatedAt).toLocaleString()} · API uptime {formatUptime(data.system.uptimeSeconds)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Active clients", data.summary.activeClients],
          ["Urgent items", data.summary.blockingCount],
          ["Warnings", data.summary.warningCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
            <p className="text-xs font-medium text-[var(--theme-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">Core system readiness</h2>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Configuration status only — secret values are never displayed.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
            <span className="flex items-center gap-2 text-sm text-[var(--theme-text-secondary)]"><Database size={15} /> Database</span>
            <span className={data.system.databaseReady ? "text-xs font-semibold text-emerald-300" : "text-xs font-semibold text-rose-300"}>
              {data.system.databaseReady ? "Connected" : "Unavailable"}
            </span>
          </div>
          {data.system.configuration.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--theme-text-secondary)]">{item.label}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--theme-text-muted)]">
                  {item.critical ? "Core" : "Optional integration"}
                </p>
              </div>
              <span className={item.configured ? "shrink-0 text-xs font-semibold text-emerald-300" : item.critical ? "shrink-0 text-xs font-semibold text-rose-300" : "shrink-0 text-xs font-semibold text-amber-300"}>
                {item.configured ? "Configured" : "Missing"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">Operational checks</h2>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Counts only. Medical review details remain inside the clinical workspace.</p>
        </div>
        <div className="space-y-3">
          {data.checks.map((item) => {
            const permissionPath = item.href ? item.href.split("?")[0] : "";
            const canOpen = Boolean(permissionPath && canAccessRoute(user, permissionPath));
            return (
              <div key={item.key} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.clear ? "border-emerald-600/20 bg-emerald-400/[0.05] text-emerald-300" : severityClass(item.severity)}`}>
                        {item.clear ? "Clear" : `${item.count} ${item.severity}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--theme-text-secondary)]">{item.description}</p>
                  </div>
                  {!item.clear && canOpen && (
                    <Link
                      href={item.href}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white"
                    >
                      Open <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
