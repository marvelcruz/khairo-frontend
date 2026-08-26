"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type App = {
  status?: string;
  createdAt?: string;
};

type Payment = {
  amount?: number;
  status?: string;
  paidAt?: string;
};

type KpiConversion = {
  applied: number;
  contacted: number;
  approved: number;
  paid: number;
  enrolled: number;
};

export default function PipelineFunnel() {
  const [apps, setApps] = useState<App[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kpis, setKpis] = useState<KpiConversion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [applicationData, paymentData, kpiData] =
          await Promise.all([
            api.get<{ applications?: App[] }>("/applications?limit=100"),
            api.get<{ payments?: Payment[] }>("/reports/payments?limit=200"),
            api.get<{ conversion?: KpiConversion }>("/reports/kpis"),
          ]);

        if (!mounted) return;

        setApps(applicationData.applications || []);
        setPayments(paymentData.payments || []);
        setKpis(kpiData.conversion || null);
      } catch (err) {
        console.error("Pipeline load failed:", err);

        if (mounted) {
          setApps([]);
          setPayments([]);
          setKpis(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;

  const pending = apps.filter(
    (app) => app.status === "pending"
  );

  const inConversation = apps.filter(
    (app) => app.status === "contacted"
  );

  const approvedWaiting = apps.filter(
    (app) => app.status === "approved"
  );

  const declined = apps.filter(
    (app) => app.status === "declined"
  );

  const avgWaitHours = pending.length
    ? Math.round(
        pending.reduce(
          (sum, app) =>
            sum +
            (
              now -
              new Date(
                app.createdAt || now
              ).getTime()
            ),
          0
        ) /
          pending.length /
          3600000
      )
    : 0;

  const collected7d = payments
    .filter(
      (payment) =>
        payment.status === "success" &&
        new Date(
          payment.paidAt || 0
        ).getTime() >= weekAgo
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const stats = [
    {
      label: "Applications waiting",
      value: String(pending.length),
      accent:
        pending.length > 0
          ? "text-yellow-400"
          : "text-white",
    },
    {
      label: "Avg wait",
      value:
        pending.length === 0
          ? "—"
          : avgWaitHours < 48
            ? `${avgWaitHours}h`
            : `${Math.round(
                avgWaitHours / 24
              )}d`,
      accent: "text-white",
    },
    {
      label: "In conversation",
      value: String(
        inConversation.length
      ),
      accent: "text-blue-400",
    },
    {
      label: "Approved waiting",
      value: String(
        approvedWaiting.length
      ),
      accent: "text-white",
    },
    {
      label: "Enrolled",
      value: String(
        kpis?.enrolled ?? 0
      ),
      accent: "text-green-400",
    },
    {
      label: "Collected (7d)",
      value:
        `₦${collected7d.toLocaleString()}`,
      accent: "text-[#0d9488]",
    },
  ];

  const funnel = [
    {
      label: "Applied",
      n: kpis?.applied ?? 0,
    },
    {
      label: "Contacted",
      n: kpis?.contacted ?? 0,
    },
    {
      label: "Approved",
      n: kpis?.approved ?? 0,
    },
    {
      label: "Paid",
      n: kpis?.paid ?? 0,
    },
    {
      label: "Enrolled",
      n: kpis?.enrolled ?? 0,
    },
  ];

  const conversion =
    kpis?.applied
      ? Math.round(
          (
            (kpis.enrolled || 0) /
            kpis.applied
          ) * 100
        )
      : 0;

  return (
    <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-[var(--theme-text)]">
          Requests & enrollment funnel
        </p>

        <p className="text-xs text-[var(--theme-text-muted)]">
          {loading
            ? "Reading pipeline…"
            : `${declined.length} declined · ${apps.length} currently in Requests`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2"
          >
            <p
              className={`text-lg font-semibold ${stat.accent}`}
            >
              {loading
                ? "…"
                : stat.value}
            </p>

            <p className="text-[10px] uppercase tracking-wide text-[var(--theme-text-muted)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--theme-text-secondary)]">
        {funnel.map(
          (stage, index) => (
            <span
              key={stage.label}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <span className="text-[var(--theme-text-muted)]">
                  →
                </span>
              )}

              <span>
                <span className="font-semibold text-[var(--theme-text)]">
                  {loading
                    ? "…"
                    : stage.n}
                </span>{" "}
                {stage.label}
              </span>
            </span>
          )
        )}

        <span className="ml-auto text-[var(--theme-text-muted)]">
          {loading
            ? "…"
            : `${conversion}% apply→enrolled`}
        </span>
      </div>
    </div>
  );
}
