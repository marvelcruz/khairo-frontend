"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Columns3,
  GripVertical,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STAGES = [
  "new",
  "qualification",
  "qualified",
  "consultation_booked",
  "consultation_completed",
  "medical_review",
  "payment_pending",
  "nurture",
  "lost",
] as const;

type Stage = (typeof STAGES)[number];
type ViewMode = "list" | "board";
type Program = "core" | "plus" | "vip" | "not_sure";

type StaffRef = {
  _id: string;
  name: string;
  roles?: string[];
};

type Opportunity = {
  _id: string;
  stage: Stage;
  status: "open" | "won" | "lost";
  programInterest?: Program;
  estimatedValue?: number;
  nextFollowUpAt?: string;
  assignedTo?: StaffRef | string | null;
};

type CrmContact = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  programInterest?: Program;
  assignedTo?: StaffRef | string | null;
  opportunity?: Opportunity | null;
};

type ContactListResponse = {
  contacts: CrmContact[];
  total: number;
};

type Overview = {
  openCount: number;
  openValue: number;
  overdueFollowUps: number;
  unassigned: number;
  stages: Record<Stage, { count: number; value: number }>;
};

const STAGE_META: Record<Stage, { label: string; short: string; dot: string }> = {
  new: { label: "New Lead", short: "New", dot: "bg-pink-400" },
  qualification: { label: "Qualification", short: "Qualification", dot: "bg-amber-400" },
  qualified: { label: "Qualified", short: "Qualified", dot: "bg-emerald-400" },
  consultation_booked: { label: "Consultation Booked", short: "Consult Booked", dot: "bg-cyan-400" },
  consultation_completed: { label: "Consultation Completed", short: "Consult Done", dot: "bg-blue-400" },
  medical_review: { label: "Medical Review", short: "Medical", dot: "bg-violet-400" },
  payment_pending: { label: "Payment Pending", short: "Payment", dot: "bg-orange-400" },
  nurture: { label: "Nurture", short: "Nurture", dot: "bg-slate-400" },
  lost: { label: "Lost", short: "Lost", dot: "bg-rose-400" },
};

const PROGRAM_LABELS: Record<Program, string> = {
  core: "Core",
  plus: "Plus",
  vip: "VIP",
  not_sure: "Not sure",
};

const TIME_ZONE = "Africa/Lagos";

function staffName(value?: StaffRef | string | null) {
  if (!value) return "Unassigned";
  if (typeof value === "string") return "Assigned";
  return value.name || "Assigned";
}

