"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock3, FileText, RefreshCw, UserRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type StaffRef = {
  _id: string;
  name: string;
  roles?: string[];
};

type Opportunity = {
  _id: string;
  stage: "qualification";
  status: "open" | "won" | "lost";
  programInterest?: "core" | "plus" | "vip" | "not_sure";
  nextFollowUpAt?: string;
  assignedTo?: StaffRef | string | null;
};

type Contact = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  application?: string | null;
  programInterest?: "core" | "plus" | "vip" | "not_sure";
  assignedTo?: StaffRef | string | null;
  opportunity?: Opportunity | null;
};

type ContactListResponse = {
  contacts: Contact[];
  total: number;
};

type Decision = "qualified" | "nurture" | "lost";

const PROGRAM_LABELS = {
  core: "Core",
  plus: "Plus",
  vip: "VIP",
  not_sure: "Not sure",
} as const;

function ownerName(value?: StaffRef | string | null) {
  if (!value) return "Unassigned";
  if (typeof value === "string") return "Assigned";
  return value.name || "Assigned";
}

function followUpLabel(value?: string) {
  if (!value) return "No follow-up scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Follow-up date needs correction";
  return date.toLocaleString(undefined, {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Could not record qualification decision.";
}

export default function QualificationReviewPage() {
  const { hasRole } = useAuth();
  const canDecide = hasRole("admin", "sales");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await api.get<ContactListResponse>("/crm/contacts", {
        params: { stage: "qualification", limit: 100 },
      });
      setContacts(data.contacts || []);
    } catch (err) {
      setError(getErrorMessage(err));
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
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const orderedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => {
        const aTime = a.opportunity?.nextFollowUpAt
          ? new Date(a.opportunity.nextFollowUpAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.opportunity?.nextFollowUpAt
          ? new Date(b.opportunity.nextFollowUpAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }),
    [contacts]
  );

  const decide = async (contact: Contact, decision: Decision) => {
    if (!canDecide || busyId || contact.application) return;
    setBusyId(contact._id);
    setError("");

    try {
      await api.post(`/crm/contacts/${contact._id}/qualification-decision`, {
        decision,
      });
      const label =
        decision === "qualified"
          ? "Qualified"
          : decision === "nurture"
            ? "Nurture"
            : "Lost";
      setNotice(`${contact.fullName} moved to ${label}.`);
      setContacts((current) => current.filter((item) => item._id !== contact._id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-full bg-[var(--theme-page)] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/crm"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
            >
              <ArrowLeft size={14} />
              Back to CRM
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-[var(--theme-text)]">
              Qualification Review
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
              Review leads currently waiting for a qualification decision.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={() => void load(true)}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {notice && (
          <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-600/[0.06] px-4 py-3 text-sm text-emerald-300">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {!canDecide && !loading && (
          <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
            Qualification decisions are available to Sales and Admin staff.
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--theme-text)]">Waiting for review</h2>
              <p className="mt-0.5 text-xs text-[var(--theme-text-muted)]">
                {loading ? "Loading…" : `${orderedContacts.length} lead${orderedContacts.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">
              Loading qualification leads…
            </div>
          ) : orderedContacts.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-6 text-center">
              <div>
                <Check size={26} className="mx-auto text-emerald-300" />
                <h3 className="mt-3 text-sm font-semibold text-[var(--theme-text)]">All caught up</h3>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">There are no leads waiting in Qualification.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--theme-border-soft)]">
              {orderedContacts.map((contact) => {
                const program = contact.opportunity?.programInterest || contact.programInterest || "not_sure";
                const busy = busyId === contact._id;
                const hasApplication = Boolean(contact.application);

                return (
                  <article key={contact._id} className="px-4 py-5 sm:px-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[var(--theme-text)]">{contact.fullName}</h3>
                          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                            Qualification
                          </span>
                          <span className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--theme-text-secondary)]">
                            {PROGRAM_LABELS[program]}
                          </span>
                          {hasApplication && (
                            <span className="rounded-md border border-[#0d9488]/25 bg-[#0d9488]/10 px-2 py-1 text-[10px] font-semibold text-[#ff8fd1]">
                              Application linked
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-[var(--theme-text-muted)] sm:grid-cols-2 lg:grid-cols-3">
                          <span className="truncate">{contact.email || contact.phone || "No contact detail"}</span>
                          <span className="inline-flex items-center gap-1.5"><UserRound size={13} />{ownerName(contact.assignedTo || contact.opportunity?.assignedTo)}</span>
                          <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{followUpLabel(contact.opportunity?.nextFollowUpAt)}</span>
                        </div>

                        <Link
                          href={`/dashboard/crm?contact=${contact._id}`}
                          className="mt-3 inline-flex text-xs font-semibold text-[#ff7ac7] transition hover:text-[#ff9bd5]"
                        >
                          Open full CRM record
                        </Link>
                      </div>

                      {canDecide && hasApplication ? (
                        <div className="shrink-0 lg:w-[330px]">
                          <Link
                            href="/dashboard/applications"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#0d9488]/30 bg-[#0d9488]/10 px-4 text-xs font-semibold text-[#ff8fd1] transition hover:bg-[#0d9488]/15"
                          >
                            <FileText size={14} />
                            Review application qualification
                          </Link>
                          <p className="mt-2 text-center text-[10px] leading-4 text-[var(--theme-text-muted)]">
                            Applicants are qualified in Applications so their questionnaire and audit record stay together.
                          </p>
                        </div>
                      ) : canDecide ? (
                        <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[330px]">
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => void decide(contact, "qualified")}
                            className="h-10 rounded-lg border border-emerald-500/25 bg-emerald-600/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy ? "Saving…" : "Qualify"}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => void decide(contact, "nurture")}
                            className="h-10 rounded-lg border border-slate-500/25 bg-slate-500/10 px-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nurture
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => void decide(contact, "lost")}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X size={13} />
                            Lost
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
