"use client";

import { useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  DollarSign,
  GripVertical,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import CustomFieldsEditor from "@/components/custom-fields/CustomFieldsEditor";
import RecordForms from "@/components/forms/RecordForms";
import CrmDataTools, {
  CrmContactTags,
  type CrmTagDefinition,
} from "@/components/crm/CrmDataTools";

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

const ACTIVITY_TYPES = ["note", "call", "email", "whatsapp", "meeting", "task"] as const;

type Stage = (typeof STAGES)[number];
type Program = "core" | "plus" | "vip" | "not_sure";
type PreferredContactMethod =
  | "whatsapp"
  | "phone"
  | "email"
  | "no_preference";
type LeadPriority = "normal" | "high" | "urgent";
type Workspace = "pipeline" | "contacts" | "followups";
type DetailTab = "overview" | "activity" | "edit";
type ActivityType = (typeof ACTIVITY_TYPES)[number];

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
  leadPriority?: LeadPriority;
  stageEnteredAt?: string;
  nextFollowUpAt?: string;
  lostReason?: string;
  assignedTo?: StaffRef | string | null;
  application?: string | null;
  client?: string | null;
};

type CrmContact = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  source?: string;
  sourceDetail?: string;
  preferredContactMethod?: PreferredContactMethod;
  programInterest?: Program;
  lifecycleStage?: "lead" | "applicant" | "client" | "former_client";
  tags?: string[];
  assignedTo?: StaffRef | string | null;
  application?: string | { _id?: string; status?: string } | null;
  client?: string | { _id?: string; status?: string; reconciled?: boolean } | null;
  lastActivityAt?: string;
  createdAt?: string;
  opportunity?: Opportunity | null;
};

type Activity = {
  _id: string;
  type: string;
  subject?: string;
  body: string;
  dueAt?: string;
  completedAt?: string;
  createdAt?: string;
  createdBy?: StaffRef | null;
  assignedTo?: StaffRef | null;
};

type ContactDetail = {
  contact: CrmContact;
  opportunity: Opportunity | null;
  activities: Activity[];
};

type Overview = {
  openCount: number;
  openValue: number;
  overdueFollowUps: number;
  unassigned: number;
  stages: Record<Stage, { count: number; value: number }>;
};

type ContactListResponse = {
  contacts: CrmContact[];
  total: number;
  page: number;
  pages: number;
};

type CreateLeadForm = {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  sourceDetail: string;
  preferredContactMethod: PreferredContactMethod;
  programInterest: Program;
  assignedTo: string;
  estimatedValue: string;
  leadPriority: LeadPriority;
  nextFollowUpAt: string;
  note: string;
};

const EMPTY_FORM: CreateLeadForm = {
  fullName: "",
  email: "",
  phone: "",
  source: "manual",
  sourceDetail: "",
  preferredContactMethod: "no_preference",
  programInterest: "not_sure",
  assignedTo: "",
  estimatedValue: "",
  leadPriority: "normal",
  nextFollowUpAt: "",
  note: "",
};

const STAGE_META: Record<
  Stage,
  {
    label: string;
    badge: string;
    dot: string;
    border: string;
  }
> = {
  new: {
    label: "New Lead",
    badge: "bg-emerald-500/10 text-pink-300 border-emerald-600/20",
    dot: "bg-pink-400",
    border: "border-t-pink-400/50",
  },
  qualification: {
    label: "Qualification",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    dot: "bg-amber-400",
    border: "border-t-amber-400/50",
  },
  qualified: {
    label: "Qualified",
    badge: "bg-emerald-600/10 text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-400",
    border: "border-t-emerald-400/50",
  },
  consultation_booked: {
    label: "Consultation Booked",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    dot: "bg-cyan-400",
    border: "border-t-cyan-400/50",
  },
  consultation_completed: {
    label: "Consultation Completed",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    dot: "bg-blue-400",
    border: "border-t-blue-400/50",
  },
  medical_review: {
    label: "Medical Review",
    badge: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    dot: "bg-violet-400",
    border: "border-t-violet-400/50",
  },
  payment_pending: {
    label: "Payment Pending",
    badge: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    dot: "bg-orange-400",
    border: "border-t-orange-400/50",
  },
  nurture: {
    label: "Nurture",
    badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    dot: "bg-slate-400",
    border: "border-t-slate-400/50",
  },
  lost: {
    label: "Lost",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    dot: "bg-rose-400",
    border: "border-t-rose-400/50",
  },
};

const PROGRAM_LABELS: Record<Program, string> = {
  core: "Core",
  plus: "Plus",
  vip: "VIP",
  not_sure: "Not sure",
};

const REQUIRED_FIELD_HINTS: Partial<Record<Stage, string>> = {
  qualification:
    "Required before Qualification: full name, email, phone, and a valid program interest.",
  consultation_booked:
    "Required before Consultation Booked: full name, email, phone, and consultation date/time.",
  medical_review:
    "Required before Medical Review: full name, email, phone, and assigned owner.",
  payment_pending:
    "Required before Payment Pending: full name, email, phone, valid program interest, and estimated value greater than zero.",
};

const PREFERRED_CONTACT_LABELS: Record<
  PreferredContactMethod,
  string
> = {
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  no_preference: "No preference",
};

const LEAD_PRIORITY_LABELS: Record<
  LeadPriority,
  string
> = {
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const CRM_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "crm", label: "CRM" },
  { value: "application", label: "Application" },
  { value: "client", label: "Client" },
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

const KHAIRO_TIME_ZONE = "Africa/Lagos";
const CRM_DATE_MIN = "2000-01-01T00:00";
const CRM_DATE_MAX = "2100-12-31T23:59";

function getStaffName(value?: StaffRef | string | null) {
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

function shortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    timeZone: KHAIRO_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    timeZone: KHAIRO_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeOnly(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    timeZone: KHAIRO_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KHAIRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const zonedYear = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: KHAIRO_TIME_ZONE,
      year: "numeric",
    }).format(date)
  );
  if (zonedYear < 2000 || zonedYear > 2100) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KHAIRO_TIME_ZONE,
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

