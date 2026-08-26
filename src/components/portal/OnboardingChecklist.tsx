"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type Step = {
  key: string;
  title: string;
  description: string;
  complete: boolean;
};

type ChecklistResponse = {
  success: boolean;
  steps: Step[];
  completed: number;
  total: number;
  percentComplete: number;
};

export function OnboardingChecklist() {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/client-experience/onboarding-checklist`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("khairo_client_token") || ""}`,
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
        else setError(json.message || "Could not load onboarding checklist.");
      })
      .catch(() => setError("Could not load onboarding checklist."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 size={15} className="animate-spin" /> Loading onboarding…</div>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Your onboarding checklist</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Track your first steps inside Khairo Diet Clinic.
          </p>
        </div>
        <span className="rounded-full bg-[#0d9488]/10 px-3 py-1 text-sm font-semibold text-[#0d9488]">
          {data.percentComplete}%
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {data.steps.map((step) => (
          <div key={step.key} className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/20 p-3">
            {step.complete ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <Circle size={17} className="mt-0.5 shrink-0 text-zinc-600" />
            )}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${step.complete ? "text-white" : "text-zinc-400"}`}>
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-zinc-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
