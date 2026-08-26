"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { FileText, Check, Lock, Flag, Stethoscope, UserCheck, Link2, Package, CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import CustomFieldsEditor from "../../../components/custom-fields/CustomFieldsEditor";
import RecordForms from "../../../components/forms/RecordForms";

type RequestStatus = "pending" | "contacted" | "approved" | "declined";

type TimelineEvent = {
  at?: string;
  by?: string;
  method?: string;
  doctorName?: string;
  amount?: number;
  matched?: boolean;
  amountReceived?: number;
  expected?: number;
  paymentAmount?: number;
  ledgerMismatch?: boolean;
  note?: string;
};

type Doctor = {
  _id: string;
  name: string;
  roles?: string[];
  isActive?: boolean;
};

type RequestStage = {
  key: string;
  label: string;
  done: boolean;
  event?: TimelineEvent | null;
  showBy: boolean;
  red?: boolean;
  amber?: boolean;
  blue?: boolean;
};

type ProgramReconciliation = {
  status?: "pending" | "matched" | "mismatch";
  amountReceived?: number;
  expected?: number;
  paymentId?: string;
  paymentAmount?: number;
  ledgerMismatch?: boolean;
  method?: string;
  note?: string;
  at?: string;
  byName?: string;
};

type AdminReconciliationReview = {
  completed?: boolean;
  note?: string;
  at?: string;
  byName?: string;
};

type FinalReconciliation = {
  completed?: boolean;
  note?: string;
  at?: string;
  byName?: string;
};

function extractApplications(value: unknown): ApplicationRequest[] {
  if (Array.isArray(value)) return value as ApplicationRequest[];

  if (typeof value !== "object" || value === null) return [];

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.requests)) return record.requests as ApplicationRequest[];
  if (Array.isArray(record.applications)) return record.applications as ApplicationRequest[];

  if ("data" in record) return extractApplications(record.data);

  return [];
}

function extractDoctors(value: unknown): Doctor[] {
  if (Array.isArray(value)) return value as Doctor[];

  if (typeof value !== "object" || value === null) return [];

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.doctors)) return record.doctors as Doctor[];
  if (Array.isArray(record.users)) return record.users as Doctor[];
  if (Array.isArray(record.staff)) return record.staff as Doctor[];

  return [];
}

type ApplicationRequest = {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  healthNotes?: string;
  goals?: string;
  programInterest?: string;
  status?: RequestStatus;
  paid?: boolean;
  clientArchived?: boolean;
  program?: string;
  clientId?: string;
  linkSent?: boolean;
  timeline?: Record<string, TimelineEvent | undefined>;
  source?: string;
  consultationDecision?: string;
  assignedDoctor?: Doctor | null;
  consultationPaid?: boolean;
  consultationReconciled?: boolean;
  reconciled?: boolean;
  programReconciliation?: ProgramReconciliation | null;
  adminReconciliationReview?: AdminReconciliationReview | null;
  finalReconciliation?: FinalReconciliation | null;
  createdAt?: string;
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  contacted: "bg-blue-500/10 text-blue-400",
  approved: "bg-green-500/10 text-green-400",
  declined: "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]",
};

const STATUS_OPTIONS: RequestStatus[] = ["pending", "contacted", "approved", "declined"];

function getRequestId(req: ApplicationRequest) {
  return req._id || req.id || "";
}

function getRequestName(req: ApplicationRequest) {
  return req.fullName || req.name || [req.firstName, req.lastName].filter(Boolean).join(" ") || "Anonymous";
}

function getWaitTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