function toUtcIso(value?: string) {
  if (!value) return undefined;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Enter a valid follow-up date and time.");

  const year = Number(match[1]);
  if (year < 2000 || year > 2100) {
    throw new Error("CRM dates must be between 2000 and 2100.");
  }

  const date = new Date(`${value}:00+01:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid follow-up date and time.");
  }

  const roundTrip = toLocalInput(date.toISOString());
  if (roundTrip !== value) {
    throw new Error("Enter a valid follow-up date and time.");
  }

  return date.toISOString();
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function followUpMeta(value?: string) {
  if (!value) {
    return {
      status: "none" as const,
      label: "No follow-up scheduled",
      compact: "No follow-up",
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || !toLocalInput(value)) {
    return {
      status: "invalid" as const,
      label: "Follow-up date needs correction",
      compact: "Date needs correction",
    };
  }

  const target = dayKey(date);
  const now = new Date();
  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  if (target < today) {
    return {
      status: "overdue" as const,
      label: `Overdue · ${shortDateTime(value)}`,
      compact: `Overdue · ${shortDate(value)}`,
    };
  }

  if (target === today) {
    return {
      status: "today" as const,
      label: `Today · ${timeOnly(value)}`,
      compact: `Today · ${timeOnly(value)}`,
    };
  }

  if (target === tomorrow) {
    return {
      status: "upcoming" as const,
      label: `Tomorrow · ${timeOnly(value)}`,
      compact: `Tomorrow · ${timeOnly(value)}`,
    };
  }

  return {
    status: "upcoming" as const,
    label: shortDateTime(value),
    compact: shortDate(value),
  };
}

function whatsAppHref(phone?: string) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

function StageBadge({ stage }: { stage: Stage }) {
  const meta = STAGE_META[stage];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2 py-1 text-[11px] font-medium text-[var(--theme-text-secondary)]">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  attention = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Target;
  attention?: boolean;
}) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
        <Icon size={13} className={attention ? "text-amber-300" : "text-[var(--theme-text-muted)]"} />
        <span>{label}</span>
      </div>
      <div className={`mt-1.5 truncate text-xl font-semibold tracking-tight ${attention ? "text-amber-200" : "text-[var(--theme-text)]"}`}>
        {value}
      </div>
      <p className="mt-0.5 truncate text-[11px] text-[var(--theme-text-muted)]">{detail}</p>
    </div>
  );
}

function PipelineLeadCard({
  contact,
  canManage,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  contact: CrmContact;
  canManage: boolean;
  onOpen: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const opportunity = contact.opportunity;
  const followUp = followUpMeta(opportunity?.nextFollowUpAt);
  const program = PROGRAM_LABELS[
    contact.programInterest || opportunity?.programInterest || "not_sure"
  ];

  const followUpTone =
    followUp.status === "overdue" || followUp.status === "invalid"
      ? "text-amber-300"
      : followUp.status === "today"
        ? "text-[#ff7ac7]"
        : "text-[var(--theme-text-secondary)]";

  return (
    <article
      role="button"
      tabIndex={0}
      draggable={canManage && Boolean(opportunity)}
      onDragStart={(event) => {
        if (!canManage || !opportunity) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", opportunity._id);
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group cursor-pointer border-b border-[var(--theme-border-soft)] px-3 py-3.5 text-left transition last:border-b-0 hover:bg-[var(--theme-surface-soft)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0d9488]/30"
      aria-label={`Open ${contact.fullName}`}
    >
      <div className="flex items-start gap-2.5">
        {canManage && opportunity && (
          <GripVertical size={14} className="mt-0.5 shrink-0 text-[var(--theme-text-muted)] transition group-hover:text-[var(--theme-text-muted)]" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[13px] font-semibold text-[var(--theme-text)] group-hover:text-[var(--theme-text)]">
                {contact.fullName}
              </h3>
              <p className="mt-0.5 truncate text-[11px] text-[var(--theme-text-muted)]">
                {program} · {getStaffName(contact.assignedTo || opportunity?.assignedTo)}
              </p>
            </div>
            <span className="shrink-0 text-[12px] font-semibold text-[var(--theme-text-secondary)]">
              {money(opportunity?.estimatedValue)}
            </span>
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${followUpTone}`}>
            <Clock3 size={12} className="shrink-0" />
            <span className="truncate">{followUp.compact}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ContactMobileRow({
  contact,
  onOpen,
}: {
  contact: CrmContact;
  onOpen: () => void;
}) {
  const opportunity = contact.opportunity;
  const stage = opportunity?.stage || "new";
  const followUp = followUpMeta(opportunity?.nextFollowUpAt);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-[var(--theme-border-soft)] px-1 py-4 text-left transition last:border-b-0 hover:bg-[var(--theme-surface-soft)]"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--theme-surface-soft)] text-[11px] font-semibold text-[var(--theme-text-secondary)]">
        {initials(contact.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
          <StageBadge stage={stage} />
        </div>
        <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
          {PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"]}
          {" · "}
          {followUp.compact}
        </p>
      </div>
      <ChevronRight size={15} className="shrink-0 text-[var(--theme-text-muted)]" />
    </button>
  );
}

function FollowUpRow({
  contact,
  onOpen,
}: {
  contact: CrmContact;
  onOpen: () => void;
}) {
  const opportunity = contact.opportunity;
  const stage = opportunity?.stage || "new";
  const followUp = followUpMeta(opportunity?.nextFollowUpAt);
  const tone =
    followUp.status === "overdue" || followUp.status === "invalid"
      ? "text-amber-300"
      : followUp.status === "today"
        ? "text-[#ff7ac7]"
        : "text-[var(--theme-text-secondary)]";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--theme-border-soft)] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[var(--theme-surface-soft)] sm:grid-cols-[minmax(0,1.5fr)_150px_150px_24px]"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
          <span className="hidden md:inline-flex"><StageBadge stage={stage} /></span>
        </div>
        <p className="mt-1 truncate text-xs text-[var(--theme-text-muted)]">
          {PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"]}
          {" · "}
          {getStaffName(contact.assignedTo || opportunity?.assignedTo)}
        </p>
      </div>
      <div className={`shrink-0 text-right text-xs font-medium ${tone}`}>{followUp.label}</div>
      <div className="hidden text-right text-xs font-semibold text-[var(--theme-text-secondary)] sm:block">{money(opportunity?.estimatedValue)}</div>
      <ChevronRight size={15} className="hidden text-[var(--theme-text-muted)] transition group-hover:text-[var(--theme-text-secondary)] sm:block" />
    </button>
  );
}

function DetailTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-10 px-0.5 text-xs font-semibold transition ${
        active ? "text-[var(--theme-text)]" : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0d9488]" />}
    </button>
  );
}

