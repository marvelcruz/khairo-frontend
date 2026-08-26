"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type StaffRef = { _id: string; name: string; roles?: string[] };
type Opportunity = {
  _id: string;
  stage: "qualified" | "consultation_booked";
  programInterest?: "core" | "plus" | "vip" | "not_sure";
  nextFollowUpAt?: string;
  assignedTo?: StaffRef | string | null;
};
type Contact = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  assignedTo?: StaffRef | string | null;
  opportunity?: Opportunity | null;
};
type ContactListResponse = { contacts: Contact[]; total: number };
type Outcome = "completed" | "no_show" | "nurture" | "lost";
type View = "ready" | "booked";

const PROGRAM_LABELS = {
  core: "Core",
  plus: "Plus",
  vip: "VIP",
  not_sure: "Not sure",
} as const;

const OUTCOME_OPTIONS: Array<{
  value: Outcome;
  label: string;
  description: string;
  tone: string;
}> = [
  {
    value: "completed",
    label: "Completed",
    description: "Move to Consultation Completed.",
    tone: "border-emerald-500/30 bg-emerald-500/[0.06]",
  },
  {
    value: "no_show",
    label: "No-show",
    description: "Keep booked and create a follow-up task.",
    tone: "border-amber-500/30 bg-amber-500/[0.06]",
  },
  {
    value: "nurture",
    label: "Nurture",
    description: "Move the lead to Nurture.",
    tone: "border-slate-500/30 bg-slate-500/[0.06]",
  },
  {
    value: "lost",
    label: "Lost",
    description: "Close the opportunity as Lost.",
    tone: "border-rose-500/30 bg-rose-500/[0.06]",
  },
];

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none transition focus:border-[#0d9488]";

function ownerName(value?: StaffRef | string | null) {
  if (!value) return "Unassigned";
  if (typeof value === "string") return "Assigned";
  return value.name || "Assigned";
}

function dateLabel(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date needs correction";
  return date.toLocaleString(undefined, {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Could not update consultation.";
}

export default function ConsultationsPage() {
  const { hasRole } = useAuth();
  const canBook = hasRole("admin", "sales", "staff", "coach");
  const canRecordOutcome = hasRole("admin", "sales", "coach");

  const [qualified, setQualified] = useState<Contact[]>([]);
  const [booked, setBooked] = useState<Contact[]>([]);
  const [view, setView] = useState<View>("booked");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bookingContact, setBookingContact] = useState<Contact | null>(null);
  const [outcomeContact, setOutcomeContact] = useState<Contact | null>(null);
  const [cancelContact, setCancelContact] = useState<Contact | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("completed");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [form, setForm] = useState({
    scheduledAt: "",
    channel: "video",
    location: "",
    notes: "",
  });

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [qualifiedData, bookedData] = await Promise.all([
        api.get<ContactListResponse>("/crm/contacts", {
          params: { stage: "qualified", limit: 100 },
        }),
        api.get<ContactListResponse>("/crm/contacts", {
          params: { stage: "consultation_booked", limit: 100 },
        }),
      ]);
      setQualified(qualifiedData.contacts || []);
      setBooked(bookedData.contacts || []);
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
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!bookingContact && !outcomeContact && !cancelContact) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setBookingContact(null);
      setOutcomeContact(null);
      setCancelContact(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bookingContact, outcomeContact, cancelContact]);

  const orderedQualified = useMemo(
    () => [...qualified].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [qualified]
  );

  const orderedBooked = useMemo(
    () =>
      [...booked].sort((a, b) => {
        const aTime = a.opportunity?.nextFollowUpAt
          ? new Date(a.opportunity.nextFollowUpAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.opportunity?.nextFollowUpAt
          ? new Date(b.opportunity.nextFollowUpAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }),
    [booked]
  );

  const visibleContacts = useMemo(() => {
    const source = view === "ready" ? orderedQualified : orderedBooked;
    const query = search.trim().toLowerCase();
    if (!query) return source;

    return source.filter((contact) =>
      [contact.fullName, contact.email, contact.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [orderedBooked, orderedQualified, search, view]);

  const openBooking = (contact: Contact) => {
    setBookingContact(contact);
    setForm({
      scheduledAt: toDateTimeInput(contact.opportunity?.nextFollowUpAt),
      channel: "video",
      location: "",
      notes: "",
    });
  };

  const saveBooking = async () => {
    const contact = bookingContact;
    if (!contact || !form.scheduledAt || busyId) return;

    const date = new Date(form.scheduledAt);
    if (Number.isNaN(date.getTime())) {
      setError("Choose a valid consultation date and time.");
      return;
    }

    setBusyId(contact._id);
    setError("");

    try {
      const response = await api.post<{ rescheduled?: boolean }>(
        `/crm/contacts/${contact._id}/consultation`,
        {
          scheduledAt: date.toISOString(),
          channel: form.channel,
          location: form.location,
          notes: form.notes,
        }
      );
      setNotice(
        `${contact.fullName} consultation ${response.rescheduled ? "rescheduled" : "booked"}.`
      );
      setBookingContact(null);
      setView("booked");
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openOutcome = (contact: Contact) => {
    setOutcomeContact(contact);
    setSelectedOutcome("completed");
    setOutcomeNotes("");
  };

  const recordOutcome = async () => {
    const contact = outcomeContact;
    if (!contact || !canRecordOutcome || busyId) return;

    setBusyId(contact._id);
    setError("");

    try {
      await api.post(`/crm/contacts/${contact._id}/consultation-outcome`, {
        outcome: selectedOutcome,
        notes: outcomeNotes.trim(),
      });

      const label =
        selectedOutcome === "completed"
          ? "completed"
          : selectedOutcome === "no_show"
            ? "marked no-show"
            : `moved to ${selectedOutcome}`;

      setNotice(`${contact.fullName} ${label}.`);
      setOutcomeContact(null);
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const cancelConsultation = async () => {
    const contact = cancelContact;
    const reason = cancelReason.trim();
    if (!contact || !reason || busyId) return;

    setBusyId(contact._id);
    setError("");
    try {
      await api.post(`/crm/contacts/${contact._id}/consultation-cancel`, { reason });
      setNotice(`${contact.fullName} consultation cancelled. Rebooking follow-up created.`);
      setCancelContact(null);
      setCancelReason("");
      await load(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-[var(--theme-border)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--theme-text)]">Consultations</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            Book qualified leads, manage scheduled consultations, and record outcomes.
          </p>
        </div>

        <Button type="button" variant="secondary" size="sm" disabled={refreshing} onClick={() => void load(true)}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </header>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-1">
            <button type="button" onClick={() => setView("ready")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${view === "ready" ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}>
              Ready to book
              <span className="ml-2 rounded-full bg-[var(--theme-page)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-muted)]">{orderedQualified.length}</span>
            </button>
            <button type="button" onClick={() => setView("booked")} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${view === "booked" ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}>
              Booked
              <span className="ml-2 rounded-full bg-[var(--theme-page)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-muted)]">{orderedBooked.length}</span>
            </button>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search consultations" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]" />
          </div>
        </div>

        <div className="hidden border-b border-[var(--theme-border-soft)] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)] md:grid md:grid-cols-[minmax(0,2fr)_120px_160px_minmax(170px,1fr)_auto] md:gap-4">
          <span>Lead</span>
          <span>Program</span>
          <span>Owner</span>
          <span>{view === "booked" ? "Consultation" : "Status"}</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading consultations…</div>
        ) : visibleContacts.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <CheckCircle2 size={24} className="mx-auto text-emerald-300" />
              <h2 className="mt-3 text-sm font-semibold text-[var(--theme-text)]">
                {view === "ready" ? "No qualified leads waiting to book" : "No booked consultations"}
              </h2>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                {search ? "Clear the search to see all records." : "Nothing needs attention in this view."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--theme-border-soft)]">
            {visibleContacts.map((contact) => {
              const program = contact.opportunity?.programInterest || "not_sure";
              const owner = ownerName(contact.assignedTo || contact.opportunity?.assignedTo);
              const busy = busyId === contact._id;

              return (
                <article key={contact._id} className="grid gap-3 px-4 py-4 transition hover:bg-[var(--theme-surface-soft)] md:grid-cols-[minmax(0,2fr)_120px_160px_minmax(170px,1fr)_auto] md:items-center md:gap-4 md:px-5">
                  <div className="min-w-0">
                    <Link href={`/dashboard/crm?contact=${contact._id}`} className="font-semibold text-[var(--theme-text)] hover:text-[#ff7ac7]">{contact.fullName}</Link>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">{contact.email || contact.phone || "No contact detail"}</p>
                  </div>

                  <div className="text-xs font-medium text-[var(--theme-text-secondary)]">
                    <span className="mr-2 text-[10px] uppercase tracking-wide text-[var(--theme-text-muted)] md:hidden">Program</span>
                    {PROGRAM_LABELS[program]}
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-[var(--theme-text-secondary)]">
                    <UserRound size={13} className="shrink-0 text-[var(--theme-text-muted)]" />
                    <span className="truncate">{owner}</span>
                  </div>

                  <div className="text-xs text-[var(--theme-text-secondary)]">
                    {view === "booked" ? (
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="shrink-0 text-cyan-300" />{dateLabel(contact.opportunity?.nextFollowUpAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-emerald-300"><CheckCircle2 size={13} /> Qualified and ready</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {canBook && (
                      <Button type="button" variant="secondary" size="sm" disabled={Boolean(busyId)} onClick={() => openBooking(contact)}>
                        <CalendarClock size={14} /> {view === "booked" ? "Reschedule" : "Book"}
                      </Button>
                    )}
                    {view === "booked" && canBook && (
                      <Button type="button" variant="ghost" size="sm" disabled={Boolean(busyId)} onClick={() => { setCancelContact(contact); setCancelReason(""); }}>
                        Cancel
                      </Button>
                    )}
                    {view === "booked" && canRecordOutcome && (
                      <Button type="button" size="sm" disabled={Boolean(busyId)} onClick={() => openOutcome(contact)}>
                        {busy ? "Saving…" : "Record outcome"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {bookingContact && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingContact(null); }}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff7ac7]">{bookingContact.opportunity?.stage === "consultation_booked" ? "Reschedule" : "Book consultation"}</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{bookingContact.fullName}</h2>
              </div>
              <button type="button" onClick={() => setBookingContact(null)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close booking form"><X size={16} /></button>
            </header>

            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Date & time</span>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm((value) => ({ ...value, scheduledAt: event.target.value }))} className={inputClass} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Format</span>
                  <select value={form.channel} onChange={(event) => setForm((value) => ({ ...value, channel: event.target.value }))} className={inputClass}>
                    <option value="video">Video</option>
                    <option value="phone">Phone</option>
                    <option value="in_person">In person</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Location or meeting link</span>
                <input value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} className={inputClass} placeholder="Optional" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Notes</span>
                <textarea rows={3} value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]" placeholder="Optional context for the team" />
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t border-[var(--theme-border)] px-5 py-4">
              <Button type="button" variant="ghost" size="sm" disabled={Boolean(busyId)} onClick={() => setBookingContact(null)}>Cancel</Button>
              <Button type="button" size="sm" disabled={Boolean(busyId) || !form.scheduledAt} onClick={() => void saveBooking()}>
                {busyId === bookingContact._id ? "Saving…" : "Save consultation"}
              </Button>
            </footer>
          </div>
        </div>
      )}

      {outcomeContact && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOutcomeContact(null); }}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff7ac7]">Consultation outcome</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{outcomeContact.fullName}</h2>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{dateLabel(outcomeContact.opportunity?.nextFollowUpAt)}</p>
              </div>
              <button type="button" onClick={() => setOutcomeContact(null)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close outcome form"><X size={16} /></button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {OUTCOME_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => setSelectedOutcome(option.value)} className={`rounded-lg border p-3 text-left transition ${selectedOutcome === option.value ? `${option.tone} ring-1 ring-[#0d9488]/40` : "border-[var(--theme-border)] bg-[var(--theme-page)] hover:bg-[var(--theme-surface-soft)]"}`}>
                    <p className="text-sm font-semibold text-[var(--theme-text)]">{option.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-muted)]">{option.description}</p>
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Notes {selectedOutcome === "lost" ? "or reason" : "(optional)"}</span>
                <textarea rows={3} value={outcomeNotes} onChange={(event) => setOutcomeNotes(event.target.value)} className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]" placeholder="Add any useful context for the CRM history" />
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t border-[var(--theme-border)] px-5 py-4">
              <Button type="button" variant="ghost" size="sm" disabled={Boolean(busyId)} onClick={() => setOutcomeContact(null)}>Cancel</Button>
              <Button type="button" size="sm" disabled={Boolean(busyId)} onClick={() => void recordOutcome()}>
                {busyId === outcomeContact._id ? "Saving…" : "Save outcome"}
              </Button>
            </footer>
          </div>
        </div>
      )}

      {cancelContact && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCancelContact(null); }}>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-300">Cancel consultation</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{cancelContact.fullName}</h2>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{dateLabel(cancelContact.opportunity?.nextFollowUpAt)}</p>
              </div>
              <button type="button" onClick={() => setCancelContact(null)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close cancellation form"><X size={16} /></button>
            </header>

            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-[var(--theme-text-secondary)]">Cancelling returns the lead to Qualified and automatically creates a rebooking follow-up for the team.</p>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Cancellation reason</span>
                <textarea rows={4} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]" placeholder="Briefly record why the consultation was cancelled" />
              </label>
            </div>

            <footer className="flex justify-end gap-2 border-t border-[var(--theme-border)] px-5 py-4">
              <Button type="button" variant="ghost" size="sm" disabled={Boolean(busyId)} onClick={() => setCancelContact(null)}>Keep booking</Button>
              <Button type="button" size="sm" disabled={Boolean(busyId) || !cancelReason.trim()} onClick={() => void cancelConsultation()}>
                {busyId === cancelContact._id ? "Cancelling…" : "Cancel consultation"}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