function esc(s?: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openApplicationDoc(r: ApplicationRequest) {
  const w = window.open("", "_blank", "width=820,height=980");
  if (!w) return;
  const html = `<!doctype html><html><head><title>Application - ${esc(getRequestName(r))}</title>
  <style>
    body { font-family: -apple-system, 'Segoe UI', sans-serif; margin: 0; background: #f5f5f5; color: #111; }
    .sheet { max-width: 720px; margin: 24px auto; background: white; padding: 48px 56px; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo { width: 34px; height: 34px; border-radius: 50%; background: #0d9488; color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    h1 { font-size: 20px; margin: 18px 0 2px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
    .row { margin-bottom: 16px; }
    .label { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #0d9488; font-weight: 700; margin-bottom: 4px; }
    .value { font-size: 14px; line-height: 1.55; white-space: pre-wrap; }
    .printbar { position: fixed; top: 12px; right: 12px; }
    .printbar button { background: #0d9488; color: white; border: 0; border-radius: 999px; padding: 10px 18px; font-size: 13px; cursor: pointer; }
    @media print { .printbar { display: none; } .sheet { margin: 0; box-shadow: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="sheet">
    <div class="brand"><div class="logo">F</div><strong>KHAIRO</strong></div>
    <h1>Membership Application — ${esc(getRequestName(r))}</h1>
    <div class="meta">Submitted ${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""} · Status: ${esc(r.status || "pending")}</div>
    <div class="row"><div class="label">Contact</div><div class="value">${esc(r.email || "—")} · ${esc(r.phone || "—")}</div></div>
    <div class="row"><div class="label">Program interest</div><div class="value">${esc(r.programInterest || "—")}</div></div>
    <div class="row"><div class="label">Goals</div><div class="value">${esc(r.goals || "—")}</div></div>
    <div class="row"><div class="label">Health notes</div><div class="value">${esc(r.healthNotes || "—")}</div></div>
  </div></body></html>`;
  w.document.write(html);
  w.document.close();
}

function StepRow({
  icon: Icon,
  title,
  done,
  warning,
  locked,
  lockedReason,
  children,
  isLast,
}: {
  icon: LucideIcon;
  title: string;
  done: boolean;
  warning?: boolean;
  locked?: boolean;
  lockedReason?: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`relative flex items-start gap-2.5 sm:gap-3 lg:rounded-xl lg:border lg:p-4 ${
        warning
          ? "lg:border-amber-500/30 lg:bg-amber-500/[0.05]"
          : "lg:border-white/10 lg:bg-black/20"
      }`}
    >
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--theme-surface-soft)] lg:hidden" />
      )}

      <div
        className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
          warning
            ? "border-amber-400 bg-amber-500/15"
            : done
              ? "border-[#0d9488] bg-[#0d9488]/15"
              : "border-[var(--theme-border)] bg-[var(--theme-surface)]"
        }`}
      >
        {locked ? (
          <Lock size={12} className="text-[var(--theme-text-muted)]" />
        ) : (
          <Icon
            size={14}
            className={
              warning
                ? "text-amber-400"
                : done
                  ? "text-[#0d9488]"
                  : "text-[var(--theme-text-muted)]"
            }
          />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-4 sm:pb-5 lg:pb-0">
        <div className="flex items-center gap-1.5 pt-1">
          <p
            className={`text-sm font-medium ${
              warning
                ? "text-amber-300"
                : locked
                  ? "text-[var(--theme-text-secondary)]"
                  : "text-white"
            }`}
          >
            {title}
          </p>

          {done && !warning && (
            <Check size={13} className="text-emerald-600" />
          )}

          {warning && (
            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-400">
              Attention
            </span>
          )}
        </div>

        <div
          className={`mt-2 [&_button]:min-h-10 [&_select]:min-h-10 [&_input:not([type="checkbox"])]:min-h-10 ${
            locked ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {children}
        </div>

        {locked && lockedReason && (
          <p className="mt-1.5 text-[11px] leading-4 text-[var(--theme-text-muted)]">
            {lockedReason}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const { hasRole } = useAuth();

  const canSalesWorkflow =
    hasRole("admin", "sales");

  const canReconcileWorkflow =
    hasRole("admin", "coach");

  const [requests, setRequests] = useState<ApplicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [customFieldsOpen, setCustomFieldsOpen] = useState<Record<string, boolean>>({});
  const [nudging, setNudging] = useState(false);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [reconId, setReconId] = useState<string | null>(null);
  const [reconAmount, setReconAmount] = useState("");
  const [reconSaving, setReconSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", email: "", phone: "", programInterest: "not_sure", goals: "", healthNotes: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultFee, setConsultFee] = useState(0);
  const [consultReconId, setConsultReconId] = useState<string | null>(null);
  const [consultReconAmount, setConsultReconAmount] = useState("");
  const [adminReviewId, setAdminReviewId] = useState<string | null>(null);
  const [adminReviewNote, setAdminReviewNote] = useState("");
  const [adminReviewSaving, setAdminReviewSaving] = useState(false);
  const [finalReconId, setFinalReconId] = useState<string | null>(null);
  const [finalReconNote, setFinalReconNote] = useState("");
  const [finalReconSaving, setFinalReconSaving] = useState(false);

  const fetchRequests = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<unknown>("/applications", { params: { limit: 50 } });
      setRequests(extractApplications(res));
    } catch (err) {
      setRequests([]);
      setError(err instanceof Error ? err.message : "Could not load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const t = setInterval(() => fetchRequests(true), 30000);
    const onVis = () => { if (document.visibilityState === "visible") fetchRequests(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchRequests]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<unknown>("/auth/doctors");
        const list = extractDoctors(res);
        if (list.length) { setDoctors(list); return; }
      } catch {}
      try {
        const res = await api.get<unknown>("/auth/directory");
        const list = extractDoctors(res);
        setDoctors(list.filter((u) => (u.roles || []).includes("doctor") && u.isActive !== false));
      } catch {}
    })();
    api.get<{ fee?: number }>("/settings/consultation-fee")
      .then((res) => setConsultFee(res.fee || 0))
      .catch(() => {});
  }, []);

  const updateStatus = async (id: string, status: RequestStatus) => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    if (!id) return;
    setUpdatingId(id);
    try {
      await api.patch(`/applications/${id}`, { status });
      await fetchRequests();
    } catch (err) {
      alert(getErrorMessage(err, "Could not update request."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentLink = async (req: ApplicationRequest, program: string) => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    const reqId = getRequestId(req);
    if (!reqId) return;
    setUpdatingId(reqId);
    try {
      let clientId = "";
      if (!req.clientId) {
        if (!program) { setUpdatingId(null); return; }
        const approveRes = await api.post<{ client?: { _id?: string } }>(
          `/applications/${reqId}/approve`,
          { program: program.toLowerCase() }
        );
        clientId = approveRes.client?._id || "";
      } else {
        clientId = req.clientId || "";
      }
      
      const linkRes = await api.post<{ authorizationUrl: string }>(`/clients/${clientId}/payment-link`);
      const url = linkRes.authorizationUrl;
      await navigator.clipboard.writeText(url);
      const alsoEmail = window.confirm(`Payment link copied!\n\nAlso send it by email to ${req.email}?`);
      if (alsoEmail) {
        try {
          await api.post(`/clients/${clientId}/email-payment-link`);
          alert(`Email sent to ${req.email}!`);
        } catch (e) {
          alert(`Link copied, but email failed: ${getErrorMessage(e, "try again")}`);
        }
      } else {
        alert(`Payment link copied to clipboard!\n\n${url}`);
      }
      await fetchRequests();
    } catch (err) {
      alert(getErrorMessage(err, "Could not generate payment link."));
    } finally {
      setUpdatingId(null);
    }
  };



  const reconcile = async (r: ApplicationRequest) => {
    if (!canReconcileWorkflow) {
      alert("This action is available to Admin and Coach.");
      return;
    }
    const amt = Number(reconAmount);
    if (!amt || amt <= 0) { alert("Enter the exact amount received."); return; }
    setReconSaving(true);
    try {
      const res = await api.post<{ matched?: boolean }>(`/clients/${r.clientId}/reconcile`, { amountReceived: amt });
      if (res.matched === false) alert("Recorded with a MISMATCH - an admin should review the difference.");
      setReconId(null);
      setReconAmount("");
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not reconcile."));
    } finally {
      setReconSaving(false);
    }
  };

  const completeAdminReview = async (r: ApplicationRequest) => {
    if (!canReconcileWorkflow) {
      alert("This action is available to Admin and Coach.");
      return;
    }
    const note = adminReviewNote.trim();

    if (!r.clientId) {
      alert("This request is not linked to a client record.");
      return;
    }

    if (!note) {
      alert("Enter the Reconciliation Check-in resolution note.");
      return;
    }

    setAdminReviewSaving(true);

    try {
      await api.post(
        `/clients/${r.clientId}/admin-reconciliation-review`,
        { note }
      );

      setAdminReviewId(null);
      setAdminReviewNote("");
      await fetchRequests();
    } catch (e) {
      alert(
        getErrorMessage(
          e,
          "Could not complete Reconciliation Check-in. Staff access is required."
        )
      );
    } finally {
      setAdminReviewSaving(false);
    }
  };

  const completeFinalReconciliation = async (r: ApplicationRequest) => {
    if (!canReconcileWorkflow) {
      alert("This action is available to Admin and Coach.");
      return;
    }
    if (!r.clientId) {
      alert("This request is not linked to a client record.");
      return;
    }

    setFinalReconSaving(true);

    try {
      await api.post(
        `/clients/${r.clientId}/final-reconcile`,
        { note: finalReconNote.trim() }
      );

      setFinalReconId(null);
      setFinalReconNote("");

      await fetchRequests();
    } catch (e) {
      alert(
        getErrorMessage(
          e,
          "Could not complete Final Reconciliation. Staff access is required."
        )
      );
    } finally {
      setFinalReconSaving(false);
    }
  };

  const submitAddRequest = async () => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    if (!addForm.fullName || !addForm.phone) { alert("Name and phone are required."); return; }
    setAddSaving(true);
    try {
      await api.post("/applications/manual", addForm);
      setShowAddForm(false);
      setAddForm({ fullName: "", email: "", phone: "", programInterest: "not_sure", goals: "", healthNotes: "" });
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not add request."));
    } finally {
      setAddSaving(false);
    }
  };

  const updateConsultation = async (id: string, patch: Record<string, unknown>) => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    try {
      await api.patch(`/applications/${id}/consultation`, patch);
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not update consultation."));
    }
  };

  const sendConsultLink = async (r: ApplicationRequest) => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    const reqId = getRequestId(r);
    setUpdatingId(reqId);
    try {
      const res = await api.post<{ authorizationUrl: string; amount?: number }>(`/applications/${reqId}/consultation-link`);
      await navigator.clipboard.writeText(res.authorizationUrl);
      alert(`Consultation link copied (₦${Number(res.amount || 0).toLocaleString()})!\n\n${res.authorizationUrl}`);
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not generate consultation link."));
    } finally {
      setUpdatingId(null);
    }
  };

  const reconcileConsult = async (r: ApplicationRequest) => {
    if (!canReconcileWorkflow) {
      alert("This action is available to Admin and Coach.");
      return;
    }
    const reqId = getRequestId(r);
    const amt = Number(consultReconAmount);
    if (!amt || amt <= 0) { alert("Enter the exact amount received."); return; }
    try {
      const res = await api.post<{ matched?: boolean }>(
        `/applications/${reqId}/reconcile-consultation`,
        { amountReceived: amt }
      );
      if (res.matched === false) alert("Recorded with a MISMATCH - an admin should review the difference.");
      setConsultReconId(null);
      setConsultReconAmount("");
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not reconcile consultation."));
    }
  };

  const nudgeStuck = async () => {
    if (!canSalesWorkflow) {
      alert("This action is available to Admin and Sales.");
      return;
    }
    if (!window.confirm("Send a friendly nudge email to every lead stuck at Contacted for 3+ days?")) return;
    setNudging(true);
    try {
      const res = await api.post<{ sent: number; total: number }>("/applications/nudge-stuck");
      alert(`Done: ${res.sent} of ${res.total} stuck leads emailed.`);
      await fetchRequests();
    } catch (e) {
      alert(getErrorMessage(e, "Could not send nudges."));
    } finally {
      setNudging(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const nextStepFor = (r: ApplicationRequest): string => {
    const nm = getRequestName(r);
    const prog = r.programInterest ? " (" + r.programInterest + ")" : "";

    if (r.status === "declined") {
      return nm + " was declined - no action needed";
    }

    if (r.programReconciliation?.status === "mismatch") {
      if (!r.adminReconciliationReview?.completed) {
        return nm + " has a program payment mismatch - Reconciliation Check-in is required";
      }

      if (!r.finalReconciliation?.completed) {
        return nm + " completed Reconciliation Check-in - Final Reconciliation is required";
      }
    }

    if (r.reconciled) {
      return nm + " completed reconciliation and is ready for the client roster";
    }

    if (r.paid) {
      return nm + " has paid - complete Program Reconciliation";
    }

    if (r.linkSent) {
      return nm + " received the payment link - waiting for payment";
    }

    if (r.status === "approved") {
      return nm + " is approved - choose a program and send the payment link";
    }

    const consultYes = r.consultationDecision === "yes";
    const consultDone =
      (!!r.consultationPaid || !!r.timeline?.consultationPaid) &&
      (!!r.consultationReconciled || !!r.timeline?.consultationReconciled);

    if (consultYes && consultDone) {
      return nm + " finished consultation - approve and choose a program";
    }

    if (consultYes && r.assignedDoctor) {
      return nm + prog + " is waiting on consultation payment and reconciliation";
    }

    if (consultYes) {
      return nm + prog + " accepted consultation - assign a doctor";
    }

    if (r.consultationDecision === "no") {
      return nm + " does not require consultation - continue to program selection";
    }

    if (r.status === "contacted") {
      return nm + " has been contacted - record the consultation decision";
    }

    return nm + " applied " + getWaitTime(r.createdAt) + " ago - make first contact today";
  };

  const tickerItems = (() => {
    if (loading) return ["Reading the pipeline…"];
    const items: string[] = [];
    if (requests.length === 0) {
      return ["the requests pipeline is empty right now — share the application link to bring in new leads"];
    }
    items.push(
      "the pipeline holds " + requests.length + " lead" + (requests.length === 1 ? "" : "s") +
      (pendingCount > 0 ? " — " + pendingCount + " still awaiting a first reply" : " — every lead has been replied to")
    );
    const stuck = requests.filter((r) => !r.paid && (r.status === "pending" || r.status === "contacted") && r.createdAt && Date.now() - new Date(r.createdAt).getTime() > 3 * 86400000);
    if (stuck.length > 0) {
      items.push(stuck.length + " lead" + (stuck.length === 1 ? " has" : "s have") + " gone quiet for 3+ days: " + stuck.slice(0, 3).map((r) => getRequestName(r)).join(", ") + " — the Nudge button emails them for you");
    } else {
      items.push("no lead has gone quiet for 3+ days — nice pace");
    }
    const active = requests.filter(
      (r) => r.status !== "declined" && !r.reconciled
    );
    active.slice(0, 3).forEach((r) => items.push(nextStepFor(r)));
    if (active.length > 3) items.push("...and " + (active.length - 3) + " more moving through the pipeline");
    const done = requests.filter((r) => r.reconciled);
    if (done.length > 0) {
      items.push(done.length + " fully enrolled so far: " + done.slice(0, 3).map((r) => getRequestName(r) + " (" + (r.program || "—") + ")").join(", "));
    }
    return items;
  })();

  return (
    <div className="[&_button]:min-h-10 [&_input]:min-h-10 [&_select]:min-h-10 [&_textarea]:min-h-10 lg:[&_button]:min-h-0 lg:[&_input]:min-h-0 lg:[&_select]:min-h-0 lg:[&_textarea]:min-h-0">
      <PageTicker items={tickerItems} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-white">Membership / Trial Requests</h1>
        {canSalesWorkflow && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={nudgeStuck}
              disabled={nudging}
              className="whitespace-nowrap rounded-full border border-amber-500/40 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
            >
              {nudging ? "Nudging…" : "Nudge stuck leads (3d+)"}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="whitespace-nowrap rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              {showAddForm ? "Close" : "+ Add Request"}
            </button>
          </div>
        )}
      </div>
      {canSalesWorkflow && showAddForm && (
        <div className="mt-4 rounded-sm border border-[#0d9488]/30 bg-[var(--theme-surface)] p-4">
          <p className="text-sm font-medium text-white">Add a walk-in / phone request</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="Full name *" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="Phone *" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            <input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="Email (optional)" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            <select value={addForm.programInterest} onChange={(e) => setAddForm({ ...addForm, programInterest: e.target.value })} className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]">
              <option value="semaglutide" className="bg-[var(--theme-surface)]">Semaglutide</option>
              <option value="tirzepatide" className="bg-[var(--theme-surface)]">Tirzepatide</option>
              <option value="liraglutide" className="bg-[var(--theme-surface)]">Liraglutide</option>
              <option value="dulaglutide" className="bg-[var(--theme-surface)]">Dulaglutide</option>
              <option value="exenatide" className="bg-[var(--theme-surface)]">Exenatide</option>
              <option value="retatrutide" className="bg-[var(--theme-surface)]">Retatrutide</option>
              <option value="phentermine" className="bg-[var(--theme-surface)]">Phentermine</option>
              <option value="topiramate" className="bg-[var(--theme-surface)]">Topiramate</option>
              <option value="naltrexone" className="bg-[var(--theme-surface)]">Naltrexone</option>
              <option value="bupropion" className="bg-[var(--theme-surface)]">Bupropion</option>
              <option value="orlistat" className="bg-[var(--theme-surface)]">Orlistat</option>
              <option value="metformin" className="bg-[var(--theme-surface)]">Metformin</option>
              <option value="acarbose" className="bg-[var(--theme-surface)]">Acarbose</option>
              <option value="fiber_supplements" className="bg-[var(--theme-surface)]">Fiber supplements</option>
              <option value="protein_nutrition" className="bg-[var(--theme-surface)]">Protein/nutrition products</option>
              <option value="not_sure" className="bg-[var(--theme-surface)]">Not sure</option>
            </select>
            <input value={addForm.goals} onChange={(e) => setAddForm({ ...addForm, goals: e.target.value })} placeholder="Goals" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] sm:col-span-2" />
            <input value={addForm.healthNotes} onChange={(e) => setAddForm({ ...addForm, healthNotes: e.target.value })} placeholder="Health notes" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] sm:col-span-2" />
          </div>
          <button onClick={submitAddRequest} disabled={addSaving} className="mt-3 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {addSaving ? "Saving…" : "Add to pipeline"}
          </button>
        </div>
      )}

      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
        Online applications and staff-added walk-ins. {pendingCount > 0 && (
          <span className="text-[#0d9488]">{pendingCount} awaiting a response.</span>
        )}
      </p>


      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-[var(--theme-text-secondary)]">Loading…</p>
        ) : error ? (
          <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-4 sm:p-6 text-center">
            <p className="text-sm font-medium text-red-400">Could not load requests</p>
            <p className="mt-2 text-xs text-red-300">{error}</p>
            <p className="mt-3 text-xs text-[var(--theme-text-secondary)]">Check your connection or try refreshing the page</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6 text-center text-sm text-[var(--theme-text-secondary)]">
            No requests yet.
          </div>
        ) : (
          requests.map((r, index) => {
            const reqId = getRequestId(r);
            const mobileKey = reqId || String(index);
            const status = (r.status as RequestStatus) || "pending";
            const approvedNow = status === "approved";
            const chosen = approvedNow ? picked[reqId] || r.program || "" : "";
            const docId = typeof r.assignedDoctor === "string" ? r.assignedDoctor : (r.assignedDoctor?._id || "");
            const consultYes = r.consultationDecision === "yes";
            const consultPaidDone = !!r.consultationPaid || !!r.timeline?.consultationPaid;
            const consultReconDone = !!r.consultationReconciled || !!r.timeline?.consultationReconciled;
            const programBlocked = consultYes && !consultReconDone && !r.paid;

            // Sequential gates: each step's controls stay locked until the step before it is genuinely confirmed.
            const consultationDecided =
              r.consultationDecision === "yes" ||
              r.consultationDecision === "no";
            const doctorStepLocked = status === "pending" || !consultationDecided;
            const doctorAssigned = !!r.assignedDoctor;
            const consultPaymentStepLocked = consultYes && !doctorAssigned;
            const consultFullyDone = consultPaidDone && consultReconDone;
            const programStepLocked = status === "pending" || (consultYes ? !consultFullyDone : !consultationDecided);

            const programRecon = r.programReconciliation;
            const programMismatch =
              programRecon?.status === "mismatch" ||
              (programRecon == null &&
                !!r.timeline?.programMismatch);

            const adminReviewDone =
              r.adminReconciliationReview?.completed === true ||
              (r.adminReconciliationReview == null &&
                !!r.timeline?.adminReview);

            const finalReconDone =
              r.finalReconciliation?.completed === true ||
              (r.finalReconciliation == null &&
                !!r.timeline?.finalReconciled);

            const programReconDone =
              !!r.reconciled ||
              programRecon?.status === "matched" ||
              (!!r.timeline?.reconciled &&
                r.timeline.reconciled.matched !== false);

            const enteredAmount =
              programRecon?.amountReceived ??
              r.timeline?.programMismatch?.amountReceived ??
              r.timeline?.reconciled?.amountReceived;

            const expectedAmount =
              programRecon?.expected ??
              r.timeline?.programMismatch?.expected ??
              r.timeline?.reconciled?.expected;

            const paymentLedgerAmount =
              programRecon?.paymentAmount;

            const ledgerMismatch =
              programRecon?.ledgerMismatch === true;

            const programReconEvent: TimelineEvent | undefined =
              r.timeline?.programMismatch ||
              r.timeline?.reconciled ||
              (programRecon?.status &&
              programRecon.status !== "pending"
                ? {
                    at: programRecon.at,
                    by: programRecon.byName,
                    amountReceived: programRecon.amountReceived,
                    expected: programRecon.expected,
                    paymentAmount: programRecon.paymentAmount,
                    ledgerMismatch: programRecon.ledgerMismatch,
                    matched: programRecon.status === "matched",
                    note: programRecon.note,
                  }
                : undefined);

            const adminReviewEvent: TimelineEvent | undefined =
              r.timeline?.adminReview ||
              (r.adminReconciliationReview?.completed
                ? {
                    at: r.adminReconciliationReview.at,
                    by: r.adminReconciliationReview.byName,
                    note: r.adminReconciliationReview.note,
                  }
                : undefined);

            const finalReconEvent: TimelineEvent | undefined =
              r.timeline?.finalReconciled ||
              (r.finalReconciliation?.completed
                ? {
                    at: r.finalReconciliation.at,
                    by: r.finalReconciliation.byName,
                    note: r.finalReconciliation.note,
                  }
                : undefined);

            const stages: RequestStage[] = [
              { key: "applied", label: r.source === "manual" ? "Staff entry" : "Applied", done: true, event: r.timeline?.applied || { at: r.createdAt }, showBy: false },
              { key: "contacted", label: "Contacted", done: status !== "pending", event: r.timeline?.contacted, showBy: true },
              { key: "drAssigned", label: "Dr assigned", done: !!r.assignedDoctor, event: r.timeline?.doctorAssigned, showBy: true },
              ...(status === "declined"
                ? [{ key: "declined", label: "Declined", done: true, red: true, event: r.timeline?.declined, showBy: true }]
                : [
                    ...(consultYes ? [
                      { key: "consultPaid", label: "Consult paid", done: consultPaidDone, blue: true, event: r.timeline?.consultationPaid, showBy: true },
                      { key: "consultRecon", label: "Consult recon", done: consultReconDone, blue: true, event: r.timeline?.consultationReconciled, showBy: true },
                    ] : []),
                    { key: "approved", label: "Approved", done: status === "approved" || !!r.paid, event: r.timeline?.approved, showBy: true },
                    { key: "linkSent", label: "Link sent", done: !!r.linkSent, event: r.timeline?.linkSent, showBy: true },
                    { key: "paid", label: "Paid", done: !!r.paid, event: r.timeline?.paid, showBy: true },
                    {
                      key: "programRecon",
                      label: programMismatch ? "Program mismatch" : "Program recon",
                      done: programReconDone || programMismatch,
                      amber: programMismatch,
                      event: programReconEvent,
                      showBy: true,
                    },
                    ...(programMismatch
                      ? [
                          {
                            key: "adminReview",
                            label: "Reconciliation Check-in",
                            done: adminReviewDone,
                            event: adminReviewEvent,
                            showBy: true,
                          },
                          {
                            key: "finalReconciled",
                            label: "Final recon",
                            done: finalReconDone,
                            event: finalReconEvent,
                            showBy: true,
                          },
                        ]
                      : []),
                  ]),
            ];
            const finePrint = stages
              .filter(
                (s): s is RequestStage & { event: TimelineEvent } =>
                  Boolean(s.done && s.event)
              )
              .map((s) => {
                const when = s.event.at
                  ? new Date(s.event.at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )
                  : "";

                if (!s.showBy) {
                  return (s.event && s.event.method === "manual") ||
                    r.source === "manual"
                    ? `Added manually by ${s.event?.by || "Staff"} ${when}`
                    : `Submitted ${when}`;
                }

                if (s.key === "drAssigned") {
                  const docName =
                    s.event.doctorName ||
                    doctors.find(
                      (d) => d._id === r.assignedDoctor?._id
                    )?.name ||
                    "Doctor";

                  return `Dr assigned: ${docName} by ${s.event.by || "Staff"} ${when}`;
                }

                if (s.key === "consultPaid") {
                  return `Consultation paid ₦${Number(
                    s.event.amount || 0
                  ).toLocaleString()} by ${s.event.by || "Staff"} ${when}`;
                }

                if (s.key === "consultRecon") {
                  if (s.event.matched === false) {
                    return `Consultation mismatch by ${s.event.by || "Staff"}: ₦${Number(
                      s.event.amountReceived || 0
                    ).toLocaleString()} vs ₦${Number(
                      s.event.expected || 0
                    ).toLocaleString()} ${when}`;
                  }

                  return `Consultation reconciled by ${s.event.by || "Staff"} ${when}`;
                }

                if (s.key === "programRecon") {
                  if (programMismatch) {
                    const ledger =
                      paymentLedgerAmount != null
                        ? `; ledger ₦${Number(
                            paymentLedgerAmount
                          ).toLocaleString()}`
                        : "";

                    return `Program mismatch by ${s.event.by || programRecon?.byName || "Staff"}: entered ₦${Number(
                      enteredAmount || 0
                    ).toLocaleString()} vs expected ₦${Number(
                      expectedAmount || 0
                    ).toLocaleString()}${ledger} ${when}`;
                  }

                  return `Program reconciled by ${s.event.by || "Staff"} ${when}`;
                }

                if (s.key === "adminReview") {
                  const note = s.event.note
                    ? `: ${s.event.note}`
                    : "";

                  return `Reconciliation Check-in by ${s.event.by || "Staff"}${note} ${when}`;
                }

                if (s.key === "finalReconciled") {
                  return `Final reconciliation by ${s.event.by || "Staff"} ${when}`;
                }

                const method =
                  s.event.method &&
                  s.event.method !== "paystack"
                    ? ` (${s.event.method})`
                    : "";

                return `${s.label} by ${s.event.by || "Staff"}${method} ${when}`;
              });

            return (
              <div
                key={reqId || index}
                className="overflow-hidden rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm"
              >
                {/* Header */}
                <div className="border-b border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 min-[360px]:px-4 sm:px-5 sm:py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{getRequestName(r)}</h3>
                      {r.source === "manual" && (
                        <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-medium text-purple-300" title="Entered manually by staff (walk-in / phone)">Walk-in</span>
                      )}
                      <button
                        onClick={() => openApplicationDoc(r)}
                        className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--theme-border)] bg-black/40 px-2.5 py-1 text-[10px] text-[var(--theme-text-secondary)] hover:text-white"
                        title="Open full application as a document"
                      >
                        <FileText size={11} /> Application
                      </button>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{r.email || "No email"} • {r.phone || "No phone"}</p>
                  {r.clientId && r.program ? (
                    <p className="mt-1 text-xs text-green-400">Enrolled in: <span className="capitalize">{r.program}</span>{r.programInterest && r.programInterest !== r.program ? ` · initially ${r.programInterest}` : ""}</p>
                  ) : (
                    r.programInterest && <p className="mt-1 text-xs text-[#0d9488]">Interested in: {r.programInterest}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "Recently"}
                    {r.createdAt && status === "pending" && (
                      <span className="ml-2 font-medium text-yellow-400">• Waiting {getWaitTime(r.createdAt)}</span>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRequests((current) => ({
                        ...current,
                        [mobileKey]: !current[mobileKey],
                      }))
                    }
                    className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-xs font-medium text-[var(--theme-text-secondary)] lg:hidden"
                    aria-expanded={!!expandedRequests[mobileKey]}
                  >
                    {expandedRequests[mobileKey] ? "Hide workflow" : "Open workflow"}
                    {expandedRequests[mobileKey] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Vertical stepper - each step gated behind the one before it */}
                <div className={`${expandedRequests[mobileKey] ? "grid" : "hidden"} gap-x-4 gap-y-2 px-3 py-3 min-[360px]:px-4 sm:px-5 sm:py-5 lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`}>
                  <StepRow icon={Flag} title="Status" done={status !== "pending"}>
                    <select
                      value={status}
                      disabled={!canSalesWorkflow || updatingId === reqId || !!r.paid}
                      title={r.paid ? "Paid - locked to prevent accidental changes" : undefined}
                      onChange={(e) => updateStatus(reqId, e.target.value as RequestStatus)}
                      className={`rounded-sm border border-[var(--theme-border)] bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0d9488] disabled:opacity-40 ${r.paid ? "cursor-not-allowed" : ""}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-[var(--theme-surface)]">
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </StepRow>

                  <StepRow icon={Stethoscope} title="Consultation decision" done={consultationDecided} locked={status === "pending"} lockedReason="Set status to Contacted first.">
                    <div className="flex overflow-hidden rounded-full border border-[var(--theme-border)] w-fit">
                      <button disabled={!canSalesWorkflow} onClick={() => updateConsultation(reqId, { consultationDecision: "yes" })} className={`px-3 py-1.5 text-xs font-medium ${r.consultationDecision === "yes" ? "bg-sky-600 text-white" : "bg-black/40 text-[var(--theme-text-secondary)] hover:text-white"}`}>Yes</button>
                      <button disabled={!canSalesWorkflow} onClick={() => updateConsultation(reqId, { consultationDecision: "no" })} className={`px-3 py-1.5 text-xs font-medium ${r.consultationDecision === "no" ? "bg-sky-600 text-white" : "bg-black/40 text-[var(--theme-text-secondary)] hover:text-white"}`}>No</button>
                    </div>
                  </StepRow>

                  <StepRow icon={UserCheck} title="Assign doctor" done={doctorAssigned} locked={doctorStepLocked} lockedReason={status === "pending" ? "Set status to Contacted first." : "Confirm the consultation decision first."}>
                    <select value={docId} onChange={(e) => updateConsultation(reqId, { assignedDoctor: e.target.value || null })} disabled={!canSalesWorkflow || doctorStepLocked} className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0d9488] disabled:cursor-not-allowed">
                      <option value="" className="bg-[var(--theme-surface)]">Assign doctor…</option>
                      {doctors.map((d) => (<option key={d._id} value={d._id} className="bg-[var(--theme-surface)]">{d.name}</option>))}
                    </select>
                  </StepRow>

                  {consultYes && (
                    <StepRow icon={Link2} title="Consultation payment" done={consultFullyDone} locked={consultPaymentStepLocked} lockedReason="Assign a doctor first.">
                      {!consultFullyDone ? (
                        <div className="space-y-2">
                          <span
                            className={`block w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
                              consultPaidDone
                                ? "bg-amber-500/10 text-amber-300"
                                : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"
                            }`}
                          >
                            {consultPaidDone
                              ? "Consultation paid - reconciliation required"
                              : "Consultation payment not confirmed"}
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                          {!consultPaidDone && (
                            <button
                              onClick={() => sendConsultLink(r)}
                              disabled={
                                !canSalesWorkflow ||
                                updatingId === reqId ||
                                consultPaymentStepLocked
                              }
                              className="rounded-sm bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Consult link
                              {consultFee
                                ? ` (₦${consultFee.toLocaleString()})`
                                : ""}
                            </button>
                          )}
                          {consultReconId === reqId ? (
                            <span className="flex flex-wrap items-center gap-1">
                              <input type="number" value={consultReconAmount} onChange={(e) => setConsultReconAmount(e.target.value)} placeholder="Consult amount" className="w-28 rounded-sm border border-[var(--theme-border)] bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-500" />
                              <button onClick={() => reconcileConsult(r)} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500">Reconcile</button>
                            </span>
                          ) : (
                            <button onClick={() => setConsultReconId(reqId)} disabled={!canReconcileWorkflow || consultPaymentStepLocked} className="rounded-full border border-sky-500/40 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/10 disabled:cursor-not-allowed">Reconcile consult</button>
                          )}
                          </div>
                        </div>
                      ) : (
                        <span className="rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400">Consultation paid & reconciled</span>
                      )}
                    </StepRow>
                  )}

                  <StepRow icon={Package} title="Program" done={!!chosen || !!r.paid} locked={programStepLocked && !r.paid} lockedReason={status === "pending" ? "Set status to Contacted first." : consultYes ? "Complete and reconcile the consultation first." : "Confirm the consultation decision first."}>
                    {r.paid ? (
                      <span className="flex flex-wrap items-center gap-1 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 py-1.5 text-xs capitalize text-[var(--theme-text-secondary)]" title="Paid - program locked to prevent mistakes">
                        <Lock size={11} /> {r.program || "—"}
                      </span>
                    ) : (
                      <select
                        value={chosen}
                        disabled={!canSalesWorkflow || !approvedNow || programStepLocked}
                        onChange={(e) => setPicked({ ...picked, [reqId]: e.target.value })}
                        className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0d9488] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <option value="" className="bg-[var(--theme-surface)]">{approvedNow ? "Program…" : "Approve first…"}</option>
                        <option value="semaglutide" className="bg-[var(--theme-surface)]">Semaglutide</option>
                        <option value="tirzepatide" className="bg-[var(--theme-surface)]">Tirzepatide</option>
                        <option value="liraglutide" className="bg-[var(--theme-surface)]">Liraglutide</option>
                        <option value="dulaglutide" className="bg-[var(--theme-surface)]">Dulaglutide</option>
                        <option value="exenatide" className="bg-[var(--theme-surface)]">Exenatide</option>
                        <option value="retatrutide" className="bg-[var(--theme-surface)]">Retatrutide</option>
                        <option value="phentermine" className="bg-[var(--theme-surface)]">Phentermine</option>
                        <option value="topiramate" className="bg-[var(--theme-surface)]">Topiramate</option>
                        <option value="naltrexone" className="bg-[var(--theme-surface)]">Naltrexone</option>
                        <option value="bupropion" className="bg-[var(--theme-surface)]">Bupropion</option>
                        <option value="orlistat" className="bg-[var(--theme-surface)]">Orlistat</option>
                        <option value="metformin" className="bg-[var(--theme-surface)]">Metformin</option>
                        <option value="acarbose" className="bg-[var(--theme-surface)]">Acarbose</option>
                        <option value="fiber_supplements" className="bg-[var(--theme-surface)]">Fiber supplements</option>
                        <option value="protein_nutrition" className="bg-[var(--theme-surface)]">Protein/nutrition products</option>
                      </select>
                    )}
                  </StepRow>

                  <StepRow icon={CreditCard} title="Payment" done={!!r.paid} locked={!chosen && !r.paid} lockedReason="Choose a program first.">
                    {r.paid ? (
                      <span className="flex flex-wrap items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400"><Check size={12} /> Paid</span>
                    ) : programBlocked ? (
                      <span className="flex flex-wrap cursor-not-allowed items-center gap-1 rounded-sm bg-[var(--theme-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text-muted)]" title="Complete consultation reconciliation first">
                        <Lock size={11} /> Program link locked
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePaymentLink(r, chosen)}
                        disabled={!canSalesWorkflow || !chosen || updatingId === reqId}
                        className={`rounded-sm px-3 py-1.5 text-xs font-medium ${chosen ? "bg-[#0d9488] text-white hover:bg-emerald-700" : "cursor-not-allowed bg-[var(--theme-surface-soft)] text-[var(--theme-text-muted)]"}`}
                      >
                        Send Payment Link
                      </button>
                    )}
                  </StepRow>

                  <StepRow
                    icon={programMismatch ? AlertTriangle : CheckCircle2}
                    title="Program Reconciliation"
                    done={programReconDone}
                    warning={programMismatch}
                    locked={
                      !programMismatch &&
                      !r.paid &&
                      !r.linkSent
                    }
                    lockedReason="Send the payment link first."
                    isLast={!programMismatch}
                  >
                    {programMismatch ? (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                            <AlertTriangle size={13} />
                            Payment mismatch
                          </div>

                          <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-3">
                            <div>
                              <span className="text-[var(--theme-text-secondary)]">Entered</span>
                              <p className="font-medium text-amber-300">
                                ₦{Number(enteredAmount || 0).toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <span className="text-[var(--theme-text-secondary)]">Expected</span>
                              <p className="font-medium text-[var(--theme-text)]">
                                ₦{Number(expectedAmount || 0).toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <span className="text-[var(--theme-text-secondary)]">Payment ledger</span>
                              <p className={`font-medium ${
                                ledgerMismatch
                                  ? "text-amber-300"
                                  : "text-[var(--theme-text)]"
                              }`}>
                                {paymentLedgerAmount != null
                                  ? `₦${Number(paymentLedgerAmount).toLocaleString()}`
                                  : "Not linked"}
                              </p>
                            </div>
                          </div>

                          {ledgerMismatch && (
                            <p className="mt-2 text-[10px] leading-4 text-amber-200/70">
                              The payment ledger also differs from the amount entered during reconciliation.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : programReconDone ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400">
                        <Check size={12} />
                        Reconciled
                      </span>
                    ) : r.clientId && (status === "approved" || r.linkSent) ? (
                      reconId === reqId ? (
                        <span className="flex flex-wrap items-center gap-1">
                          <input
                            type="number"
                            value={reconAmount}
                            onChange={(e) => setReconAmount(e.target.value)}
                            placeholder="Amount received"
                            className="w-32 rounded-sm border border-[var(--theme-border)] bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0d9488]"
                          />

                          <button
                            onClick={() => reconcile(r)}
                            disabled={!canReconcileWorkflow || reconSaving}
                            className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
                          >
                            {reconSaving ? "..." : "Reconcile"}
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setReconId(reqId)}
                          disabled={!canReconcileWorkflow}
                          className="rounded-full border border-green-500/40 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10"
                        >
                          Reconcile
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-[var(--theme-text-muted)]">
                        Not yet applicable
                      </span>
                    )}
                  </StepRow>

                  {programMismatch && (
                    <StepRow
                      icon={ShieldCheck}
                      title="Reconciliation Check-in"
                      done={adminReviewDone}
                    >
                      {adminReviewDone ? (
                        <div className="space-y-1">
                          <span className="flex w-fit items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400">
                            <Check size={12} />
                            Reconciliation Check-in complete
                          </span>

                          {r.adminReconciliationReview?.note && (
                            <p className="text-[11px] leading-4 text-[var(--theme-text-secondary)]">
                              {r.adminReconciliationReview.note}
                            </p>
                          )}
                        </div>
                      ) : adminReviewId === reqId ? (
                        <div className="space-y-2">
                          <textarea
                            value={adminReviewNote}
                            onChange={(e) =>
                              setAdminReviewNote(e.target.value)
                            }
                            rows={2}
                            placeholder="Resolution note required"
                            className="w-full resize-none rounded-sm border border-amber-500/30 bg-black/50 px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => completeAdminReview(r)}
                              disabled={!canReconcileWorkflow || adminReviewSaving}
                              className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
                            >
                              {adminReviewSaving
                                ? "Saving..."
                                : "Complete Reconciliation Check-in"}
                            </button>

                            <button
                              onClick={() => {
                                setAdminReviewId(null);
                                setAdminReviewNote("");
                              }}
                              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                            Authorized staff
                          </span>

                          <button
                            onClick={() => setAdminReviewId(reqId)}
                            disabled={!canReconcileWorkflow}
                            className="rounded-full border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
                          >
                            Start Reconciliation Check-in
                          </button>
                        </div>
                      )}
                    </StepRow>
                  )}

                  {programMismatch && (
                    <StepRow
                      icon={CheckCircle2}
                      title="Final Reconciliation"
                      done={finalReconDone}
                      locked={
                        !adminReviewDone ||
                        !consultationDecided ||
                        (consultYes && !consultReconDone)
                      }
                      lockedReason={
                        !adminReviewDone
                          ? "Complete Reconciliation Check-in first."
                          : !consultationDecided
                            ? "Record the consultation decision first."
                            : consultYes && !consultReconDone
                              ? "Complete consultation reconciliation first."
                              : undefined
                      }
                      isLast
                    >
                      {finalReconDone ? (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400">
                          <Check size={12} />
                          Final reconciliation complete
                        </span>
                      ) : finalReconId === reqId ? (
                        <div className="space-y-2">
                          <textarea
                            value={finalReconNote}
                            onChange={(e) =>
                              setFinalReconNote(e.target.value)
                            }
                            rows={2}
                            placeholder="Final note (optional)"
                            className="w-full resize-none rounded-sm border border-green-500/30 bg-black/50 px-2.5 py-2 text-xs text-white outline-none focus:border-green-400"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                completeFinalReconciliation(r)
                              }
                              disabled={!canReconcileWorkflow || finalReconSaving}
                              className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
                            >
                              {finalReconSaving
                                ? "Finalizing..."
                                : "Complete Final Reconciliation"}
                            </button>

                            <button
                              onClick={() => {
                                setFinalReconId(null);
                                setFinalReconNote("");
                              }}
                              className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs text-[var(--theme-text-secondary)] hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-green-400/70">
                            Authorized staff
                          </span>

                          <button
                            onClick={() => setFinalReconId(reqId)}
                            disabled={!canReconcileWorkflow}
                            className="rounded-full border border-green-500/40 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10"
                          >
                            Final Reconciliation
                          </button>
                        </div>
                      )}
                    </StepRow>
                  )}
                </div>


                <div className={`${expandedRequests[mobileKey] ? "block" : "hidden"} border-t border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 min-[360px]:px-4 sm:px-5 lg:block`}>
                  <button type="button" onClick={() => setCustomFieldsOpen((current) => ({ ...current, [reqId]: !current[reqId] }))} className="flex min-h-9 w-full items-center justify-between gap-3 text-left text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:text-[var(--theme-text)]">
                    <span>Additional information</span>
                    <span className="text-[10px] font-medium text-[var(--theme-text-muted)]">{customFieldsOpen[reqId] ? "Hide" : "View"}</span>
                  </button>
                  {customFieldsOpen[reqId] && <div className="space-y-4 pt-3"><CustomFieldsEditor entityType="application" entityId={reqId} canEdit={canSalesWorkflow} compact /><RecordForms entityType="application" entityId={reqId} compact /></div>}
                </div>

                {/* Horizontal pipeline tracker */}
                <div className={`${expandedRequests[mobileKey] ? "block" : "hidden"} border-t border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 min-[360px]:px-4 sm:px-5 sm:py-4 lg:block`}>
                  <div className="flex flex-wrap items-center">
                    {stages.map((s, i) => (
                      <div key={s.key} className="flex items-center">
                        {i > 0 && <div className={`mx-1.5 h-px w-4 sm:w-8 ${s.done ? (s.red ? "bg-red-500" : s.amber ? "bg-amber-400" : s.blue ? "bg-sky-400" : "bg-[#0d9488]") : "bg-[var(--theme-surface-soft)]"}`} />}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${s.done ? (s.red ? "bg-red-500" : s.amber ? "bg-amber-400" : s.blue ? "bg-sky-400" : "bg-[#0d9488]") : "bg-white/15"}`} />
                          <span className={`text-[10px] ${s.done ? (s.red ? "text-red-400" : s.amber ? "text-amber-400" : s.blue ? "text-sky-400" : "text-[var(--theme-text)]") : "text-[var(--theme-text-muted)]"}`}>{s.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {finePrint.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-[var(--theme-border)] pt-3">
                      {finePrint.map((line, i) => (
                        <li key={i} className="text-[11px] leading-relaxed text-[var(--theme-text-secondary)]">{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
