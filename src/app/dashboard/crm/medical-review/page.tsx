"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  FileSignature,
  LockKeyhole,
  RefreshCw,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type Person = { _id: string; name: string; email?: string; phone?: string; roles?: string[] };
type Contact = { _id: string; fullName: string; email?: string; phone?: string; programInterest?: string };
type Opportunity = { _id: string; stage: string; programInterest?: string };
type ClinicalRecord = {
  meetingCompletedAt?: string;
  meetingDetails?: string;
  medicalFindings?: string;
  vitals?: {
    heightCm?: number;
    weightKg?: number;
    bloodPressure?: string;
    heartRate?: number;
    temperatureC?: number;
    bloodGlucoseMmol?: number;
    notes?: string;
  };
  allergies?: Array<{ substance?: string; reaction?: string; severity?: string }>;
  problemList?: Array<{ diagnosis?: string; status?: string; notes?: string }>;
  medicationHistory?: Array<{ name?: string; dose?: string; frequency?: string; prescriber?: string; ongoing?: boolean }>;
  clinicalConsent?: {
    consentGiven?: boolean;
    consentScope?: string;
    consentAt?: string;
    consentByName?: string;
  };
  safetyFlags?: Array<{ type?: string; severity?: string; note?: string }>;
  medications?: string;
  restrictions?: string;
  recommendations?: string;
  clientInstructions?: string;
  signedAt?: string;
  signedByName?: string;
  attestation?: string;
};
type ClinicalAddendum = ClinicalRecord & {
  _id?: string;
  kind?: "correction" | "follow_up";
  text?: string;
};
type MedicalCase = {
  _id: string;
  contact: Contact;
  opportunity: Opportunity;
  assignedDoctor?: Person | null;
  status: "awaiting_scheduling" | "scheduled" | "completed" | "cancelled";
  scheduledAt?: string;
  meetingProvider?: "video" | "phone" | "in_person";
  meetingUrl?: string;
  schedulingNotes?: string;
  outcome?: "pending" | "cleared" | "follow_up_required" | "not_cleared";
  outcomeNotes?: string;
  clinicalRecord?: ClinicalRecord;
  addenda?: ClinicalAddendum[];
  qualificationSummary?: {
    goals?: string;
    healthNotes?: string;
    startTimeline?: string;
    readyToSpeak?: string;
  };
};

type View = "awaiting_scheduling" | "scheduled" | "completed";
type ClinicalMode = "initial" | "follow_up";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]";
const textareaClass =
  "w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]";

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
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
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function humanize(value?: string) {
  if (!value) return "Not provided";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Could not update medical review.";
}

function viewForStatus(status: MedicalCase["status"]): View {
  if (status === "scheduled") return "scheduled";
  if (status === "completed") return "completed";
  return "awaiting_scheduling";
}

function scheduledMeetingHasOccurred(item: MedicalCase) {
  if (!item.scheduledAt) return false;
  const time = new Date(item.scheduledAt).getTime();
  return Number.isFinite(time) && time <= Date.now();
}

function hasSignedCurrentMeeting(item: MedicalCase) {
  if (!item.clinicalRecord?.signedAt) return false;
  if (item.outcome !== "follow_up_required") return true;
  if (!item.scheduledAt) return false;
  const scheduled = new Date(item.scheduledAt).getTime();
  return Boolean(
    item.addenda?.some(
      (entry) =>
        entry.kind === "follow_up" &&
        entry.signedAt &&
        new Date(entry.signedAt).getTime() >= scheduled
    )
  );
}