function money(value?: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function followUpLabel(value?: string) {
  if (!value) return "No follow-up";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date needs correction";

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const target = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const time = date.toLocaleTimeString(undefined, {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });

  if (target === today) return `Today · ${time}`;
  if (target < today) return `Overdue · ${date.toLocaleDateString(undefined, { timeZone: TIME_ZONE, month: "short", day: "numeric" })}`;

  return date.toLocaleString(undefined, {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextActionTone(value?: string) {
  if (!value) return "text-[var(--theme-text-muted)]";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "text-amber-300";
  return date.getTime() < Date.now() ? "text-amber-300" : "text-[var(--theme-text-secondary)]";
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Could not load CRM.";
}

export default function CrmWorkspaceHome() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "sales");

  const [view, setView] = useState<ViewMode>("list");
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [assignees, setAssignees] = useState<StaffRef[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedOpportunityId, setDraggedOpportunityId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (stageFilter !== "all") params.stage = stageFilter;
      if (ownerFilter !== "all") params.assignedTo = ownerFilter;

      const [overviewData, contactData, assigneeData] = await Promise.all([
        api.get<{ success: boolean } & Overview>("/crm/overview"),
        api.get<ContactListResponse>("/crm/contacts", { params }),
        api.get<{ users: StaffRef[] }>("/crm/assignees"),
      ]);

      setOverview(overviewData);
      setContacts(contactData.contacts || []);
      setAssignees(assigneeData.users || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ownerFilter, search, stageFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const orderedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const aTime = a.opportunity?.nextFollowUpAt
        ? new Date(a.opportunity.nextFollowUpAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b.opportunity?.nextFollowUpAt
        ? new Date(b.opportunity.nextFollowUpAt).getTime()
        : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }, [contacts]);

  const boardByStage = useMemo(() => {
    const result = Object.fromEntries(
      STAGES.map((stage) => [stage, [] as CrmContact[]])
    ) as Record<Stage, CrmContact[]>;

    for (const contact of orderedContacts) {
      const stage = contact.opportunity?.stage || "new";
      result[stage].push(contact);
    }

    return result;
  }, [orderedContacts]);

  const openContact = (contactId: string) => {
    router.push(`/dashboard/crm?contact=${contactId}`);
  };

  const selectStage = (stage: Stage) => {
    setStageFilter((current) => (current === stage ? "all" : stage));
    setView("list");
  };

  const moveStage = async (stage: Stage) => {
    if (!draggedOpportunityId || !canManage) return;
    const opportunityId = draggedOpportunityId;
    setDraggedOpportunityId(null);
    setDragOverStage(null);

    try {
      await api.patch(`/crm/opportunities/${opportunityId}`, { stage });
      setNotice(`Moved to ${STAGE_META[stage].label}.`);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5 pb-8">
      {notice && (
        <div className="fixed right-4 top-4 z-[100] rounded-lg border border-emerald-500/20 bg-[var(--theme-surface)] px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl">
          {notice}
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-[var(--theme-border)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--theme-text)]">CRM</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            See the full lead journey, then work the records that need attention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/crm?advanced=1")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
          >
            <SlidersHorizontal size={14} />
            CRM tools
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] lg:grid-cols-4">
        <div className="border-b border-r border-[var(--theme-border-soft)] px-5 py-4 lg:border-b-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--theme-text-muted)]">Open opportunities</p>
          <p className="mt-1.5 text-xl font-semibold text-[var(--theme-text)]">{overview?.openCount ?? "…"}</p>
        </div>
        <div className="border-b border-[var(--theme-border-soft)] px-5 py-4 lg:border-b-0 lg:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--theme-text-muted)]">Pipeline value</p>
          <p className="mt-1.5 text-xl font-semibold text-[var(--theme-text)]">{money(overview?.openValue)}</p>
        </div>
        <div className="border-r border-[var(--theme-border-soft)] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--theme-text-muted)]">Needs attention</p>
          <p className="mt-1.5 text-xl font-semibold text-[var(--theme-text)]">{overview?.overdueFollowUps ?? "…"}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--theme-text-muted)]">Unassigned</p>
          <p className="mt-1.5 text-xl font-semibold text-[var(--theme-text)]">{overview?.unassigned ?? "…"}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="border-b border-[var(--theme-border)] px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--theme-text)]">Pipeline overview</h2>
              <p className="mt-0.5 text-xs text-[var(--theme-text-muted)]">All nine stages are always visible. Select a stage to filter the list.</p>
            </div>
            {stageFilter !== "all" && (
              <button type="button" onClick={() => setStageFilter("all")} className="text-xs font-semibold text-[#ff7ac7] hover:text-[#ff9bd5]">
                Clear stage
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-y divide-[var(--theme-border-soft)] sm:grid-cols-5 lg:grid-cols-9 lg:divide-y-0">
          {STAGES.map((stage) => {
            const selected = stageFilter === stage;
            const meta = STAGE_META[stage];
            const count = overview?.stages?.[stage]?.count ?? 0;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => selectStage(stage)}
                className={`min-h-[82px] px-3 py-3 text-left transition ${selected ? "bg-[#0d9488]/10" : "hover:bg-[var(--theme-surface-soft)]"}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold leading-tight ${selected ? "text-[#ff7ac7]" : "text-[var(--theme-text-secondary)]"}`}>
                      {meta.short}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--theme-text)]">{count}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-page-alt)]">
        <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${view === "list" ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}
            >
              <List size={14} /> List
            </button>
            <button
              type="button"
              onClick={() => {
                setStageFilter("all");
                setView("board");
              }}
              className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition ${view === "board" ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}
            >
              <Columns3 size={14} /> Board
            </button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl lg:justify-end">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads"
                className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]"
              />
            </div>
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="h-10 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-xs text-[var(--theme-text-secondary)] outline-none sm:min-w-40"
            >
              <option value="all">All owners</option>
              {assignees.map((staff) => (
                <option key={staff._id} value={staff._id}>{staff.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading CRM…</div>
        ) : view === "list" ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--theme-text-muted)]">
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Next action</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orderedContacts.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--theme-text-muted)]">No leads match this view.</td></tr>
                  ) : orderedContacts.map((contact) => {
                    const opportunity = contact.opportunity;
                    const stage = opportunity?.stage || "new";
                    const owner = staffName(contact.assignedTo || opportunity?.assignedTo);
                    const program = PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"];
                    return (
                      <tr
                        key={contact._id}
                        onClick={() => openContact(contact._id)}
                        className="cursor-pointer border-b border-[var(--theme-border-soft)] transition last:border-b-0 hover:bg-[var(--theme-surface-soft)]"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
                          <p className="mt-0.5 max-w-[320px] truncate text-xs text-[var(--theme-text-muted)]">{contact.email || contact.phone || "No contact detail"}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-[var(--theme-text-secondary)]">{program}</td>
                        <td className="px-4 py-3.5 text-xs text-[var(--theme-text-secondary)]">{owner}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2 py-1 text-[11px] font-medium text-[var(--theme-text-secondary)]">
                            <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[stage].dot}`} />
                            {STAGE_META[stage].label}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-xs font-medium ${nextActionTone(opportunity?.nextFollowUpAt)}`}>
                          {followUpLabel(opportunity?.nextFollowUpAt)}
                        </td>
                        <td className="px-3 py-3.5 text-right text-sm text-[var(--theme-text-muted)]">›</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[var(--theme-border-soft)] md:hidden">
              {orderedContacts.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-[var(--theme-text-muted)]">No leads match this view.</div>
              ) : orderedContacts.map((contact) => {
                const opportunity = contact.opportunity;
                const stage = opportunity?.stage || "new";
                return (
                  <button key={contact._id} type="button" onClick={() => openContact(contact._id)} className="w-full px-4 py-4 text-left hover:bg-[var(--theme-surface-soft)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
                        <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"]} · {staffName(contact.assignedTo || opportunity?.assignedTo)}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-[var(--theme-text-secondary)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[stage].dot}`} />{STAGE_META[stage].short}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs ${nextActionTone(opportunity?.nextFollowUpAt)}`}>{followUpLabel(opportunity?.nextFollowUpAt)}</p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="grid gap-3 p-3 lg:grid-cols-3">
            {STAGES.map((stage) => {
              const stageContacts = boardByStage[stage];
              const selectedDrop = dragOverStage === stage;
              return (
                <section
                  key={stage}
                  onDragOver={(event) => {
                    if (!canManage || !draggedOpportunityId) return;
                    event.preventDefault();
                    setDragOverStage(stage);
                  }}
                  onDragLeave={() => {
                    if (dragOverStage === stage) setDragOverStage(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void moveStage(stage);
                  }}
                  className={`min-h-[220px] overflow-hidden rounded-xl border transition ${selectedDrop ? "border-[#0d9488]/60 bg-[#0d9488]/[0.04]" : "border-[var(--theme-border)] bg-[var(--theme-surface)]"}`}
                >
                  <header className="flex items-center justify-between gap-3 border-b border-[var(--theme-border-soft)] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STAGE_META[stage].dot}`} />
                      <h3 className="truncate text-xs font-semibold text-[var(--theme-text-secondary)]">{STAGE_META[stage].label}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--theme-text-muted)]">{stageContacts.length}</span>
                  </header>

                  <div className="divide-y divide-[var(--theme-border-soft)]">
                    {stageContacts.length === 0 ? (
                      <div className="px-4 py-10 text-center text-xs text-[var(--theme-text-muted)]">No leads</div>
                    ) : stageContacts.map((contact) => {
                      const opportunity = contact.opportunity;
                      return (
                        <article
                          key={contact._id}
                          draggable={canManage && Boolean(opportunity)}
                          onDragStart={(event) => {
                            if (!canManage || !opportunity) return;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", opportunity._id);
                            setDraggedOpportunityId(opportunity._id);
                          }}
                          onDragEnd={() => {
                            setDraggedOpportunityId(null);
                            setDragOverStage(null);
                          }}
                          onClick={() => openContact(contact._id)}
                          className="cursor-pointer px-4 py-3.5 transition hover:bg-[var(--theme-surface-soft)]"
                        >
                          <div className="flex items-start gap-2.5">
                            {canManage && opportunity && <GripVertical size={14} className="mt-0.5 shrink-0 text-[var(--theme-text-muted)]" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
                              <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
                                {PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"]} · {staffName(contact.assignedTo || opportunity?.assignedTo)}
                              </p>
                              <p className={`mt-2 text-[11px] font-medium ${nextActionTone(opportunity?.nextFollowUpAt)}`}>{followUpLabel(opportunity?.nextFollowUpAt)}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