export default function CrmPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "sales");
  const canAdmin = hasRole("admin");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [assignees, setAssignees] = useState<StaffRef[]>([]);
  const [crmTags, setCrmTags] = useState<CrmTagDefinition[]>([]);

  const [
    selectedContactIds,
    setSelectedContactIds,
  ] = useState<string[]>([]);

  const [
    bulkTagKey,
    setBulkTagKey,
  ] = useState("");

  const [
    bulkTagAction,
    setBulkTagAction,
  ] = useState<"add" | "remove">("add");

  const [
    bulkTagBusy,
    setBulkTagBusy,
  ] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [workspace, setWorkspace] = useState<Workspace>("pipeline");
  const [mobileStage, setMobileStage] = useState<Stage>("new");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLeadForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityBody, setActivityBody] = useState("");
  const [activityDueAt, setActivityDueAt] = useState("");
  const [activitySaving, setActivitySaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeQuery, setMergeQuery] = useState("");
  const [mergeResults, setMergeResults] = useState<CrmContact[]>([]);
  const [mergeSearching, setMergeSearching] = useState(false);
  const [mergeDuplicateId, setMergeDuplicateId] = useState("");
  const [merging, setMerging] = useState(false);
  const [opportunitySaving, setOpportunitySaving] = useState(false);
  const [draggedOpportunityId, setDraggedOpportunityId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const pipelineScrollRef = useRef<HTMLDivElement>(null);
  const activityTextRef = useRef<HTMLTextAreaElement>(null);
  const [contactDraft, setContactDraft] = useState({
    sourceDetail: "",
    preferredContactMethod:
      "no_preference" as PreferredContactMethod,
  });

  const [opportunityDraft, setOpportunityDraft] = useState({
    assignedTo: "",
    estimatedValue: "",
    leadPriority: "normal" as LeadPriority,
    nextFollowUpAt: "",
    lostReason: "",
  });

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const params: Record<string, string | number> = { limit: 100 };
        if (search.trim()) params.search = search.trim();
        if (stageFilter !== "all") params.stage = stageFilter;
        if (assigneeFilter !== "all") params.assignedTo = assigneeFilter;
        if (tagFilter !== "all") params.tags = tagFilter;

        const [
          overviewData,
          contactData,
          assigneeData,
          tagData,
        ] = await Promise.all([
          api.get<{ success: boolean } & Overview>("/crm/overview"),
          api.get<ContactListResponse>("/crm/contacts", { params }),
          api.get<{ users: StaffRef[] }>("/crm/assignees"),
          api.get<{
            success: boolean;
            tags: CrmTagDefinition[];
          }>("/crm/tags", {
            params: {
              includeInactive: true,
            },
          }),
        ]);

        const loadedContacts =
          contactData.contacts || [];

        setOverview(overviewData);
        setContacts(loadedContacts);
        setAssignees(assigneeData.users || []);
        setCrmTags(tagData.tags || []);

        setSelectedContactIds(
          (current) =>
            current.filter(
              (id) =>
                loadedContacts.some(
                  (contact) =>
                    contact._id === id
                )
            )
        );
      } catch (err) {
        setError(errorMessage(err, "Could not load CRM."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [assigneeFilter, search, stageFilter, tagFilter]
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void load();
      },
      search ? 250 : 0
    );
    return () => window.clearTimeout(timer);
  }, [load, search, stageFilter, assigneeFilter]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!selectedId && !createOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (createOpen) setCreateOpen(false);
      else setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen, selectedId]);

  const notify = (message: string) => setNotice(message);

  const openDetail = useCallback(async (id: string, tab: DetailTab = "overview") => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setDetailTab(tab);
    setError("");
    try {
      const data = await api.get<ContactDetail>(`/crm/contacts/${id}`);
      setDetail(data);
      const assigned =
        data.opportunity?.assignedTo ||
        data.contact.assignedTo;

      setContactDraft({
        sourceDetail:
          data.contact.sourceDetail || "",
        preferredContactMethod:
          data.contact.preferredContactMethod ||
          "no_preference",
      });

      setOpportunityDraft({
        assignedTo:
          typeof assigned === "string"
            ? assigned
            : assigned?._id || "",
        estimatedValue:
          String(data.opportunity?.estimatedValue || ""),
        leadPriority:
          data.opportunity?.leadPriority || "normal",
        nextFollowUpAt:
          toLocalInput(data.opportunity?.nextFollowUpAt),
        lostReason:
          data.opportunity?.lostReason || "",
      });
    } catch (err) {
      setError(errorMessage(err, "Could not open CRM contact."));
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const contactId = searchParams.get("contact");
    if (!contactId || contactId === selectedId) return;

    void openDetail(contactId);
  }, [openDetail, searchParams, selectedId]);

  const pipelineByStage = useMemo(() => {
    const map = Object.fromEntries(
      STAGES.map((stage) => [stage, [] as CrmContact[]])
    ) as Record<Stage, CrmContact[]>;
    for (const contact of contacts) {
      const stage = contact.opportunity?.stage || "new";
      if (map[stage]) map[stage].push(contact);
    }
    return map;
  }, [contacts]);

  const followUpGroups = useMemo(() => {
    const result = {
      overdue: [] as CrmContact[],
      today: [] as CrmContact[],
      upcoming: [] as CrmContact[],
      unscheduled: [] as CrmContact[],
    };

    const sorted = [...contacts].sort((a, b) => {
      const aTime = a.opportunity?.nextFollowUpAt
        ? new Date(a.opportunity.nextFollowUpAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b.opportunity?.nextFollowUpAt
        ? new Date(b.opportunity.nextFollowUpAt).getTime()
        : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    for (const contact of sorted) {
      const meta = followUpMeta(contact.opportunity?.nextFollowUpAt);
      if (meta.status === "overdue" || meta.status === "invalid") result.overdue.push(contact);
      else if (meta.status === "today") result.today.push(contact);
      else if (meta.status === "upcoming") result.upcoming.push(contact);
      else result.unscheduled.push(contact);
    }

    return result;
  }, [contacts]);

  const moveStage = async (opportunityId: string, stage: Stage) => {
    const current = contacts.find(
      (contact) => contact.opportunity?._id === opportunityId
    )?.opportunity?.stage;
    if (current === stage) return;

    setError("");
    try {
      await api.patch(`/crm/opportunities/${opportunityId}`, { stage });
      notify(`Moved to ${STAGE_META[stage].label}.`);
      await load(true);
      if (selectedId) await openDetail(selectedId, detailTab);
    } catch (err) {
      setError(errorMessage(err, "Could not move pipeline stage."));
      throw err;
    }
  };

  const dropIntoStage = async (stage: Stage) => {
    if (!draggedOpportunityId) return;
    const opportunityId = draggedOpportunityId;
    setDraggedOpportunityId(null);
    setDragOverStage(null);
    try {
      await moveStage(opportunityId, stage);
    } catch {
      // moveStage displays the error.
    }
  };

  const scrollPipeline = (direction: -1 | 1) => {
    pipelineScrollRef.current?.scrollBy({
      left: direction * 620,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (workspace !== "pipeline" || loading) return;
    const frame = window.requestAnimationFrame(() => {
      pipelineScrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [workspace, loading]);


  const createLead = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const response = await api.post<{ contact: CrmContact }>("/crm/contacts", {
        ...createForm,
        estimatedValue: Number(createForm.estimatedValue) || 0,
        nextFollowUpAt: toUtcIso(createForm.nextFollowUpAt),
        assignedTo: createForm.assignedTo || undefined,
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      notify("Lead created.");
      await load(true);
      if (response.contact?._id) await openDetail(response.contact._id);
    } catch (err) {
      setError(errorMessage(err, "Could not create lead."));
    } finally {
      setCreating(false);
    }
  };

  const addActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !activityBody.trim()) return;
    setActivitySaving(true);
    setError("");
    try {
      await api.post(`/crm/contacts/${selectedId}/activities`, {
        type: activityType,
        body: activityBody.trim(),
        dueAt:
          activityType === "task" && activityDueAt
            ? toUtcIso(activityDueAt)
            : undefined,
      });
      setActivityBody("");
      setActivityDueAt("");
      notify(activityType === "task" ? "Task added." : "Activity saved.");
      await openDetail(selectedId, "activity");
      await load(true);
    } catch (err) {
      setError(errorMessage(err, "Could not add CRM activity."));
    } finally {
      setActivitySaving(false);
    }
  };

  const startActivity = (type: ActivityType) => {
    setActivityType(type);
    setDetailTab("activity");
    window.setTimeout(() => activityTextRef.current?.focus(), 50);
  };

  const toggleTask = async (activityId: string) => {
    try {
      await api.patch(`/crm/activities/${activityId}/complete`);
      notify("Task status updated.");
      if (selectedId) {
        await openDetail(selectedId, "activity");
      }
    } catch (err) {
      setError(errorMessage(err, "Could not update task."));
    }
  };

  const saveOpportunityDetails = async () => {
    if (!detail?.opportunity) return;

    const storedFollowUpInvalid = Boolean(
      detail.opportunity.nextFollowUpAt &&
        !toLocalInput(detail.opportunity.nextFollowUpAt)
    );
    if (storedFollowUpInvalid && !opportunityDraft.nextFollowUpAt) {
      setError(
        "Choose a replacement follow-up date between 2000 and 2100 before saving this lead."
      );
      return;
    }

    setOpportunitySaving(true);
    setError("");
    try {
      await api.patch(
        `/crm/contacts/${detail.contact._id}`,
        {
          sourceDetail:
            contactDraft.sourceDetail.trim(),
          preferredContactMethod:
            contactDraft.preferredContactMethod,
        }
      );

      await api.patch(
        `/crm/opportunities/${detail.opportunity._id}`,
        {
          assignedTo:
            opportunityDraft.assignedTo || null,
          estimatedValue:
            Number(opportunityDraft.estimatedValue) || 0,
          leadPriority:
            opportunityDraft.leadPriority,
          nextFollowUpAt:
            opportunityDraft.nextFollowUpAt
              ? toUtcIso(
                  opportunityDraft.nextFollowUpAt
                )
              : null,
          lostReason:
            opportunityDraft.lostReason,
        }
      );

      notify("CRM details saved.");
      await openDetail(detail.contact._id);
      setDetailTab("overview");
      await load(true);
    } catch (err) {
      setError(errorMessage(err, "Could not update opportunity details."));
    } finally {
      setOpportunitySaving(false);
    }
  };

  const convertToApplication = async () => {
    if (!selectedId) return;
    setConverting(true);
    setError("");
    try {
      await api.post(`/crm/contacts/${selectedId}/to-application`);
      notify("Lead moved into Requests.");
      await openDetail(selectedId);
      await load(true);
    } catch (err) {
      setError(errorMessage(err, "Could not move this lead into Requests."));
    } finally {
      setConverting(false);
    }
  };

  const openMerge = () => {
    setMergeOpen(true);
    setMergeQuery("");
    setMergeResults([]);
    setMergeDuplicateId("");
    setError("");
  };

  const searchMergeCandidates = async (query: string) => {
    setMergeQuery(query);
    const term = query.trim();
    if (term.length < 2) {
      setMergeResults([]);
      return;
    }

    setMergeSearching(true);
    try {
      const data = await api.get<ContactListResponse>("/crm/contacts", {
        params: { search: term, limit: 20 },
      });
      setMergeResults(
        (data.contacts || []).filter(
          (contact) => contact._id !== selectedId
        )
      );
    } catch (err) {
      setError(errorMessage(err, "Could not search contacts."));
    } finally {
      setMergeSearching(false);
    }
  };

  const performMerge = async () => {
    if (!selectedId || !mergeDuplicateId || merging) return;
    setMerging(true);
    setError("");
    try {
      await api.post(`/crm/contacts/${selectedId}/merge`, {
        duplicateId: mergeDuplicateId,
      });
      notify("Duplicate contact merged.");
      setMergeOpen(false);
      setMergeDuplicateId("");
      await openDetail(selectedId);
      await load(true);
    } catch (err) {
      setError(errorMessage(err, "Could not merge contacts."));
    } finally {
      setMerging(false);
    }
  };

  const toggleContactSelection = (
    contactId: string
  ) => {
    setSelectedContactIds(
      (current) =>
        current.includes(contactId)
          ? current.filter(
              (id) =>
                id !== contactId
            )
          : [...current, contactId]
    );
  };

  const toggleAllVisibleContacts = () => {
    if (
      contacts.length > 0 &&
      contacts.every(
        (contact) =>
          selectedContactIds.includes(
            contact._id
          )
      )
    ) {
      const visibleIds =
        new Set(
          contacts.map(
            (contact) =>
              contact._id
          )
        );

      setSelectedContactIds(
        (current) =>
          current.filter(
            (id) =>
              !visibleIds.has(id)
          )
      );

      return;
    }

    setSelectedContactIds(
      (current) => [
        ...new Set([
          ...current,
          ...contacts.map(
            (contact) =>
              contact._id
          ),
        ]),
      ]
    );
  };

  const applyBulkTag = async () => {
    if (
      !selectedContactIds.length ||
      !bulkTagKey
    ) {
      return;
    }

    setBulkTagBusy(true);
    setError("");

    try {
      const response =
        await api.post<{
          matched: number;
          changed: number;
        }>(
          "/crm/tags/bulk",
          {
            contactIds:
              selectedContactIds,
            add:
              bulkTagAction === "add"
                ? [bulkTagKey]
                : [],
            remove:
              bulkTagAction === "remove"
                ? [bulkTagKey]
                : [],
          }
        );

      notify(
        `${response.changed || 0} contact${response.changed === 1 ? "" : "s"} updated.`
      );

      setSelectedContactIds([]);
      setBulkTagKey("");

      await load(true);
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Could not update selected contacts."
        )
      );
    } finally {
      setBulkTagBusy(false);
    }
  };

  const storedFollowUpInvalid = Boolean(
    detail?.opportunity?.nextFollowUpAt &&
      !toLocalInput(detail.opportunity.nextFollowUpAt)
  );

  const visibleCount = contacts.length;

  const allVisibleSelected =
    canManage &&
    contacts.length > 0 &&
    contacts.every((contact) =>
      selectedContactIds.includes(
        contact._id
      )
    );

  const activeFilters =
    Number(Boolean(search.trim())) +
    Number(stageFilter !== "all") +
    Number(assigneeFilter !== "all") +
    Number(tagFilter !== "all");

  return (
    <div data-testid="crm-root" className="mx-auto w-full max-w-[1800px] space-y-4 pb-8">
      {notice && (
        <div className="fixed right-4 top-4 z-[100] flex max-w-sm items-center gap-2 rounded-lg border border-emerald-500/20 bg-[var(--theme-surface)] px-3.5 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl">
          <Check size={14} />
          <span>{notice}</span>
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-[var(--theme-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--theme-text)]">CRM</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">Manage leads, follow-ups and handoffs into Requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {canManage && (
            <CrmDataTools
              tags={crmTags}
              canAdmin={canAdmin}
              filters={{
                search:
                  search.trim()
                    ? search.trim()
                    : undefined,
                stage:
                  stageFilter === "all"
                    ? undefined
                    : stageFilter,
                assignedTo:
                  assigneeFilter === "all"
                    ? undefined
                    : assigneeFilter,
                tags:
                  tagFilter === "all"
                    ? undefined
                    : tagFilter,
              }}
              onTagsChanged={setCrmTags}
              onImported={async () => {
                await load(true);
              }}
            />
          )}

          {canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              Add lead
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div className="grid grid-cols-2 divide-x divide-[var(--theme-border-soft)] lg:grid-cols-4">
          <MetricCard
            label="Open opportunities"
            value={overview?.openCount ?? "…"}
            detail="Active sales opportunities"
            icon={Target}
          />
          <MetricCard
            label="Pipeline value"
            value={money(overview?.openValue)}
            detail="Estimated active value"
            icon={DollarSign}
          />
          <MetricCard
            label="Needs attention"
            value={overview?.overdueFollowUps ?? "…"}
            detail="Overdue follow-ups"
            icon={Clock3}
            attention={Boolean(overview?.overdueFollowUps)}
          />
          <MetricCard
            label="Unassigned"
            value={overview?.unassigned ?? "…"}
            detail="Waiting for an owner"
            icon={Users}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-page-alt)]">
        <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex min-w-max items-center gap-5 overflow-x-auto" aria-label="CRM views">
            {([
              ["pipeline", "Pipeline"],
              ["contacts", "Contacts"],
              ["followups", "Follow-ups"],
            ] as Array<[Workspace, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                data-testid={`crm-tab-${value}`}
                onClick={() => setWorkspace(value)}
                className={`rounded-md px-2.5 py-1.5 text-sm font-semibold transition ${
                  workspace === value
                    ? "bg-[var(--theme-surface-soft)] text-[var(--theme-text)]"
                    : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-text-secondary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-3xl lg:justify-end">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads"
                className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] pl-9 pr-3 text-sm text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-border)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value as Stage | "all")}
                className="h-10 min-w-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-xs text-[var(--theme-text-secondary)] outline-none focus:border-[var(--theme-border)] sm:min-w-36"
              >
                <option value="all">All stages</option>
                {STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_META[stage].label}</option>)}
              </select>
              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-xs text-[var(--theme-text-secondary)] outline-none focus:border-[var(--theme-border)] sm:min-w-36"
              >
                <option value="all">All owners</option>
                {assignees.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}
              </select>

              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className="h-10 min-w-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-xs text-[var(--theme-text-secondary)] outline-none focus:border-[var(--theme-border)] sm:min-w-36"
              >
                <option value="all">All tags</option>
                {crmTags
                  .filter((tag) => tag.active)
                  .map((tag) => (
                    <option key={tag.key} value={tag.key}>
                      {tag.name}
                    </option>
                  ))}
              </select>
            </div>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStageFilter("all");
                  setAssigneeFilter("all");
                  setTagFilter("all");
                }}
                className="h-10 shrink-0 px-1 text-xs font-semibold text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text-secondary)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-[var(--theme-text-muted)]">Loading CRM…</div>
        ) : contacts.length === 0 ? (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <Target size={24} className="mx-auto text-[var(--theme-text-muted)]" />
              <h2 className="mt-3 text-sm font-semibold text-[var(--theme-text)]">No leads found</h2>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Adjust the filters or add a new lead.</p>
            </div>
          </div>
        ) : workspace === "pipeline" ? (
          <div data-testid="crm-pipeline">
            <div className="flex items-center justify-between border-b border-[var(--theme-border-soft)] px-4 py-2.5">
              <p className="text-xs text-[var(--theme-text-muted)]">{visibleCount} leads shown</p>
              <div className="hidden items-center gap-1.5 lg:flex">
                <button type="button" onClick={() => scrollPipeline(-1)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Scroll pipeline left">
                  <ArrowRight size={14} className="rotate-180" />
                </button>
                <button type="button" onClick={() => scrollPipeline(1)} className="grid h-8 w-8 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Scroll pipeline right">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="lg:hidden">
              <div className="overflow-x-auto border-b border-[var(--theme-border-soft)] px-3 py-2.5">
                <div className="flex min-w-max gap-1.5">
                  {STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      data-testid={`crm-mobile-stage-${stage}`}
                      onClick={() => setMobileStage(stage)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition ${mobileStage === stage ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]"}`}
                    >
                      {STAGE_META[stage].label} <span className="ml-1 text-[var(--theme-text-muted)]">{pipelineByStage[stage].length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-3">
                {pipelineByStage[mobileStage].length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--theme-text-muted)]">No leads in this stage.</div>
                ) : pipelineByStage[mobileStage].map((contact) => (
                  <PipelineLeadCard key={contact._id} contact={contact} canManage={false} onOpen={() => void openDetail(contact._id)} />
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <div ref={pipelineScrollRef} className="overflow-x-auto [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
                <div className="flex min-w-max divide-x divide-[var(--theme-border-soft)]">
                  {STAGES.map((stage) => (
                    <section
                      key={stage}
                      onDragOver={(event) => {
                        if (!canManage || !draggedOpportunityId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverStage(stage);
                      }}
                      onDragLeave={() => { if (dragOverStage === stage) setDragOverStage(null); }}
                      onDrop={(event) => { event.preventDefault(); void dropIntoStage(stage); }}
                      className={`w-[282px] shrink-0 transition ${dragOverStage === stage ? "bg-[#0d9488]/[0.035]" : "bg-[var(--theme-page-alt)]"}`}
                    >
                      <header className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-[var(--theme-border-soft)] bg-[var(--theme-surface)] px-3 py-3 backdrop-blur">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STAGE_META[stage].dot}`} />
                          <span className="truncate text-xs font-semibold text-[var(--theme-text-secondary)]">{STAGE_META[stage].label}</span>
                          <span className="text-[11px] text-[var(--theme-text-muted)]">{pipelineByStage[stage].length}</span>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--theme-text-muted)]">
                          {money(pipelineByStage[stage].reduce((sum, contact) => sum + (contact.opportunity?.estimatedValue || 0), 0))}
                        </span>
                      </header>
                      <div className="min-h-[340px]">
                        {pipelineByStage[stage].length === 0 ? (
                          <div className="px-3 py-8 text-center text-xs text-[var(--theme-text-muted)]">No leads</div>
                        ) : pipelineByStage[stage].map((contact) => (
                          <PipelineLeadCard
                            key={contact._id}
                            contact={contact}
                            canManage={canManage}
                            onDragStart={() => setDraggedOpportunityId(contact.opportunity?._id || null)}
                            onDragEnd={() => { setDraggedOpportunityId(null); setDragOverStage(null); }}
                            onOpen={() => void openDetail(contact._id)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : workspace === "contacts" ? (
          <div data-testid="crm-contacts">
            {canManage && (
              <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={
                      toggleAllVisibleContacts
                    }
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--theme-text-secondary)]"
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={
                        allVisibleSelected
                      }
                      className="h-4 w-4 rounded border-[var(--theme-border)]"
                    />
                    Select visible
                  </button>

                  <span className="text-xs text-[var(--theme-text-muted)]">
                    {selectedContactIds.length} selected
                  </span>
                </div>

                {selectedContactIds.length > 0 && (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <select
                      value={bulkTagAction}
                      onChange={(event) =>
                        setBulkTagAction(
                          event.target.value as
                            | "add"
                            | "remove"
                        )
                      }
                      className="h-9 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 text-xs text-[var(--theme-text-secondary)] outline-none"
                    >
                      <option value="add">
                        Add tag
                      </option>
                      <option value="remove">
                        Remove tag
                      </option>
                    </select>

                    <select
                      value={bulkTagKey}
                      onChange={(event) =>
                        setBulkTagKey(
                          event.target.value
                        )
                      }
                      className="h-9 min-w-0 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 text-xs text-[var(--theme-text-secondary)] outline-none sm:min-w-48"
                    >
                      <option value="">
                        Choose tag…
                      </option>

                      {crmTags
                        .filter(
                          (tag) =>
                            bulkTagAction ===
                              "remove" ||
                            tag.active
                        )
                        .map((tag) => (
                          <option
                            key={tag.key}
                            value={tag.key}
                          >
                            {tag.name}
                            {!tag.active
                              ? " (archived)"
                              : ""}
                          </option>
                        ))}
                    </select>

                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !bulkTagKey ||
                        bulkTagBusy
                      }
                      onClick={() =>
                        void applyBulkTag()
                      }
                    >
                      {bulkTagBusy
                        ? "Applying…"
                        : "Apply"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContactIds(
                          []
                        );
                        setBulkTagKey("");
                      }}
                      className="h-9 px-2 text-xs font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)]"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="hidden overflow-x-auto md:block">
              <table data-testid="crm-contacts-table" className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--theme-text-muted)]">
                    {canManage && (
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={
                            allVisibleSelected
                          }
                          onChange={
                            toggleAllVisibleContacts
                          }
                          aria-label="Select all visible contacts"
                          className="h-4 w-4 rounded border-[var(--theme-border)]"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Next follow-up</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => {
                    const opportunity = contact.opportunity;
                    const stage = opportunity?.stage || "new";
                    const followUp = followUpMeta(opportunity?.nextFollowUpAt);
                    return (
                      <tr
                        key={contact._id}
                        onClick={() => void openDetail(contact._id)}
                        className="group cursor-pointer border-b border-[var(--theme-border-soft)] text-sm transition last:border-b-0 hover:bg-[var(--theme-surface-soft)]"
                      >
                        {canManage && (
                          <td
                            className="w-10 px-3 py-3.5"
                            onClick={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selectedContactIds.includes(
                                contact._id
                              )}
                              onChange={() =>
                                toggleContactSelection(
                                  contact._id
                                )
                              }
                              aria-label={`Select ${contact.fullName}`}
                              className="h-4 w-4 rounded border-[var(--theme-border)]"
                            />
                          </td>
                        )}

                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--theme-text)]">{contact.fullName}</p>
                            <p className="mt-0.5 max-w-[280px] truncate text-xs text-[var(--theme-text-muted)]">{contact.email || contact.phone || "No contact detail"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[var(--theme-text-secondary)]">{PROGRAM_LABELS[contact.programInterest || opportunity?.programInterest || "not_sure"]}</td>
                        <td className="px-4 py-3.5"><StageBadge stage={stage} /></td>
                        <td className="px-4 py-3.5 text-xs text-[var(--theme-text-secondary)]">{getStaffName(contact.assignedTo || opportunity?.assignedTo)}</td>
                        <td className={`px-4 py-3.5 text-xs font-medium ${followUp.status === "overdue" || followUp.status === "invalid" ? "text-amber-300" : followUp.status === "today" ? "text-[#ff7ac7]" : "text-[var(--theme-text-secondary)]"}`}>{followUp.compact}</td>
                        <td className="px-4 py-3.5 text-right text-xs font-semibold text-[var(--theme-text-secondary)]">{money(opportunity?.estimatedValue)}</td>
                        <td className="px-2 py-3.5"><ChevronRight size={15} className="text-[var(--theme-text-muted)] transition group-hover:text-[var(--theme-text-secondary)]" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:hidden">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-start gap-2 border-b border-[var(--theme-border-soft)]"
                >
                  {canManage && (
                    <div className="pt-4">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(
                          contact._id
                        )}
                        onChange={() =>
                          toggleContactSelection(
                            contact._id
                          )
                        }
                        aria-label={`Select ${contact.fullName}`}
                        className="h-4 w-4 rounded border-[var(--theme-border)]"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <ContactMobileRow
                      contact={contact}
                      onOpen={() =>
                        void openDetail(
                          contact._id
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div data-testid="crm-followups" className="divide-y divide-[var(--theme-border-soft)]">
            {([
              ["overdue", "Overdue", followUpGroups.overdue],
              ["today", "Today", followUpGroups.today],
              ["upcoming", "Upcoming", followUpGroups.upcoming],
              ["unscheduled", "No follow-up", followUpGroups.unscheduled],
            ] as Array<[string, string, CrmContact[]]>).map(([key, label, rows]) => (
              <section key={key}>
                <div className="flex items-center justify-between bg-[var(--theme-surface-soft)] px-4 py-2.5">
                  <h2 className="text-xs font-semibold text-[var(--theme-text-secondary)]">{label}</h2>
                  <span className="text-[11px] text-[var(--theme-text-muted)]">{rows.length}</span>
                </div>
                {rows.length === 0 ? (
                  <div className="px-4 py-5 text-xs text-[var(--theme-text-muted)]">Nothing here.</div>
                ) : rows.map((contact) => <FollowUpRow key={contact._id} contact={contact} onOpen={() => void openDetail(contact._id)} />)}
              </section>
            ))}
          </div>
        )}
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-[80] bg-black/55" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <aside data-testid="crm-create-drawer" className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">Add lead</h2>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Capture the essentials. Everything can be refined later.</p>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close new lead"><X size={16} /></button>
            </header>

            <form onSubmit={createLead} className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                <section className="space-y-3.5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Contact</h3>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Full name</span>
                    <input required autoFocus value={createForm.fullName} onChange={(event) => setCreateForm((value) => ({ ...value, fullName: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Email</span><input type="email" value={createForm.email} onChange={(event) => setCreateForm((value) => ({ ...value, email: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Phone</span><input value={createForm.phone} onChange={(event) => setCreateForm((value) => ({ ...value, phone: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                  </div>
                </section>

                <section className="space-y-3.5 border-t border-[var(--theme-border)] pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Opportunity</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Program</span><select value={createForm.programInterest} onChange={(event) => setCreateForm((value) => ({ ...value, programInterest: event.target.value as Program }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{(Object.keys(PROGRAM_LABELS) as Program[]).map((program) => <option key={program} value={program}>{PROGRAM_LABELS[program]}</option>)}</select></label>
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Owner</span><select value={createForm.assignedTo} onChange={(event) => setCreateForm((value) => ({ ...value, assignedTo: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]"><option value="">Unassigned</option>{assignees.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}</select></label>
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Priority</span><select value={createForm.leadPriority} onChange={(event) => setCreateForm((value) => ({ ...value, leadPriority: event.target.value as LeadPriority }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{(Object.keys(LEAD_PRIORITY_LABELS) as LeadPriority[]).map((priority) => <option key={priority} value={priority}>{LEAD_PRIORITY_LABELS[priority]}</option>)}</select></label>
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Estimated value (₦)</span><input type="number" min="0" value={createForm.estimatedValue} onChange={(event) => setCreateForm((value) => ({ ...value, estimatedValue: event.target.value }))} placeholder="0" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Next follow-up</span><input type="datetime-local" min={CRM_DATE_MIN} max={CRM_DATE_MAX} value={createForm.nextFollowUpAt} onChange={(event) => setCreateForm((value) => ({ ...value, nextFollowUpAt: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                  </div>
                  <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Source</span><select value={createForm.source} onChange={(event) => setCreateForm((value) => ({ ...value, source: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{CRM_SOURCE_OPTIONS.map((sourceOption) => <option key={sourceOption.value} value={sourceOption.value}>{sourceOption.label}</option>)}</select></label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Source detail / campaign</span><input maxLength={160} value={createForm.sourceDetail} onChange={(event) => setCreateForm((value) => ({ ...value, sourceDetail: event.target.value }))} placeholder="e.g. August Instagram campaign" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>

                    <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Preferred contact</span><select value={createForm.preferredContactMethod} onChange={(event) => setCreateForm((value) => ({ ...value, preferredContactMethod: event.target.value as PreferredContactMethod }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{(Object.keys(PREFERRED_CONTACT_LABELS) as PreferredContactMethod[]).map((method) => <option key={method} value={method}>{PREFERRED_CONTACT_LABELS[method]}</option>)}</select></label>
                  </div>

                  <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">First note</span><textarea rows={4} value={createForm.note} onChange={(event) => setCreateForm((value) => ({ ...value, note: event.target.value }))} placeholder="Useful context for the team" className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-border)]" /></label>
                </section>
              </div>

              <div className="sticky bottom-0 -mx-5 mt-6 flex items-center justify-end gap-2 border-t border-[var(--theme-border)] bg-[var(--theme-surface-raised)] px-5 py-4">
                <button type="button" onClick={() => setCreateOpen(false)} className="h-10 px-3 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:text-[var(--theme-text)]">Cancel</button>
                <Button type="submit" size="sm" disabled={creating || !createForm.fullName.trim()}>{creating ? "Saving…" : "Add lead"}</Button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 z-[75] bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <aside data-testid="crm-drawer" className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            {detailLoading || !detail ? (
              <div className="grid flex-1 place-items-center text-sm text-[var(--theme-text-muted)]">Loading contact…</div>
            ) : (
              <>
                <header className="shrink-0 border-b border-[var(--theme-border)] px-5 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--theme-surface-soft)] text-xs font-semibold text-[var(--theme-text-secondary)]">{initials(detail.contact.fullName)}</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-lg font-semibold leading-tight text-[var(--theme-text)]">{detail.contact.fullName}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--theme-text-muted)]">
                        {detail.opportunity && <StageBadge stage={detail.opportunity.stage} />}
                        <span>{PROGRAM_LABELS[detail.opportunity?.programInterest || detail.contact.programInterest || "not_sure"]}</span>
                        <span className="text-[var(--theme-text-muted)]">•</span>
                        <span>{getStaffName(detail.contact.assignedTo || detail.opportunity?.assignedTo)}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedId(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close contact"><X size={16} /></button>
                  </div>
                  <div className="mt-4 flex gap-5">
                    <DetailTabButton active={detailTab === "overview"} onClick={() => setDetailTab("overview")}>Overview</DetailTabButton>
                    <DetailTabButton active={detailTab === "activity"} onClick={() => setDetailTab("activity")}>Activity</DetailTabButton>
                    {canManage && <DetailTabButton active={detailTab === "edit"} onClick={() => setDetailTab("edit")}>Edit</DetailTabButton>}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                  {detailTab === "overview" ? (
                    <div className="space-y-6 px-5 py-5">
                      {mergeOpen && (
                        <div className="fixed inset-0 z-[100] bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !merging) setMergeOpen(false); }}>
                          <div className="mx-auto mt-[10vh] w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] p-5 shadow-2xl">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-base font-semibold text-[var(--theme-text)]">Merge duplicate contact</h3>
                                <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-muted)]">
                                  Search for a duplicate contact to merge into <span className="font-medium text-[var(--theme-text)]">{detail.contact.fullName}</span>.
                                </p>
                              </div>
                              <button type="button" onClick={() => !merging && setMergeOpen(false)} disabled={merging} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" aria-label="Close merge"><X size={16} /></button>
                            </div>

                            <input
                              autoFocus
                              value={mergeQuery}
                              onChange={(event) => void searchMergeCandidates(event.target.value)}
                              placeholder="Search by name, email, or phone"
                              className="mt-4 h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]"
                            />

                            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
                              {mergeSearching ? (
                                <p className="py-6 text-center text-xs text-[var(--theme-text-muted)]">Searching…</p>
                              ) : mergeQuery.trim().length < 2 ? (
                                <p className="py-6 text-center text-xs text-[var(--theme-text-muted)]">Enter at least 2 characters to search.</p>
                              ) : mergeResults.length === 0 ? (
                                <p className="py-6 text-center text-xs text-[var(--theme-text-muted)]">No matching contacts found.</p>
                              ) : mergeResults.map((contact) => (
                                <button
                                  key={contact._id}
                                  type="button"
                                  onClick={() => setMergeDuplicateId(contact._id)}
                                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                                    mergeDuplicateId === contact._id
                                      ? "border-[#0d9488] bg-[#0d9488]/10"
                                      : "border-[var(--theme-border)] bg-[var(--theme-input)] hover:border-[var(--theme-border)]"
                                  }`}
                                >
                                  <p className="text-sm font-medium text-[var(--theme-text)]">{contact.fullName}</p>
                                  <p className="mt-0.5 text-xs text-[var(--theme-text-muted)]">
                                    {[contact.email, contact.phone].filter(Boolean).join(" · ") || "No contact details"}
                                  </p>
                                </button>
                              ))}
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                              <button type="button" onClick={() => !merging && setMergeOpen(false)} disabled={merging} className="h-10 rounded-full px-4 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:text-[var(--theme-text)]">Cancel</button>
                              <Button type="button" size="sm" disabled={!mergeDuplicateId || merging} onClick={() => void performMerge()}>
                                {merging ? "Merging…" : "Merge duplicate"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <section data-testid="crm-quick-actions">
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">Quick actions</h3>
                        <div className="mt-2 grid grid-cols-6 gap-1">
                          <a href={detail.contact.phone ? `tel:${detail.contact.phone}` : undefined} className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition ${detail.contact.phone ? "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" : "pointer-events-none text-[var(--theme-text-muted)]"}`}><Phone size={14} />Call</a>
                          <a href={detail.contact.email ? `mailto:${detail.contact.email}` : undefined} className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition ${detail.contact.email ? "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" : "pointer-events-none text-[var(--theme-text-muted)]"}`}><Mail size={14} />Email</a>
                          <a href={whatsAppHref(detail.contact.phone) || undefined} target="_blank" rel="noreferrer" className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition ${whatsAppHref(detail.contact.phone) ? "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]" : "pointer-events-none text-[var(--theme-text-muted)]"}`}><MessageSquare size={14} />WhatsApp</a>
                          <button type="button" onClick={() => startActivity("note")} className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"><MessageSquare size={14} />Note</button>
                          <button type="button" onClick={() => startActivity("task")} className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"><Calendar size={14} />Task</button>
                          {canManage && <button type="button" onClick={openMerge} className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"><Users size={14} />Merge</button>}
                        </div>
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Next action</h3>
                            <p className={`mt-1.5 text-sm font-semibold ${followUpMeta(detail.opportunity?.nextFollowUpAt).status === "overdue" || followUpMeta(detail.opportunity?.nextFollowUpAt).status === "invalid" ? "text-amber-300" : "text-[var(--theme-text)]"}`}>{followUpMeta(detail.opportunity?.nextFollowUpAt).label}</p>
                          </div>
                          {canManage && <button type="button" onClick={() => setDetailTab("edit")} className="text-xs font-semibold text-[#ff7ac7] hover:text-[#ff9bd5]">Edit</button>}
                        </div>
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Details</h3>
                        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                          <div className="min-w-0"><dt className="text-[11px] text-[var(--theme-text-muted)]">Email</dt><dd className="mt-1 break-words text-xs text-[var(--theme-text-secondary)]">{detail.contact.email || "—"}</dd></div>
                          <div className="min-w-0"><dt className="text-[11px] text-[var(--theme-text-muted)]">Phone</dt><dd className="mt-1 break-words text-xs text-[var(--theme-text-secondary)]">{detail.contact.phone || "—"}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Source</dt><dd className="mt-1 text-xs text-[var(--theme-text-secondary)]">{detail.contact.source || "—"}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Source detail</dt><dd className="mt-1 break-words text-xs text-[var(--theme-text-secondary)]">{detail.contact.sourceDetail || "—"}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Preferred contact</dt><dd className="mt-1 text-xs text-[var(--theme-text-secondary)]">{PREFERRED_CONTACT_LABELS[detail.contact.preferredContactMethod || "no_preference"]}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Priority</dt><dd className="mt-1 text-xs font-semibold text-[var(--theme-text-secondary)]">{LEAD_PRIORITY_LABELS[detail.opportunity?.leadPriority || "normal"]}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Value</dt><dd className="mt-1 text-xs font-semibold text-[var(--theme-text-secondary)]">{money(detail.opportunity?.estimatedValue)}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Owner</dt><dd className="mt-1 text-xs text-[var(--theme-text-secondary)]">{getStaffName(detail.contact.assignedTo || detail.opportunity?.assignedTo)}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Stage since</dt><dd className="mt-1 text-xs text-[var(--theme-text-secondary)]">{shortDateTime(detail.opportunity?.stageEnteredAt)}</dd></div>
                          <div><dt className="text-[11px] text-[var(--theme-text-muted)]">Created</dt><dd className="mt-1 text-xs text-[var(--theme-text-secondary)]">{shortDate(detail.contact.createdAt)}</dd></div>
                        </dl>
                      </section>

                      <CrmContactTags
                        contactId={detail.contact._id}
                        tagKeys={detail.contact.tags || []}
                        tags={crmTags}
                        canManage={canManage}
                        onChanged={async () => {
                          await openDetail(
                            detail.contact._id,
                            "overview"
                          );
                          await load(true);
                        }}
                      />

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Tag history</h3>
                        <div className="mt-3 space-y-2">
                          {detail.activities
                            .filter(
                              (activity) =>
                                activity.type === "system" &&
                                (activity.subject === "CRM tags updated" ||
                                  activity.body.includes("Added:") ||
                                  activity.body.includes("Removed:"))
                            )
                            .slice(0, 6)
                            .map((activity) => (
                              <div
                                key={activity._id}
                                className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--theme-text-muted)]">
                                  <span>{shortDateTime(activity.createdAt)}</span>
                                  <span>{activity.createdBy?.name || "System"}</span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--theme-text-secondary)]">
                                  {activity.body}
                                </p>
                              </div>
                            ))}
                          {detail.activities.filter(
                            (activity) =>
                              activity.type === "system" &&
                              (activity.subject === "CRM tags updated" ||
                                activity.body.includes("Added:") ||
                                activity.body.includes("Removed:"))
                          ).length === 0 && (
                            <p className="text-xs text-[var(--theme-text-muted)]">
                              No tag changes recorded yet.
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <CustomFieldsEditor entityType="crm_contact" entityId={detail.contact._id} canEdit={canManage} compact />
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <RecordForms entityType="crm_contact" entityId={detail.contact._id} compact />
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Recent activity</h3>
                          <button type="button" onClick={() => setDetailTab("activity")} className="text-xs font-semibold text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text-secondary)]">View all</button>
                        </div>
                        <div className="mt-3 divide-y divide-[var(--theme-border-soft)]">
                          {detail.activities.slice(0, 4).length === 0 ? (
                            <div className="py-5 text-xs text-[var(--theme-text-muted)]">No activity yet.</div>
                          ) : detail.activities.slice(0, 4).map((activity) => (
                            <div key={activity._id} className="py-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{activity.type.replaceAll("_", " ")}</span>
                                <span className="text-[10px] text-[var(--theme-text-muted)]">{shortDateTime(activity.createdAt)}</span>
                              </div>
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--theme-text-secondary)]">{activity.subject || activity.body}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="border-t border-[var(--theme-border)] pt-5">
                        {detail.opportunity?.application || detail.contact.application ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><Check size={14} />This lead is already in Requests.</div>
                        ) : canManage ? (
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0"><h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Ready for Requests?</h3><p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-muted)]">Create the application when this lead is ready to enter the consultation, payment and reconciliation workflow.</p></div>
                            <Button type="button" size="sm" disabled={converting} onClick={() => void convertToApplication()} className="shrink-0">{converting ? "Creating…" : "Create application"}</Button>
                          </div>
                        ) : null}
                      </section>
                    </div>
                  ) : detailTab === "activity" ? (
                    <div className="space-y-6 px-5 py-5">
                      {canManage && (
                        <form onSubmit={addActivity} className="space-y-3 border-b border-[var(--theme-border)] pb-5">
                          <div className="flex flex-wrap gap-1.5">
                            {ACTIVITY_TYPES.map((type) => (
                              <button key={type} type="button" onClick={() => setActivityType(type)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold capitalize transition ${activityType === type ? "bg-[var(--theme-surface-hover)] text-[var(--theme-text)]" : "text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-text-secondary)]"}`}>{type}</button>
                            ))}
                          </div>
                          {activityType === "task" && <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Task due date & time</span><input type="datetime-local" min={CRM_DATE_MIN} max={CRM_DATE_MAX} value={activityDueAt} onChange={(event) => setActivityDueAt(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>}
                          <textarea ref={activityTextRef} required rows={4} value={activityBody} onChange={(event) => setActivityBody(event.target.value)} placeholder={activityType === "task" ? "What needs to be done?" : "Record what happened"} className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)] focus:border-[var(--theme-border)]" />
                          <Button type="submit" size="sm" disabled={activitySaving || !activityBody.trim()}>{activitySaving ? "Saving…" : activityType === "task" ? "Add task" : "Save activity"}</Button>
                        </form>
                      )}

                      <section>
                        <div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Activity history</h3><span className="text-[11px] text-[var(--theme-text-muted)]">{detail.activities.length}</span></div>
                        <div className="mt-3 divide-y divide-[var(--theme-border-soft)]">
                          {detail.activities.length === 0 ? <div className="py-6 text-xs text-[var(--theme-text-muted)]">No activity yet.</div> : detail.activities.map((activity) => (
                            <article key={activity._id} className="py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{activity.type.replaceAll("_", " ")}</p>{activity.subject && <p className="mt-1 text-xs font-semibold text-[var(--theme-text-secondary)]">{activity.subject}</p>}</div>
                                <span className="shrink-0 text-[10px] text-[var(--theme-text-muted)]">{shortDateTime(activity.createdAt)}</span>
                              </div>
                              <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--theme-text-secondary)]">{activity.body}</p>
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--theme-text-muted)]">
                                <span>{activity.createdBy?.name || "System"}</span>
                                {activity.type === "task" && (
                                  <div className="flex items-center gap-2">
                                    {activity.dueAt && <span className={!activity.completedAt && followUpMeta(activity.dueAt).status === "overdue" ? "text-amber-300" : "text-[var(--theme-text-muted)]"}>Due {shortDateTime(activity.dueAt)}</span>}
                                    <button type="button" onClick={() => void toggleTask(activity._id)} className={`rounded-md px-2 py-1 font-semibold transition ${activity.completedAt ? "bg-emerald-600/10 text-emerald-300" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"}`}>{activity.completedAt ? "Completed" : "Mark complete"}</button>
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="space-y-5 px-5 py-5">
                      {detail.opportunity && (
                        <>
                          {storedFollowUpInvalid && <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>Replace the invalid historical follow-up date before saving.</span></div>}
                          <section className="space-y-4">
                            <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Contact preferences</h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Source detail / campaign</span><input maxLength={160} value={contactDraft.sourceDetail} onChange={(event) => setContactDraft((value) => ({ ...value, sourceDetail: event.target.value }))} placeholder="Optional campaign or referral detail" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>

                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Preferred contact</span><select value={contactDraft.preferredContactMethod} onChange={(event) => setContactDraft((value) => ({ ...value, preferredContactMethod: event.target.value as PreferredContactMethod }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{(Object.keys(PREFERRED_CONTACT_LABELS) as PreferredContactMethod[]).map((method) => <option key={method} value={method}>{PREFERRED_CONTACT_LABELS[method]}</option>)}</select></label>
                            </div>
                          </section>

                          <section className="space-y-4 border-t border-[var(--theme-border)] pt-5">
                            <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">Opportunity</h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Stage</span><select value={detail.opportunity.stage} onChange={(event) => void moveStage(detail.opportunity!._id, event.target.value as Stage)} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_META[stage].label}</option>)}</select></label>
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Owner</span><select value={opportunityDraft.assignedTo} onChange={(event) => setOpportunityDraft((value) => ({ ...value, assignedTo: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]"><option value="">Unassigned</option>{assignees.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}</select></label>
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Priority</span><select value={opportunityDraft.leadPriority} onChange={(event) => setOpportunityDraft((value) => ({ ...value, leadPriority: event.target.value as LeadPriority }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]">{(Object.keys(LEAD_PRIORITY_LABELS) as LeadPriority[]).map((priority) => <option key={priority} value={priority}>{LEAD_PRIORITY_LABELS[priority]}</option>)}</select></label>
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Estimated value (₦)</span><input type="number" min="0" value={opportunityDraft.estimatedValue} onChange={(event) => setOpportunityDraft((value) => ({ ...value, estimatedValue: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                              <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Next follow-up</span><input type="datetime-local" min={CRM_DATE_MIN} max={CRM_DATE_MAX} value={opportunityDraft.nextFollowUpAt} onChange={(event) => setOpportunityDraft((value) => ({ ...value, nextFollowUpAt: event.target.value }))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>
                            </div>
                            {detail.opportunity.stage && REQUIRED_FIELD_HINTS[detail.opportunity.stage] ? (
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-200">
                                {REQUIRED_FIELD_HINTS[detail.opportunity.stage]}
                              </div>
                            ) : null}
                            {detail.opportunity.stage === "lost" && <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Lost reason</span><textarea rows={3} value={opportunityDraft.lostReason} onChange={(event) => setOpportunityDraft((value) => ({ ...value, lostReason: event.target.value }))} className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none focus:border-[var(--theme-border)]" /></label>}
                          </section>
                          <div className="flex justify-end border-t border-[var(--theme-border)] pt-4"><Button type="button" size="sm" disabled={opportunitySaving} onClick={() => void saveOpportunityDetails()}>{opportunitySaving ? "Saving…" : "Save changes"}</Button></div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
