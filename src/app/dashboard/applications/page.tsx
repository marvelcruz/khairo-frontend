"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";

type QualificationResult = "qualified" | "needs_review" | "not_qualified";
type QualificationDisposition = "none" | "nurture" | "lost";
type StartTimeline = "asap" | "within_2_weeks" | "within_a_month" | "exploring";
type ReadyToSpeak = "yes" | "questions" | "not_yet";

type QualificationAnswers = {
  startTimeline?: StartTimeline;
  readyToSpeak?: ReadyToSpeak;
  [key: string]: unknown;
};

type Qualification = {
  questionnaireVersion?: string;
  answers?: QualificationAnswers;
  result?: QualificationResult | "pending";
  reasons?: string[];
  disposition?: QualificationDisposition;
  reviewNotes?: string;
  reviewedAt?: string;
};

type QualificationRecommendation = {
  result: QualificationResult;
  disposition: QualificationDisposition;
  label: string;
  reasons: string[];
};

type RecommendationResponse = {
  success: boolean;
  questionnaireVersion: string;
  recommendation: QualificationRecommendation;
};

type Application = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  programInterest: string;
  goals?: string;
  healthNotes?: string;
  status: "pending" | "contacted" | "approved" | "declined";
  qualification?: Qualification;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  contacted: "bg-blue-500/15 text-blue-400",
  approved: "bg-green-500/15 text-green-400",
  declined: "bg-red-500/15 text-red-400",
};

const QUALIFICATION_STYLES: Record<string, string> = {
  pending: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  qualified: "border-green-500/30 bg-green-500/10 text-green-300",
  needs_review: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  not_qualified: "border-red-500/30 bg-red-500/10 text-red-300",
};

const START_TIMELINE_OPTIONS: Array<{ value: StartTimeline; label: string }> = [
  { value: "asap", label: "As soon as possible" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_a_month", label: "Within a month" },
  { value: "exploring", label: "I am still exploring" },
];

const READY_TO_SPEAK_OPTIONS: Array<{ value: ReadyToSpeak; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "questions", label: "I have a few questions first" },
  { value: "not_yet", label: "Not yet" },
];

function qualificationLabel(app: Application) {
  const result = app.qualification?.result;
  if (result === "qualified") return "Qualified";
  if (result === "needs_review") return "Needs review";
  if (result === "not_qualified") {
    return app.qualification?.disposition === "lost"
      ? "Not qualified · Lost"
      : "Not qualified · Nurture";
  }
  return "Qualification pending";
}

