"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, AlertTriangle, Download } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import { api } from "../../../lib/api";

type MonthlyRev = { label: string; total: number };
type ExpiringSub = {
  _id: string;
  client?: { fullName: string; email: string; phone?: string };
  currentPeriodEnd: string;
  status: string;
};

type RevenueData = {
  currentMonthRevenue: number;
  monthlyRevenue: MonthlyRev[];
  activeSubscriptions: number;
  expiringThisWeek: ExpiringSub[];
};

type StaffPerformance = {
  id: string;
  name: string;
  total: number;
  sales: number;
  sessions: number;
  money: number;
};

type StaffPerformanceResponse = {
  staff?: StaffPerformance[];
};

type RetentionMetric = Record<string, number>;

type KpiData = {
  conversion: {
    applied: number;
    contacted: number;
    approved: number;
    paid: number;
    enrolled: number;
  };
  retention: {
    day30: RetentionMetric;
    day60: RetentionMetric;
    day90: RetentionMetric;
  };
  ltv: number;
};

type GoalResponse = {
  target?: number;
};

type LeadSourceReport = {
  success: boolean;
  sources: Array<{
    source: string;
    totalContacts: number;
    clientContacts: number;
    applicantContacts: number;
    openOpportunities: number;
    qualifiedPlus: number;
    conversionRate: number;
  }>;
};