export default function MedicalReviewPage() {
  const searchParams = useSearchParams();
  const { hasRole, user } = useAuth();
  const doctor = hasRole("doctor");
  const admin = hasRole("admin");
  const doctorOnly = doctor && !admin;
  const canSchedule = hasRole("admin", "doctor", "staff", "coach");

  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [view, setView] = useState<View>("awaiting_scheduling");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<MedicalCase | null>(null);
  const [scheduleCase, setScheduleCase] = useState<MedicalCase | null>(null);
  const [clinicalCase, setClinicalCase] = useState<MedicalCase | null>(null);
  const [clinicalMode, setClinicalMode] = useState<ClinicalMode>("initial");
  const [outcomeCase, setOutcomeCase] = useState<MedicalCase | null>(null);
  const [correctionCase, setCorrectionCase] = useState<MedicalCase | null>(null);
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState({
    scheduledAt: "",
    meetingProvider: "video",
    meetingUrl: "",
    notes: "",
  });
  const [clinical, setClinical] = useState({
    meetingCompletedAt: "",
    meetingDetails: "",
    medicalFindings: "",
    vitalsHeightCm: "",
    vitalsWeightKg: "",
    vitalsBloodPressure: "",
    vitalsHeartRate: "",
    vitalsTemperatureC: "",
    vitalsBloodGlucoseMmol: "",
    vitalsNotes: "",
    allergies: "",
    problemList: "",
    medicationHistory: "",
    safetyFlags: "",
    clinicalConsentGiven: false,
    clinicalConsentScope: "",
    medications: "",
    restrictions: "",
    recommendations: "",
    clientInstructions: "",
    signatureName: "",
    attest: false,
  });
  const [outcome, setOutcome] = useState("cleared");
  const [correction, setCorrection] = useState({ text: "", signatureName: "", attest: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ cases: MedicalCase[] }>("/medical-reviews");
      setCases(data.cases || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const caseId = searchParams.get("case");
    if (!caseId || !cases.length) return;
    const match = cases.find((item) => item._id === caseId);
    if (match) {
      setSelected(match);
      setView(viewForStatus(match.status));
    }
  }, [cases, searchParams]);

  const counts = useMemo(
    () => ({
      awaiting_scheduling: cases.filter((item) => item.status === "awaiting_scheduling").length,
      scheduled: cases.filter((item) => item.status === "scheduled").length,
      completed: cases.filter((item) => item.status === "completed").length,
    }),
    [cases]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases
      .filter((item) => item.status === view)
      .filter((item) => {
        if (!query) return true;
        const searchable = [item.contact?.fullName, item.assignedDoctor?.name];
        if (!doctorOnly) searchable.push(item.contact?.email);
        return searchable
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [cases, doctorOnly, search, view]);

  const openSchedule = (item: MedicalCase) => {
    setScheduleCase(item);
    setSchedule({
      scheduledAt: toDateTimeInput(item.scheduledAt),
      meetingProvider: item.meetingProvider || "video",
      meetingUrl: item.meetingUrl || "",
      notes: item.schedulingNotes || "",
    });
  };

  const openClinical = (item: MedicalCase, mode: ClinicalMode) => {
    setClinicalCase(item);
    setClinicalMode(mode);
    setClinical({
      meetingCompletedAt: toDateTimeInput(new Date().toISOString()),
      meetingDetails: "",
      medicalFindings: "",
      vitalsHeightCm: "",
      vitalsWeightKg: "",
      vitalsBloodPressure: "",
      vitalsHeartRate: "",
      vitalsTemperatureC: "",
      vitalsBloodGlucoseMmol: "",
      vitalsNotes: "",
      allergies: "",
      problemList: "",
      medicationHistory: "",
      safetyFlags: "",
      clinicalConsentGiven: false,
      clinicalConsentScope: "",
      medications: "",
      restrictions: "",
      recommendations: "",
      clientInstructions: "",
      signatureName: user?.name || "",
      attest: false,
    });
  };

  const saveSchedule = async () => {
    if (!scheduleCase || !schedule.scheduledAt || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/medical-reviews/${scheduleCase._id}/schedule`, {
        scheduledAt: new Date(schedule.scheduledAt).toISOString(),
        meetingProvider: schedule.meetingProvider,
        meetingUrl: schedule.meetingUrl,
        notes: schedule.notes,
      });
      setNotice(`${scheduleCase.contact.fullName} medical review scheduled.`);
      setScheduleCase(null);
      setView("scheduled");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const signClinicalRecord = async () => {
    if (!clinicalCase || busy) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        meetingCompletedAt: new Date(clinical.meetingCompletedAt).toISOString(),
        meetingDetails: clinical.meetingDetails,
        medicalFindings: clinical.medicalFindings,
        medications: clinical.medications,
        restrictions: clinical.restrictions,
        recommendations: clinical.recommendations,
        clientInstructions: clinical.clientInstructions,
        signatureName: clinical.signatureName,
        attest: clinical.attest,
      };
      if (clinicalMode === "initial") {
        await api.post(`/medical-reviews/${clinicalCase._id}/sign`, payload);
      } else {
        await api.post(`/medical-reviews/${clinicalCase._id}/addenda`, {
          ...payload,
          kind: "follow_up",
        });
      }
      setNotice(`${clinicalCase.contact.fullName} clinical record signed.`);
      setClinicalCase(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveOutcome = async () => {
    if (!outcomeCase || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/medical-reviews/${outcomeCase._id}/outcome`, { outcome });
      setNotice(`${outcomeCase.contact.fullName} medical review outcome saved.`);
      setOutcomeCase(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveCorrection = async () => {
    if (!correctionCase || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/medical-reviews/${correctionCase._id}/addenda`, {
        kind: "correction",
        text: correction.text,
        signatureName: correction.signatureName,
        attest: correction.attest,
      });
      setNotice(`${correctionCase.contact.fullName} signed addendum saved.`);
      setCorrectionCase(null);
      setCorrection({ text: "", signatureName: user?.name || "", attest: false });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <header className="flex flex-col gap-4 border-b border-[var(--theme-border)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ff7ac7]">
            <Stethoscope size={14} /> Clinical handoff
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--theme-text)]">Medical Review</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            Assigned doctors, meetings, signed clinical records, and medical-clearance outcomes.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </header>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-600/[0.06] px-4 py-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-1">
            {([
              ["awaiting_scheduling", "Needs scheduling"],
              ["scheduled", "Scheduled"],
              ["completed", "Completed"],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setView(key)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${view === key ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)]"}`}>
                {label}<span className="ml-2 rounded-full bg-[var(--theme-page)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text-muted)]">{counts[key]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medical reviews" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none" />
          </div>
        </div>

        <div className="hidden border-b border-[var(--theme-border-soft)] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)] md:grid md:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_minmax(190px,1fr)_auto] md:gap-4">
          <span>Client</span><span>Doctor</span><span>{view === "scheduled" ? "Meeting / record" : "Status"}</span><span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading medical reviews…</div>
        ) : visible.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center"><div><CheckCircle2 size={24} className="mx-auto text-emerald-300" /><p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">Nothing in this queue</p></div></div>
        ) : (
          <div className="divide-y divide-[var(--theme-border-soft)]">
            {visible.map((item) => {
              const signedCurrent = hasSignedCurrentMeeting(item);
              const occurred = scheduledMeetingHasOccurred(item);
              const needsFollowUpSignature = Boolean(item.clinicalRecord?.signedAt && item.outcome === "follow_up_required" && !signedCurrent);
              return (
                <article key={item._id} className="grid gap-3 px-4 py-4 hover:bg-[var(--theme-surface-soft)] md:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_minmax(190px,1fr)_auto] md:items-center md:gap-4 md:px-5">
                  <button type="button" onClick={() => setSelected(item)} className="min-w-0 text-left">
                    <p className="font-semibold text-[var(--theme-text)] hover:text-[#ff7ac7]">{item.contact.fullName}</p>
                    {!doctorOnly && <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">{item.contact.email || item.contact.phone || "No contact detail"}</p>}
                  </button>
                  <div className="text-xs text-[var(--theme-text-secondary)]">{item.assignedDoctor?.name || <span className="text-amber-300">Awaiting doctor</span>}</div>
                  <div className="text-xs text-[var(--theme-text-secondary)]">
                    {item.status === "scheduled" ? (
                      <div className="space-y-1"><span className="inline-flex items-center gap-1.5"><CalendarClock size={13} className="text-cyan-300" />{formatDate(item.scheduledAt)}</span><p className={signedCurrent ? "text-emerald-300" : "text-amber-300"}>{signedCurrent ? "Clinical record signed" : occurred ? "Clinical record required" : "Meeting pending"}</p></div>
                    ) : item.status === "completed" ? <span className="text-emerald-300">{humanize(item.outcome)}</span> : <span className="text-amber-300">Doctor assigned, meeting required</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {item.status !== "completed" && canSchedule && <Button type="button" variant="secondary" size="sm" onClick={() => openSchedule(item)}><CalendarClock size={14} /> {item.status === "scheduled" ? "Reschedule" : "Schedule"}</Button>}
                    {doctor && item.status === "scheduled" && occurred && !signedCurrent && (
                      <Button type="button" size="sm" onClick={() => openClinical(item, needsFollowUpSignature ? "follow_up" : "initial")}><FileSignature size={14} /> {needsFollowUpSignature ? "Sign follow-up" : "Complete & sign"}</Button>
                    )}
                    {doctor && item.status === "scheduled" && signedCurrent && (
                      <Button type="button" size="sm" onClick={() => { setOutcomeCase(item); setOutcome("cleared"); }}>Record outcome</Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--theme-border)] bg-[var(--theme-surface-raised)] px-5 py-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff7ac7]">Secure medical review</p><h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{selected.contact.fullName}</h2><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Doctor: {selected.assignedDoctor?.name || "Awaiting assignment"}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)]" aria-label="Close medical review"><X size={16} /></button>
            </header>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <InfoCard title="Client goals" value={selected.qualificationSummary?.goals || "Not provided on qualification form."} />
              <InfoCard title="Health, medication & medical history" value={selected.qualificationSummary?.healthNotes || "Not provided on qualification form."} />
              <InfoCard title="Start timeline" value={humanize(selected.qualificationSummary?.startTimeline)} />
              <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-4"><p className="text-xs font-semibold text-[var(--theme-text)]">Meeting</p><p className="mt-2 text-sm text-[var(--theme-text-secondary)]">{formatDate(selected.scheduledAt)}</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{humanize(selected.meetingProvider)}</p>{selected.meetingUrl && <a href={selected.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-[#ff7ac7]">Open meeting link</a>}</div>
            </div>

            {selected.clinicalRecord?.signedAt && (
              <section className="border-t border-[var(--theme-border)] px-5 py-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><LockKeyhole size={15} /> Signed clinical record</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Signed by {selected.clinicalRecord.signedByName} on {formatDate(selected.clinicalRecord.signedAt)}. Original record is read-only.</p></div>{doctor && <Button type="button" variant="secondary" size="sm" onClick={() => { setSelected(null); setCorrectionCase(selected); setCorrection({ text: "", signatureName: user?.name || "", attest: false }); }}>Add signed correction</Button>}</div>
                <div className="grid gap-3 sm:grid-cols-2"><InfoCard title="Meeting details" value={selected.clinicalRecord.meetingDetails || "Not recorded"} /><InfoCard title="Medical findings" value={selected.clinicalRecord.medicalFindings || "Not recorded"} /><InfoCard title="Medications" value={selected.clinicalRecord.medications || "None recorded"} /><InfoCard title="Restrictions" value={selected.clinicalRecord.restrictions || "None recorded"} /><InfoCard title="Recommendations" value={selected.clinicalRecord.recommendations || "None recorded"} /><InfoCard title="Client instructions" value={selected.clinicalRecord.clientInstructions || "None recorded"} /></div>
                {Boolean(selected.addenda?.length) && <div className="mt-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Signed addenda</p>{selected.addenda?.map((entry, index) => <div key={entry._id || index} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-3"><p className="text-xs font-semibold text-[var(--theme-text)]">{entry.kind === "follow_up" ? "Follow-up medical note" : "Correction addendum"}</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Signed by {entry.signedByName} on {formatDate(entry.signedAt)}</p>{entry.text && <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--theme-text-secondary)]">{entry.text}</p>}</div>)}</div>}
              </section>
            )}
          </div>
        </div>
      )}

      {scheduleCase && (
        <Modal title="Medical review meeting" subtitle={scheduleCase.contact.fullName} onClose={() => setScheduleCase(null)}>
          <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Date & time</FieldLabel><input type="datetime-local" value={schedule.scheduledAt} onChange={(event) => setSchedule((value) => ({ ...value, scheduledAt: event.target.value }))} className={inputClass} /></label><label><FieldLabel>Format</FieldLabel><select value={schedule.meetingProvider} onChange={(event) => setSchedule((value) => ({ ...value, meetingProvider: event.target.value }))} className={inputClass}><option value="video">Video</option><option value="phone">Phone</option><option value="in_person">In person</option></select></label></div>{schedule.meetingProvider === "video" && <label className="block"><FieldLabel>Video meeting link</FieldLabel><input value={schedule.meetingUrl} onChange={(event) => setSchedule((value) => ({ ...value, meetingUrl: event.target.value }))} className={inputClass} placeholder="Zoom, Google Meet, or approved video link" /></label>}<label className="block"><FieldLabel>Scheduling notes</FieldLabel><textarea rows={3} value={schedule.notes} onChange={(event) => setSchedule((value) => ({ ...value, notes: event.target.value }))} className={textareaClass} /></label></div>
          <ModalFooter><Button type="button" variant="ghost" size="sm" onClick={() => setScheduleCase(null)}>Cancel</Button><Button type="button" size="sm" disabled={busy || !schedule.scheduledAt || (schedule.meetingProvider === "video" && !schedule.meetingUrl)} onClick={() => void saveSchedule()}>{busy ? "Saving…" : "Save meeting"}</Button></ModalFooter>
        </Modal>
      )}

      {clinicalCase && (
        <Modal title={clinicalMode === "initial" ? "Complete & sign medical record" : "Complete & sign follow-up note"} subtitle={clinicalCase.contact.fullName} onClose={() => setClinicalCase(null)} wide>
          <div className="space-y-4"><div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs leading-5 text-amber-200">Once signed, this clinical record cannot be edited. A later correction must be added as a signed addendum. Client-facing instructions are stored separately and are not automatically released to the client.</div><label className="block"><FieldLabel>Meeting completed at *</FieldLabel><input type="datetime-local" value={clinical.meetingCompletedAt} onChange={(event) => setClinical((value) => ({ ...value, meetingCompletedAt: event.target.value }))} className={inputClass} /></label><label className="block"><FieldLabel>Meeting details *</FieldLabel><textarea rows={3} value={clinical.meetingDetails} onChange={(event) => setClinical((value) => ({ ...value, meetingDetails: event.target.value }))} className={textareaClass} placeholder="Confirm who attended, format, key discussion and review context" /></label><label className="block"><FieldLabel>Medical findings *</FieldLabel><textarea rows={4} value={clinical.medicalFindings} onChange={(event) => setClinical((value) => ({ ...value, medicalFindings: event.target.value }))} className={textareaClass} placeholder="Clinical assessment and findings" /></label>
<div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-4">
  <p className="text-xs font-semibold text-[var(--theme-text)]">Vitals</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-2">
    <label><FieldLabel>Height (cm)</FieldLabel><input type="number" min="0" value={clinical.vitalsHeightCm} onChange={(event) => setClinical((value) => ({ ...value, vitalsHeightCm: event.target.value }))} className={inputClass} /></label>
    <label><FieldLabel>Weight (kg)</FieldLabel><input type="number" min="0" value={clinical.vitalsWeightKg} onChange={(event) => setClinical((value) => ({ ...value, vitalsWeightKg: event.target.value }))} className={inputClass} /></label>
    <label><FieldLabel>Blood pressure</FieldLabel><input value={clinical.vitalsBloodPressure} onChange={(event) => setClinical((value) => ({ ...value, vitalsBloodPressure: event.target.value }))} className={inputClass} placeholder="120/80" /></label>
    <label><FieldLabel>Heart rate</FieldLabel><input type="number" min="0" value={clinical.vitalsHeartRate} onChange={(event) => setClinical((value) => ({ ...value, vitalsHeartRate: event.target.value }))} className={inputClass} /></label>
    <label><FieldLabel>Temperature (°C)</FieldLabel><input type="number" min="0" step="0.1" value={clinical.vitalsTemperatureC} onChange={(event) => setClinical((value) => ({ ...value, vitalsTemperatureC: event.target.value }))} className={inputClass} /></label>
    <label><FieldLabel>Blood glucose (mmol/L)</FieldLabel><input type="number" min="0" step="0.1" value={clinical.vitalsBloodGlucoseMmol} onChange={(event) => setClinical((value) => ({ ...value, vitalsBloodGlucoseMmol: event.target.value }))} className={inputClass} /></label>
  </div>
  <label className="mt-3 block"><FieldLabel>Vitals notes</FieldLabel><textarea rows={2} value={clinical.vitalsNotes} onChange={(event) => setClinical((value) => ({ ...value, vitalsNotes: event.target.value }))} className={textareaClass} /></label>
</div>
<div className="grid gap-4 sm:grid-cols-2">
  <label><FieldLabel>Allergies (one per line)</FieldLabel><textarea rows={3} value={clinical.allergies} onChange={(event) => setClinical((value) => ({ ...value, allergies: event.target.value }))} className={textareaClass} placeholder="e.g. penicillin" /></label>
  <label><FieldLabel>Problem list (one per line)</FieldLabel><textarea rows={3} value={clinical.problemList} onChange={(event) => setClinical((value) => ({ ...value, problemList: event.target.value }))} className={textareaClass} placeholder="e.g. hypertension" /></label>
  <label><FieldLabel>Medication history (one per line)</FieldLabel><textarea rows={3} value={clinical.medicationHistory} onChange={(event) => setClinical((value) => ({ ...value, medicationHistory: event.target.value }))} className={textareaClass} placeholder="e.g. metformin 500mg" /></label>
  <label><FieldLabel>Safety flags (one per line)</FieldLabel><textarea rows={3} value={clinical.safetyFlags} onChange={(event) => setClinical((value) => ({ ...value, safetyFlags: event.target.value }))} className={textareaClass} placeholder="e.g. high blood pressure" /></label>
</div>
<div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-4">
  <label className="flex items-start gap-3 text-sm text-[var(--theme-text-secondary)]"><input type="checkbox" checked={clinical.clinicalConsentGiven} onChange={(event) => setClinical((value) => ({ ...value, clinicalConsentGiven: event.target.checked }))} className="mt-1" /><span>Clinical consent recorded for this medical review</span></label>
  {clinical.clinicalConsentGiven && <label className="mt-3 block"><FieldLabel>Consent scope</FieldLabel><textarea rows={2} value={clinical.clinicalConsentScope} onChange={(event) => setClinical((value) => ({ ...value, clinicalConsentScope: event.target.value }))} className={textareaClass} /></label>}
</div><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Medications / drugs</FieldLabel><textarea rows={3} value={clinical.medications} onChange={(event) => setClinical((value) => ({ ...value, medications: event.target.value }))} className={textareaClass} /></label><label><FieldLabel>Restrictions / contraindications</FieldLabel><textarea rows={3} value={clinical.restrictions} onChange={(event) => setClinical((value) => ({ ...value, restrictions: event.target.value }))} className={textareaClass} /></label></div><label className="block"><FieldLabel>Clinical recommendations</FieldLabel><textarea rows={3} value={clinical.recommendations} onChange={(event) => setClinical((value) => ({ ...value, recommendations: event.target.value }))} className={textareaClass} /></label><label className="block"><FieldLabel>Instructions that may later be released to the client</FieldLabel><textarea rows={3} value={clinical.clientInstructions} onChange={(event) => setClinical((value) => ({ ...value, clientInstructions: event.target.value }))} className={textareaClass} /></label><div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-4"><label className="block"><FieldLabel>Signature name *</FieldLabel><input value={clinical.signatureName} onChange={(event) => setClinical((value) => ({ ...value, signatureName: event.target.value }))} className={inputClass} /></label><label className="mt-4 flex items-start gap-3 text-sm text-[var(--theme-text-secondary)]"><input type="checkbox" checked={clinical.attest} onChange={(event) => setClinical((value) => ({ ...value, attest: event.target.checked }))} className="mt-1" /><span>I confirm that I personally completed this medical review record and that it accurately reflects my clinical assessment at the time of signing.</span></label></div></div>
          <ModalFooter><Button type="button" variant="ghost" size="sm" onClick={() => setClinicalCase(null)}>Cancel</Button><Button type="button" size="sm" disabled={busy || !clinical.meetingCompletedAt || !clinical.meetingDetails.trim() || !clinical.medicalFindings.trim() || !clinical.signatureName.trim() || !clinical.attest} onClick={() => void signClinicalRecord()}><FileSignature size={14} /> {busy ? "Signing…" : "Sign & finalize"}</Button></ModalFooter>
        </Modal>
      )}

      {outcomeCase && (
        <Modal title="Medical clearance outcome" subtitle={outcomeCase.contact.fullName} onClose={() => setOutcomeCase(null)}>
          <div className="space-y-4"><div className="rounded-lg border border-emerald-500/20 bg-emerald-600/[0.05] px-4 py-3 text-xs text-emerald-200"><LockKeyhole size={14} className="mr-2 inline" />Clinical notes are already signed and protected. This step records only the disposition.</div><div className="grid gap-2 sm:grid-cols-3">{[["cleared", "Cleared", "Move to Payment Pending"],["follow_up_required", "Follow-up", "Keep in Medical Review"],["not_cleared", "Not cleared", "Move to Nurture"]].map(([value, label, description]) => <button key={value} type="button" onClick={() => setOutcome(value)} className={`rounded-lg border p-3 text-left ${outcome === value ? "border-[#0d9488]/60 bg-[#0d9488]/10" : "border-[var(--theme-border)] bg-[var(--theme-page)]"}`}><p className="text-sm font-semibold text-[var(--theme-text)]">{label}</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{description}</p></button>)}</div></div>
          <ModalFooter><Button type="button" variant="ghost" size="sm" onClick={() => setOutcomeCase(null)}>Cancel</Button><Button type="button" size="sm" disabled={busy} onClick={() => void saveOutcome()}>{busy ? "Saving…" : "Save outcome"}</Button></ModalFooter>
        </Modal>
      )}

      {correctionCase && (
        <Modal title="Signed correction addendum" subtitle={correctionCase.contact.fullName} onClose={() => setCorrectionCase(null)}>
          <div className="space-y-4"><div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-4 py-3 text-xs text-[var(--theme-text-secondary)]">The original signed record remains unchanged. This correction is appended with your identity and signing time.</div><label className="block"><FieldLabel>Correction / clarification *</FieldLabel><textarea rows={5} value={correction.text} onChange={(event) => setCorrection((value) => ({ ...value, text: event.target.value }))} className={textareaClass} /></label><label className="block"><FieldLabel>Signature name *</FieldLabel><input value={correction.signatureName} onChange={(event) => setCorrection((value) => ({ ...value, signatureName: event.target.value }))} className={inputClass} /></label><label className="flex items-start gap-3 text-sm text-[var(--theme-text-secondary)]"><input type="checkbox" checked={correction.attest} onChange={(event) => setCorrection((value) => ({ ...value, attest: event.target.checked }))} className="mt-1" /><span>I confirm this addendum is accurate and is being signed by me.</span></label></div>
          <ModalFooter><Button type="button" variant="ghost" size="sm" onClick={() => setCorrectionCase(null)}>Cancel</Button><Button type="button" size="sm" disabled={busy || !correction.text.trim() || !correction.signatureName.trim() || !correction.attest} onClick={() => void saveCorrection()}>{busy ? "Signing…" : "Sign addendum"}</Button></ModalFooter>
        </Modal>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">{children}</span>;
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] p-4"><p className="text-xs font-semibold text-[var(--theme-text)]">{title}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--theme-text-secondary)]">{value}</p></div>;
}

function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`max-h-[92vh] w-full overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}><header className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--theme-border)] bg-[var(--theme-surface-raised)] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff7ac7]">Protected clinical workflow</p><h2 className="mt-1 text-lg font-semibold text-[var(--theme-text)]">{title}</h2><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{subtitle}</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)]" aria-label="Close"><X size={16} /></button></header><div className="px-5 py-5">{children}</div></div></div>;
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="-mx-5 -mb-5 mt-5 flex justify-end gap-2 border-t border-[var(--theme-border)] px-5 py-4">{children}</div>;
}
