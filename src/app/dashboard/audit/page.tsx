"use client";

import { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import { api } from "../../../lib/api";

type AuditLog = {
  _id: string;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGlobalView, setIsGlobalView] = useState(false);

  const loadAll = (silent = false) => {
    if (!silent) setLoading(true);
    return api.get<{ logs?: AuditLog[]; isGlobalView?: boolean }>("/audit")
      .then((res) => {
        setLogs(res.logs || []);
        setIsGlobalView(res.isGlobalView || false);
      })
      .catch(() => setLogs([]))
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => loadAll(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") loadAll(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const classifyAction = (action: string): "routine" | "meaningful" | "sensitive" => {
    const lower = action.toLowerCase();
    if (lower.includes("login") || lower.includes("logged in") || lower.includes("viewed")) return "routine";
    if (lower.includes("permission") || lower.includes("role") || lower.includes("delete") || lower.includes("reconcil")) return "sensitive";
    if (lower.includes("update") || lower.includes("create") || lower.includes("adjust") || lower.includes("payment") || lower.includes("stock")) return "meaningful";
    return "routine";
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return diffMins + "m ago";
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + "h ago";
    const diffDays = Math.floor(diffHours / 24);
    return diffDays + "d ago";
  };

  const tickerItems = (() => {
    if (loading) return ["reading the audit trail…"];
    const items: string[] = [];

    if (logs.length === 0) {
      items.push("no activity recorded yet — the trail starts the moment someone logs in or makes a change");
      return items;
    }

    const now = new Date();
    const today = logs.filter((l) => new Date(l.createdAt).toDateString() === now.toDateString());
    const todayRoutine = today.filter((l) => classifyAction(l.action) === "routine");
    const todayMeaningful = today.filter((l) => classifyAction(l.action) === "meaningful");
    const todaySensitive = today.filter((l) => classifyAction(l.action) === "sensitive");

    items.push(
      isGlobalView
        ? logs.length + " activity entr" + (logs.length === 1 ? "y" : "ies") + " across the whole team — " + today.length + " happened today"
        : logs.length + " activity entr" + (logs.length === 1 ? "y" : "ies") + " in your trail — " + today.length + " happened today"
    );

    if (todayRoutine.length > 0 && todayMeaningful.length === 0 && todaySensitive.length === 0) {
      items.push("all activity today was routine — mostly logins and views, no real moves made");
    } else {
      items.push(
        "today's breakdown: " + todayRoutine.length + " routine, " + todayMeaningful.length + " meaningful, " + todaySensitive.length + " sensitive"
      );
    }

    if (todayMeaningful.length > 0) {
      const recent = todayMeaningful[0];
      items.push(
        "most recent meaningful move: " + recent.userName + " " + recent.action.toLowerCase() + " " + formatTime(recent.createdAt)
      );
    }

    if (todaySensitive.length > 0) {
      items.push(
        todaySensitive.length + " sensitive action" + (todaySensitive.length === 1 ? "" : "s") + " today — " +
        todaySensitive.slice(0, 2).map((l) => l.userName + ": " + l.action.toLowerCase()).join(", ") +
        " — these are exactly what the audit trail exists to catch, worth a second look"
      );
    }

    const sensitive = logs.filter((l) => classifyAction(l.action) === "sensitive");
    if (sensitive.length > 0) {
      const last = sensitive[0];
      items.push(
        "last sensitive action: " + last.userName + " " + last.action.toLowerCase() + " " + formatTime(last.createdAt)
      );
    }

    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Activity size={24} className="text-[#0d9488]" />
        <h1 className="text-2xl font-bold text-white">
          {isGlobalView ? "Global Activity Feed (Admin)" : "My Activity Feed"}
        </h1>
      </div>

      <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        {loading ? (
          <p className="text-[var(--theme-text-secondary)]">Loading activity...</p>
        ) : logs.length === 0 ? (
          <p className="text-[var(--theme-text-secondary)] italic">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log._id} className="flex min-w-0 flex-wrap gap-4 border-b border-[var(--theme-border)] pb-4 last:border-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0d9488]/10 text-[#0d9488]">
                  <Clock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 break-words text-sm text-white">
                    <span className="font-semibold">{log.userName}</span>{" "}
                    <span className="text-[var(--theme-text-secondary)]">{log.action}</span>
                    {log.details && (
                      <span className="mt-1 block max-w-full break-all whitespace-normal rounded bg-[var(--theme-surface-soft)] px-2 py-1 text-xs leading-relaxed text-[#0d9488]">
                        {log.details}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