function QualificationModal({
  app,
  onClose,
  onSaved,
}: {
  app: Application;
  onClose: () => void;
  onSaved: () => void;
}) {
  const existingResult = app.qualification?.result;
  const [startTimeline, setStartTimeline] = useState<StartTimeline | "">(
    app.qualification?.answers?.startTimeline || ""
  );
  const [readyToSpeak, setReadyToSpeak] = useState<ReadyToSpeak | "">(
    app.qualification?.answers?.readyToSpeak || ""
  );
  const [recommendation, setRecommendation] = useState<QualificationRecommendation | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [result, setResult] = useState<QualificationResult | "">(
    existingResult && existingResult !== "pending" ? existingResult : ""
  );
  const [disposition, setDisposition] = useState<QualificationDisposition>(
    app.qualification?.disposition === "lost" || app.qualification?.disposition === "nurture"
      ? app.qualification.disposition
      : "none"
  );
  const [reasonsText, setReasonsText] = useState((app.qualification?.reasons || []).join("\n"));
  const [reviewNotes, setReviewNotes] = useState(app.qualification?.reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    if (!startTimeline || !readyToSpeak) {
      setRecommendation(null);
      setRecommendationError("");
      setRecommending(false);
      return () => {
        active = false;
      };
    }

    setRecommending(true);
    setRecommendationError("");

    api
      .post<RecommendationResponse>(`/applications/${app._id}/qualification/recommendation`, {
        answers: { startTimeline, readyToSpeak },
      })
      .then((data) => {
        if (active) setRecommendation(data.recommendation);
      })
      .catch((err) => {
        if (active) {
          setRecommendation(null);
          setRecommendationError(
            err instanceof Error ? err.message : "Could not calculate a qualification recommendation."
          );
        }
      })
      .finally(() => {
        if (active) setRecommending(false);
      });

    return () => {
      active = false;
    };
  }, [app._id, readyToSpeak, startTimeline]);

  const applyRecommendation = () => {
    if (!recommendation) return;
    setResult(recommendation.result);
    setDisposition(
      recommendation.result === "not_qualified"
        ? recommendation.disposition
        : "none"
    );
    setReasonsText(recommendation.reasons.join("\n"));
  };

  const save = async () => {
    setError("");
    if (!startTimeline || !readyToSpeak) {
      setError("Complete both qualification questions before saving a decision.");
      return;
    }
    if (!result) {
      setError("Choose Qualified, Needs Review, or Not Qualified.");
      return;
    }
    if (result === "not_qualified" && disposition === "none") {
      setError("Choose Nurture or Lost for a Not Qualified lead.");
      return;
    }

    const reasons = reasonsText
      .split(/\n+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 8);

    setSaving(true);
    try {
      await api.patch(`/applications/${app._id}/qualification`, {
        result,
        disposition: result === "not_qualified" ? disposition : "none",
        reasons,
        answers: { startTimeline, readyToSpeak },
        reviewNotes: reviewNotes.trim(),
        questionnaireVersion: "v1",
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save qualification decision.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
      <div className="my-6 w-full max-w-xl rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Qualification · {app.fullName}</h2>
            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
              Use two business-readiness questions to support the staff decision.
            </p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-sm text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-50">
            Close
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-200">
          This is a non-clinical qualification step. Medical eligibility and clinical decisions remain in Medical Review.
        </div>

        <div className="mt-5 space-y-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-text-secondary)]">Qualification v1</p>
            <p className="mt-1 text-sm text-white">Answer both questions before recording the final decision.</p>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-white">When would you ideally like to get started?</span>
            <select
              value={startTimeline}
              onChange={(event) => setStartTimeline(event.target.value as StartTimeline | "")}
              className="mt-2 min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
            >
              <option value="">Choose an option</option>
              {START_TIMELINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-white">Are you ready to speak with a Khairo Diet Clinic team member about the next step?</span>
            <select
              value={readyToSpeak}
              onChange={(event) => setReadyToSpeak(event.target.value as ReadyToSpeak | "")}
              className="mt-2 min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
            >
              <option value="">Choose an option</option>
              {READY_TO_SPEAK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {(recommending || recommendation || recommendationError) && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">System recommendation</p>
                {recommending ? (
                  <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Calculating…</p>
                ) : recommendation ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-white">{recommendation.label}</p>
                    {recommendation.reasons.length > 0 && (
                      <p className="mt-1 text-xs leading-5 text-[var(--theme-text-secondary)]">{recommendation.reasons.join(" · ")}</p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-sm text-red-300">{recommendationError}</p>
                )}
              </div>

              {recommendation && !recommending && (
                <button
                  type="button"
                  onClick={applyRecommendation}
                  className="rounded-full border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/10"
                >
                  Use recommendation
                </button>
              )}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[var(--theme-text-secondary)]">
              Advisory only. Staff makes the final decision. The system never recommends Lost.
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--theme-text-secondary)]">Staff decision</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["qualified", "Qualified", "Advance to Qualified"],
              ["needs_review", "Needs Review", "Keep in Qualification + task"],
              ["not_qualified", "Not Qualified", "Route to Nurture or Lost"],
            ] as const).map(([value, label, helper]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setResult(value);
                  if (value !== "not_qualified") setDisposition("none");
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  result === value
                    ? "border-[#0d9488] bg-[#0d9488]/10"
                    : "border-[var(--theme-border)] bg-[var(--theme-surface-soft)] hover:border-white/30"
                }`}
              >
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="mt-1 block text-[11px] text-[var(--theme-text-secondary)]">{helper}</span>
              </button>
            ))}
          </div>
        </div>

        {result === "not_qualified" && (
          <div className="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-3">
            <p className="text-xs font-medium text-white">What should happen next?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDisposition("nurture")}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  disposition === "nurture"
                    ? "border-amber-400 bg-amber-500/10 text-amber-200"
                    : "border-[var(--theme-border)] text-white"
                }`}
              >
                Nurture
                <span className="mt-0.5 block text-[11px] opacity-70">Keep the relationship open for future follow-up.</span>
              </button>
              <button
                type="button"
                onClick={() => setDisposition("lost")}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  disposition === "lost"
                    ? "border-red-400 bg-red-500/10 text-red-200"
                    : "border-[var(--theme-border)] text-white"
                }`}
              >
                Lost
                <span className="mt-0.5 block text-[11px] opacity-70">Close the current sales opportunity. Staff decision only.</span>
              </button>
            </div>
          </div>
        )}

        <label className="mt-4 block">
          <span className="text-xs font-medium text-white">Reason(s)</span>
          <textarea
            value={reasonsText}
            onChange={(event) => setReasonsText(event.target.value)}
            rows={3}
            maxLength={1300}
            placeholder="One reason per line (up to 8)."
            className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-white">Review notes <span className="font-normal text-[var(--theme-text-secondary)]">(optional)</span></span>
          <textarea
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Useful context for the next staff member. Do not make clinical determinations here."
            className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
          />
        </label>

        {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm text-white disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !startTimeline || !readyToSpeak || !result || (result === "not_qualified" && disposition === "none")}
            className="rounded-full bg-[#0d9488] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d6007e] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save qualification"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ app, onClose, onApproved }: { app: Application; onClose: () => void; onApproved: () => void }) {
  const [program, setProgram] = useState(app.programInterest !== "not_sure" ? app.programInterest : "core");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setError("");
    setSaving(true);
    try {
      await api.post(`/applications/${app._id}/approve`, { program });
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <h2 className="text-lg font-bold text-white">Approve {app.fullName}</h2>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Qualification is complete. Continue the existing approval journey.</p>

        <label className="mt-4 block text-xs text-[var(--theme-text-secondary)]">Program</label>
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="core">Core — 8 weeks</option>
          <option value="plus">Plus — 12 weeks</option>
          <option value="vip">VIP — 12 weeks</option>
        </select>

        {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm text-white">
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={saving}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {saving ? "Approving…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { hasRole } = useAuth();
  const canQualify = hasRole("admin", "sales");
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<Application | null>(null);
  const [qualificationTarget, setQualificationTarget] = useState<Application | null>(null);

  const fetchApplications = useCallback(() => {
    setLoading(true);
    api
      .get<{ applications: Application[] }>(`/applications${filter ? `?status=${filter}` : ""}`)
      .then((data) => setApplications(data.applications))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (id: string, status: string) => {
    await api.patch(`/applications/${id}`, { status });
    fetchApplications();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Applications</h1>
      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Qualify leads before they continue into consultation, medical review, payment, and activation.</p>

      <div className="mt-4 flex w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-1 sm:mt-5 sm:w-fit sm:rounded-full">
        {["pending", "contacted", "approved", "declined", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-medium capitalize transition-colors sm:min-h-0 sm:px-4 sm:py-2 ${
              filter === s ? "bg-white text-black" : "text-[var(--theme-text-secondary)] hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--theme-text-secondary)]">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-8 text-center text-sm text-[var(--theme-text-secondary)]">
            No applications here.
          </p>
        ) : (
          applications.map((app) => {
            const qualificationResult = app.qualification?.result || "pending";
            const isQualified = qualificationResult === "qualified";
            return (
              <div key={app._id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:rounded-2xl sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{app.fullName}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${QUALIFICATION_STYLES[qualificationResult] || QUALIFICATION_STYLES.pending}`}>
                      {qualificationLabel(app)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{app.email} · {app.phone}</p>
                <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Interested in: {app.programInterest.replace("_", " ")}</p>
                {app.goals && <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">Goals: {app.goals}</p>}
                {app.healthNotes && <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Health notes: {app.healthNotes}</p>}

                {app.qualification?.reasons && app.qualification.reasons.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--theme-text-secondary)]">Qualification reasons: {app.qualification.reasons.join(" · ")}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {app.status === "pending" && (
                    <button
                      onClick={() => handleStatusChange(app._id, "contacted")}
                      className="min-h-10 rounded-full border border-[var(--theme-border)] px-3 text-xs text-white"
                    >
                      Mark contacted
                    </button>
                  )}

                  {canQualify && app.status !== "approved" && app.status !== "declined" && (
                    <button
                      onClick={() => setQualificationTarget(app)}
                      className="min-h-10 rounded-full bg-[#0d9488] px-3 text-xs font-medium text-white hover:bg-[#d6007e]"
                    >
                      {qualificationResult === "pending" ? "Qualify lead" : "Review qualification"}
                    </button>
                  )}

                  {isQualified && app.status !== "approved" && app.status !== "declined" && canQualify && (
                    <button
                      onClick={() => setApproveTarget(app)}
                      className="min-h-10 rounded-full bg-white px-3 text-xs font-medium text-black"
                    >
                      Continue approval
                    </button>
                  )}

                  {!isQualified && app.status !== "approved" && app.status !== "declined" && (
                    <span className="flex min-h-10 items-center rounded-full border border-[var(--theme-border)] px-3 text-[11px] text-[var(--theme-text-secondary)]">
                      Approval unlocks after Qualified
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {qualificationTarget && (
        <QualificationModal
          app={qualificationTarget}
          onClose={() => setQualificationTarget(null)}
          onSaved={() => {
            setQualificationTarget(null);
            fetchApplications();
          }}
        />
      )}

      {approveTarget && (
        <ApproveModal
          app={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={() => {
            setApproveTarget(null);
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}