type PipelineReport = {
  success: boolean;
  stages: string[];
  totalOpportunities: number;
  currentCounts: Record<string, number>;
  conversion: Record<string, number>;
  timeInStageDays: Record<string, number>;
  sources: Array<{ _id: string; count: number }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ReportsPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("financial");
  const [reportRange, setReportRange] = useState("this_month");
  const [reportFormat, setReportFormat] = useState<"csv" | "xlsx">("csv");

  const [goal, setGoal] = useState(0);
  const [staffPerf, setStaffPerf] = useState<StaffPerformance[] | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineReport | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSourceReport | null>(null);

  const loadAll = (silent = false) => {
    if (!silent) setLoading(true);
    return Promise.allSettled([
      api.get<RevenueData>("/reports/revenue"),
      api.get<GoalResponse>("/reports/goal"),
      api.get<StaffPerformanceResponse>("/reports/staff-performance?days=7"),
      api.get<KpiData>("/reports/kpis"),
      api.get<PipelineReport>("/reports/pipeline"),
      api.get<LeadSourceReport>("/reports/lead-sources"),
    ]).then(
      ([rev, g, perf, kpiRes, pipelineRes, leadSourcesRes]) => {
        if (rev.status === "fulfilled") setData(rev.value);
        if (g.status === "fulfilled") setGoal(g.value.target || 0);
        if (perf.status === "fulfilled") setStaffPerf(perf.value.staff || []);
        if (kpiRes.status === "fulfilled") setKpis(kpiRes.value);
        if (pipelineRes.status === "fulfilled") setPipeline(pipelineRes.value);
        if (leadSourcesRes.status === "fulfilled") setLeadSources(leadSourcesRes.value);
        if (!silent) setLoading(false);
      }
    );
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => loadAll(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") loadAll(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("khairo_staff_token");
      const params = new URLSearchParams({
        type: reportType,
        range: reportRange,
        format: reportFormat,
      });

      const res = await fetch(`${API_BASE}/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `khairo-${reportType}-${new Date().toISOString().slice(0, 10)}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not export report.");
    } finally {
      setExporting(false);
    }
  };



  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    const items: string[] = [];

    if (!data) return ["reading financial data…"];

    const revenue = data.currentMonthRevenue || 0;
    const months = data.monthlyRevenue || [];
    const thisMonth = months[months.length - 1];
    const lastMonth = months[months.length - 2];
    const maxMonth = months.reduce((m, x) => (x.total > m.total ? x : m), { total: 0, label: "" });

    if (revenue > 0) {
      items.push("this month you have collected ₦" + revenue.toLocaleString());
      if (lastMonth && lastMonth.total > 0) {
        const change = Math.round(((revenue - lastMonth.total) / lastMonth.total) * 100);
        items.push(
          change > 0 ? "that is up " + change + "% vs last month — keep the streak going"
          : change < 0 ? "that is down " + Math.abs(change) + "% vs last month — worth checking the pipeline"
          : "same as last month — steady"
        );
      }
      if (maxMonth.label === thisMonth.label && months.filter((m) => m.total > 0).length > 1) {
        items.push("this is the strongest month in the last six — momentum is building");
      }
    } else {
      items.push("no revenue collected yet this month — the pipeline needs attention");
      const zeroMonths = months.filter((m) => m.total === 0).length;
      if (zeroMonths >= 3) {
        items.push(zeroMonths + " of the last 6 months were quiet — the sales motion needs a restart");
      }
    }

    if (goal > 0) {
      const pct = Math.min(100, Math.round((revenue / goal) * 100));
      const remaining = Math.max(0, goal - revenue);
      items.push(
        pct >= 100 ? "monthly goal of ₦" + goal.toLocaleString() + " is already hit — great month"
        : pct + "% of the ₦" + goal.toLocaleString() + " monthly goal reached, ₦" + remaining.toLocaleString() + " to go"
      );
    }

    items.push(
      data.activeSubscriptions === 0
        ? "no active subscriptions right now — recurring revenue is off"
        : data.activeSubscriptions + " active subscription" + (data.activeSubscriptions === 1 ? "" : "s") + " keep recurring revenue alive"
    );

    if (data.expiringThisWeek.length === 0) {
      items.push("no renewals expiring in the next 7 days — income is predictable, no renewal calls needed this week");
    } else {
      const names = data.expiringThisWeek.map((s) => s.client?.fullName || "Unknown").filter(Boolean);
      items.push(
        data.expiringThisWeek.length + " renewal" + (data.expiringThisWeek.length === 1 ? "" : "s") + " due this week: " +
        nameList(names) + " — send the renewal link before the subscription lapses"
      );
    }

    if (kpis && kpis.conversion && kpis.conversion.applied > 0) {
      const convRate = Math.round((kpis.conversion.enrolled / kpis.conversion.applied) * 100);
      items.push(
        "enrollment funnel: " + kpis.conversion.applied + " applied, " + kpis.conversion.paid + " paid, " + kpis.conversion.enrolled + " enrolled — " + convRate + "% apply-to-enrolled"
      );
    }

    if (staffPerf && staffPerf.length > 0) {
      const top = staffPerf[0];
      items.push("top performer this week: " + top.name + " (" + top.total + " signed actions)");
    }

    return items;
  })();

    if (loading) return <div className="grid min-h-[50vh] place-items-center text-[var(--theme-text-secondary)]">Loading reports…</div>;
  if (!data) return <div className="grid min-h-[50vh] place-items-center text-red-400">Could not load reports.</div>;

  const revenue = data.currentMonthRevenue || 0;
  const maxRev = Math.max(...data.monthlyRevenue.map((m) => m.total), 1);

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Revenue</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Financial overview and subscription health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="h-10 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs text-white outline-none"
          >
            <option value="financial">Financial</option>
            <option value="clients">Clients</option>
            <option value="sales">Sales</option>
            <option value="retention">Retention</option>
            <option value="program_performance">Program Performance</option>
            <option value="staff_performance">Staff Performance</option>
            <option value="marketing_attribution">Marketing Attribution</option>
          </select>

          <select
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            className="h-10 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs text-white outline-none"
          >
            <option value="today">Today</option>
            <option value="this_week">This week</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value as "csv" | "xlsx")}
            className="h-10 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs text-white outline-none"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </select>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <span className="text-sm text-[var(--theme-text-secondary)]">Revenue (This Month)</span>
            <DollarSign size={18} className="text-[#0d9488]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">₦{revenue.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <span className="text-sm text-[var(--theme-text-secondary)]">Active Subscriptions</span>
            <Users size={18} className="text-green-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{data.activeSubscriptions}</p>
        </div>

        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <span className="text-sm text-[var(--theme-text-secondary)]">Expiring (Next 7 Days)</span>
            <AlertTriangle size={18} className="text-yellow-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{data.expiringThisWeek.length}</p>
        </div>
      </div>

      <div className="mt-6">
        {/* 6-Month Revenue Chart */}
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6 lg:col-span-2">
          <h3 className="mb-6 text-sm font-medium text-white">Revenue (Last 6 Months)</h3>
          <div className="flex flex-wrap h-48 items-end gap-3">
            {data.monthlyRevenue.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative mx-auto h-40 w-10 rounded-t bg-[var(--theme-surface-soft)]">
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-[#0d9488] transition-all duration-500"
                    style={{ height: `${(m.total / maxRev) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium uppercase text-[var(--theme-text-secondary)]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      {kpis && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-medium text-white">Conversion Funnel</h3>
            <div className="space-y-2">
              {[
                { label: "Applied", n: kpis.conversion.applied },
                { label: "Contacted", n: kpis.conversion.contacted },
                { label: "Approved", n: kpis.conversion.approved },
                { label: "Paid", n: kpis.conversion.paid },
                { label: "Enrolled", n: kpis.conversion.enrolled },
              ].map((step) => (
                <div key={step.label} className="flex flex-wrap gap-3 items-center justify-between">
                  <span className="text-sm text-[var(--theme-text-secondary)]">{step.label}</span>
                  <span className="font-mono text-sm font-bold text-white">{step.n}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--theme-text-secondary)]">
              {kpis.conversion.applied ? Math.round((kpis.conversion.enrolled / kpis.conversion.applied) * 100) : 0}% apply → enrolled
            </p>
          </div>

          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-medium text-white">Retention</h3>
            <div className="space-y-3">
              {[
                { label: "30-day", data: kpis.retention.day30 },
                { label: "60-day", data: kpis.retention.day60 },
                { label: "90-day", data: kpis.retention.day90 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-1">
                    <span className="text-xs text-[var(--theme-text-secondary)]">{r.label}</span>
                    <span className="text-xs font-semibold text-white">{r.data.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                    <div className="h-full rounded-full bg-[#0d9488]" style={{ width: `${r.data.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--theme-text-secondary)]">
              LTV: ₦{kpis.ltv.toLocaleString()} per client
            </p>
          </div>
        </div>
      )}

      {/* Pipeline */}
      {pipeline && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-white">Pipeline by Stage</h3>
              <span className="text-xs text-[var(--theme-text-secondary)]">
                {pipeline.totalOpportunities} total opportunities
              </span>
            </div>

            <div className="space-y-2">
              {pipeline.stages.map((stage) => {
                const current = pipeline.currentCounts[stage] || 0;
                const conversion = pipeline.conversion[stage] || 0;
                const avgDays = pipeline.timeInStageDays[stage] || 0;
                const label = stage.replaceAll("_", " ");

                return (
                  <div
                    key={stage}
                    className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium capitalize text-white">{label}</p>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--theme-text-secondary)]">
                        <span>{current} open</span>
                        <span>{conversion}% reached</span>
                        <span>{avgDays} days avg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-medium text-white">Lead Sources</h3>
            <div className="space-y-2">
              {pipeline.sources.length === 0 ? (
                <p className="text-sm italic text-[var(--theme-text-secondary)]">
                  No source data yet.
                </p>
              ) : (
                pipeline.sources.map((source) => (
                  <div
                    key={source._id || "unknown"}
                    className="flex flex-wrap items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2.5"
                  >
                    <span className="text-xs font-medium capitalize text-white">
                      {source._id || "Unknown"}
                    </span>
                    <span className="font-mono text-xs text-[var(--theme-text-secondary)]">
                      {source.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Source Performance */}
      {leadSources && leadSources.sources.length > 0 && (
        <div className="mt-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Lead Source Performance</h3>
          <div className="space-y-2">
            {leadSources.sources.map((source) => (
              <div key={source.source} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium capitalize text-white">{source.source || "Unknown"}</p>
                    <p className="text-xs text-[var(--theme-text-muted)]">
                      {source.totalContacts} total · {source.openOpportunities} open · {source.qualifiedPlus} qualified+
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{source.clientContacts} clients</p>
                    <p className="text-xs text-[var(--theme-text-muted)]">{source.conversionRate}% conversion</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Leaderboard */}
      {staffPerf && staffPerf.length > 0 && (
        <div className="mt-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Staff performance (last 7 days)</h3>
            <p className="text-xs text-[var(--theme-text-secondary)]">Signed actions per person</p>
          </div>
          <div className="space-y-2">
            {staffPerf.map((s, i) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-[#0d9488] text-white" : i === 1 ? "bg-white/20 text-white" : i === 2 ? "bg-amber-500/20 text-amber-400" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"}`}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">{s.sales} sales · {s.sessions} sessions · {s.money} money</p>
                </div>
                <span className="font-mono text-sm font-bold text-white">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      <div className="mt-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-medium text-white">Renewals Due (Next 7 Days)</h3>
        <div className="max-h-60 space-y-3 overflow-y-auto pr-2">
          {data.expiringThisWeek.length === 0 ? (
            <p className="text-sm italic text-[var(--theme-text-secondary)]">No renewals due this week.</p>
          ) : (
            data.expiringThisWeek.map((sub) => (
              <div key={sub._id} className="flex flex-wrap gap-3 items-center justify-between rounded border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                <div>
                  <p className="text-sm font-medium text-white">{sub.client?.fullName || "Unknown"}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">{sub.client?.email}</p>
                </div>
                <span className="font-mono text-xs text-yellow-400">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
