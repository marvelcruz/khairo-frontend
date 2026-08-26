"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type ElementType, type ReactNode, type SetStateAction } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Copy,
  GitBranch,
  Loader2,
  Pause,
  Play,
  Plus,
  Save,
  Settings2,
  StickyNote,
  Tags,
  Timer,
  UserPlus,
  Workflow as WorkflowIcon,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "../../../lib/api";
import { Button } from "../../../components/ui/button";

type TriggerType = "crm_lead_created" | "crm_stage_changed" | "crm_tag_changed" | "form_submitted" | "application_submitted" | "client_activated" | "client_status_changed" | "payment_success" | "appointment_booked" | "appointment_completed" | "appointment_no_show" | "manual";
type ActionType = "add_note" | "create_task" | "set_stage" | "set_follow_up" | "assign_owner" | "add_tag" | "remove_tag" | "send_email" | "send_portal_message" | "notify_staff" | "wait";
type WorkflowStatus = "draft" | "active" | "paused";

type WorkflowAction = { _id?: string; type: ActionType; config: Record<string, string | number>; condition?: Record<string, unknown>; retry?: { maxAttempts?: number; delayMinutes?: number } };
type WorkflowDefinition = {
  _id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  mode?: "live" | "test";
  isTemplate?: boolean;
  templateCategory?: string;
  trigger: { type: TriggerType; config: Record<string, string> };
  actions: WorkflowAction[];
  lastRunAt?: string;
  runCount?: number;
  successCount?: number;
  failureCount?: number;
  successRate?: number | null;
  updatedAt?: string;
};
type WorkflowRun = {
  _id: string;
  workflow: string;
  workflowName: string;
  triggerType: TriggerType;
  status: "running" | "success" | "partial" | "failed" | "skipped";
  actorName?: string;
  steps?: Array<{ actionType: ActionType; status: string; message: string }>;
  createdAt: string;
};
type WorkflowTagOption = {
  key: string;
  name: string;
  active: boolean;
};

type ReferenceData = {
  users: Array<{ _id: string; name: string; roles: string[] }>;
  forms: Array<{ _id: string; name: string; status: string; visibility: string }>;
  stages: string[];
  tags: WorkflowTagOption[];
};
type ContactOption = { _id: string; fullName: string; email?: string; phone?: string };

type DraftWorkflow = Omit<WorkflowDefinition, "_id"> & { _id?: string };

const TRIGGERS: Array<{ value: TriggerType; label: string; description: string }> = [
  { value: "crm_lead_created", label: "New CRM lead", description: "Runs when a new lead is created in CRM." },
  { value: "crm_stage_changed", label: "CRM stage changed", description: "Runs when an opportunity moves between pipeline stages." },
  { value: "crm_tag_changed", label: "CRM tag changed", description: "Runs when a CRM tag is added to or removed from a contact." },
  { value: "form_submitted", label: "Form submitted", description: "Runs after a published KhairoDietClinic form is submitted." },
  { value: "application_submitted", label: "Application submitted", description: "Runs when a new Request/application enters KhairoDietClinic." },
  { value: "client_activated", label: "Client activated", description: "Runs when enrollment completes and a client becomes active." },
  { value: "client_status_changed", label: "Client status changed", description: "Runs when a client is paused, resumed, completed, or cancelled through Client Lifecycle." },
  { value: "payment_success", label: "Payment successful", description: "Runs after a verified successful payment is recorded." },
  { value: "appointment_booked", label: "Appointment booked", description: "Runs after a consultation is booked or rescheduled." },
  { value: "appointment_completed", label: "Appointment completed", description: "Runs after a consultation outcome is recorded as completed." },
  { value: "appointment_no_show", label: "Appointment no-show", description: "Runs after a consultation outcome is recorded as no-show." },
  { value: "manual", label: "Manual", description: "Run this workflow on a CRM contact when you choose." },
];

const ACTIONS: Array<{ value: ActionType; label: string; icon: ElementType }> = [
  { value: "add_note", label: "Add CRM note", icon: StickyNote },
  { value: "create_task", label: "Create CRM task", icon: CalendarClock },
  { value: "set_stage", label: "Move pipeline stage", icon: GitBranch },
  { value: "set_follow_up", label: "Set next follow-up", icon: CalendarClock },
  { value: "assign_owner", label: "Assign owner", icon: UserPlus },
  { value: "add_tag", label: "Add CRM tag", icon: Tags },
  { value: "remove_tag", label: "Remove CRM tag", icon: Tags },
  { value: "send_email", label: "Send email", icon: Activity },
  { value: "send_portal_message", label: "Send portal message", icon: StickyNote },
  { value: "notify_staff", label: "Notify staff", icon: Bell },
  { value: "wait", label: "Wait / delay", icon: Timer },
];

const TRIGGER_LABEL = Object.fromEntries(TRIGGERS.map((item) => [item.value, item.label])) as Record<TriggerType, string>;
const STAGE_LABELS: Record<string, string> = {
  new: "New Lead",
  qualification: "Qualification",
  qualified: "Qualified",
  consultation_booked: "Consultation Booked",
  consultation_completed: "Consultation Completed",
  medical_review: "Medical Review",
  payment_pending: "Payment Pending",
  nurture: "Nurture",
  lost: "Lost",
};
const PROGRAMS = [
  ["", "Any program"], ["core", "Core"], ["plus", "Plus"], ["vip", "VIP"], ["not_sure", "Not sure"],
] as const;

function freshDraft(): DraftWorkflow {
  return {
    name: "Untitled workflow",
    description: "",
    status: "draft",
    mode: "live",
    isTemplate: false,
    templateCategory: "",
    trigger: { type: "crm_lead_created", config: {} },
    actions: [{ type: "add_note", config: { body: "New lead captured: {{contact.name}}" } }],
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    successRate: null,
  };
}

function formatDate(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function statusStyle(status: WorkflowStatus) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
  if (status === "paused") return "border-amber-400/20 bg-amber-400/[0.06] text-amber-300";
  return "border-[var(--theme-border)] text-[var(--theme-text-muted)]";
}

function actionDefaults(type: ActionType): Record<string, string | number> {
  if (type === "add_note") return { body: "Workflow note for {{contact.name}}" };
  if (type === "create_task") return { body: "Follow up with {{contact.name}}", dueInDays: 1, hour: 10 };
  if (type === "set_stage") return { stage: "new" };
  if (type === "set_follow_up") return { daysFromNow: 1, hour: 10 };
  if (type === "assign_owner") return { userId: "" };
  if (type === "add_tag" || type === "remove_tag") return { tag: "" };
  if (type === "send_email") return { subject: "", body: "" };
  if (type === "send_portal_message") return { body: "", category: "general", senderName: "KhairoDietClinic Team" };
  if (type === "wait") return { durationMinutes: 60 };
  if (type === "notify_staff") return { userId: "", subject: "", body: "" };
  return {};
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">{children}</span>;
}

function TriggerConfig({ draft, setDraft, refs }: { draft: DraftWorkflow; setDraft: Dispatch<SetStateAction<DraftWorkflow>>; refs: ReferenceData }) {
  const config = draft.trigger.config || {};
  const setConfig = (patch: Record<string, string>) => setDraft((current) => ({ ...current, trigger: { ...current.trigger, config: { ...current.trigger.config, ...patch } } }));
  const conditionTags = refs.tags.filter((tag)=>tag.active || tag.key===config.requiredTag || tag.key===config.excludedTag);
  return <div className="grid gap-3 sm:grid-cols-2">
    {draft.trigger.type === "crm_stage_changed" && <>
      <label><FieldLabel>From stage <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.fromStage || ""} onChange={(e)=>setConfig({ fromStage: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any stage</option>{refs.stages.map((stage)=><option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}</select></label>
      <label><FieldLabel>To stage <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.toStage || ""} onChange={(e)=>setConfig({ toStage: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any stage</option>{refs.stages.map((stage)=><option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}</select></label>
    </>}
    {draft.trigger.type === "crm_tag_changed" && <>
      <label><FieldLabel>Tag <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.tag || ""} onChange={(e)=>setConfig({ tag: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any tag</option>{refs.tags.filter((tag)=>tag.active || tag.key===config.tag).map((tag)=><option key={tag.key} value={tag.key}>{tag.name}{!tag.active ? " (archived)" : ""}</option>)}</select></label>
      <label><FieldLabel>Change</FieldLabel><select value={config.change || "either"} onChange={(e)=>setConfig({ change: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="either">Added or removed</option><option value="added">Added</option><option value="removed">Removed</option></select></label>
    </>}
    {draft.trigger.type === "form_submitted" && <label className="sm:col-span-2"><FieldLabel>Form <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.formId || ""} onChange={(e)=>setConfig({ formId: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any form</option>{refs.forms.map((form)=><option key={form._id} value={form._id}>{form.name} · {form.status}</option>)}</select></label>}
    {["crm_lead_created","application_submitted","client_activated","client_status_changed"].includes(draft.trigger.type) && <label><FieldLabel>Program <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.programInterest || ""} onChange={(e)=>setConfig({ programInterest: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">{PROGRAMS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
    {draft.trigger.type === "crm_lead_created" && <label><FieldLabel>Lead source <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><input value={config.source || ""} onChange={(e)=>setConfig({ source: e.target.value })} placeholder="e.g. website_contact" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label>}
    {draft.trigger.type !== "manual" && <>
      <div className="sm:col-span-2 mt-1 border-t border-[var(--theme-border)] pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Optional conditions</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Use these to narrow the trigger. Both conditions are checked against the linked CRM contact before actions run.</p></div>
      <label><FieldLabel>Required contact tag <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.requiredTag || ""} onChange={(e)=>setConfig({ requiredTag: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">No required tag</option>{conditionTags.map((tag)=><option key={tag.key} value={tag.key}>{tag.name}{!tag.active ? " (archived)" : ""}</option>)}</select></label>
      <label><FieldLabel>Excluded contact tag <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><select value={config.excludedTag || ""} onChange={(e)=>setConfig({ excludedTag: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">No excluded tag</option>{conditionTags.map((tag)=><option key={tag.key} value={tag.key}>{tag.name}{!tag.active ? " (archived)" : ""}</option>)}</select></label>
    </>}
    {draft.trigger.type === "manual" && <p className="sm:col-span-2 text-xs leading-5 text-[var(--theme-text-muted)]">Manual workflows appear with a Run button in the workflow library. Choose a CRM contact and KhairoDietClinic executes the actions immediately.</p>}
  </div>;
}

function ActionConfig({ action, refs, update }: { action: WorkflowAction; refs: ReferenceData; update: (config: Record<string,string|number>)=>void }) {
  const c = action.config || {};
  if (action.type === "add_note") return <label><FieldLabel>Note</FieldLabel><textarea rows={3} value={String(c.body || "")} onChange={(e)=>update({ ...c, body: e.target.value })} className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none"/></label>;
  if (action.type === "create_task") return <div className="grid gap-3 sm:grid-cols-[1fr_120px_110px]"><label><FieldLabel>Task details</FieldLabel><input value={String(c.body || "")} onChange={(e)=>update({ ...c, body: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label><label><FieldLabel>Due in days</FieldLabel><input type="number" min={0} max={365} value={Number(c.dueInDays ?? 1)} onChange={(e)=>update({ ...c, dueInDays: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label><label><FieldLabel>Hour</FieldLabel><input type="number" min={0} max={23} value={Number(c.hour ?? 10)} onChange={(e)=>update({ ...c, hour: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label></div>;
  if (action.type === "set_stage") return <label><FieldLabel>Destination stage</FieldLabel><select value={String(c.stage || "new")} onChange={(e)=>update({ ...c, stage: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">{refs.stages.map((stage)=><option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}</select></label>;
  if (action.type === "set_follow_up") return <div className="grid grid-cols-2 gap-3"><label><FieldLabel>Days from now</FieldLabel><input type="number" min={0} max={365} value={Number(c.daysFromNow ?? 1)} onChange={(e)=>update({ ...c, daysFromNow: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label><label><FieldLabel>Hour</FieldLabel><input type="number" min={0} max={23} value={Number(c.hour ?? 10)} onChange={(e)=>update({ ...c, hour: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label></div>;
  if (action.type === "assign_owner") return <label><FieldLabel>Assign to</FieldLabel><select value={String(c.userId || "")} onChange={(e)=>update({ ...c, userId: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Choose owner</option>{refs.users.map((user)=><option key={user._id} value={user._id}>{user.name}</option>)}</select></label>;
  if (action.type === "send_email") return <div className="space-y-3"><label><FieldLabel>Email subject</FieldLabel><input maxLength={180} value={String(c.subject || "")} onChange={(e)=>update({ ...c, subject: e.target.value })} placeholder="Subject line" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label><label><FieldLabel>Email body</FieldLabel><textarea rows={5} maxLength={5000} value={String(c.body || "")} onChange={(e)=>update({ ...c, body: e.target.value })} placeholder="Write the email KhairoDietClinic should send" className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label></div>;
  if (action.type === "send_portal_message") return <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label><FieldLabel>Category</FieldLabel><select value={String(c.category || "general")} onChange={(e)=>update({ ...c, category: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="general">General</option><option value="plan">Plan</option><option value="appointment">Appointment</option><option value="billing">Billing</option><option value="technical">Technical</option><option value="help">Help</option></select></label><label><FieldLabel>Sender name</FieldLabel><input value={String(c.senderName || "KhairoDietClinic Team")} onChange={(e)=>update({ ...c, senderName: e.target.value })} placeholder="KhairoDietClinic Team" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label></div><label><FieldLabel>Portal message</FieldLabel><textarea rows={5} maxLength={3000} value={String(c.body || "")} onChange={(e)=>update({ ...c, body: e.target.value })} placeholder="Write the message the client should see in their portal" className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label></div>;

  if (action.type === "notify_staff") return <div className="space-y-3"><label><FieldLabel>Recipient</FieldLabel><select value={String(c.userId || "")} onChange={(e)=>update({ ...c, userId: e.target.value })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Assigned owner</option>{refs.users.map((user)=><option key={user._id} value={user._id}>{user.name}</option>)}</select></label><label><FieldLabel>Subject</FieldLabel><input value={String(c.subject || "")} onChange={(e)=>update({ ...c, subject: e.target.value })} placeholder="Notification subject" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label><label><FieldLabel>Message</FieldLabel><textarea rows={4} maxLength={5000} value={String(c.body || "")} onChange={(e)=>update({ ...c, body: e.target.value })} placeholder="Write the staff notification" className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label></div>;

  if (action.type === "wait") return <label><FieldLabel>Wait duration (minutes)</FieldLabel><input type="number" min={1} max={10080} value={Number(c.durationMinutes || 60)} onChange={(e)=>update({ ...c, durationMinutes: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label>;

  if (action.type === "add_tag" || action.type === "remove_tag") {
    const configuredTag = String(c.tag || "");
    const configuredExists = refs.tags.some((tag) => tag.key === configuredTag);

    return <label>
      <FieldLabel>{action.type === "add_tag" ? "Tag to add" : "Tag to remove"}</FieldLabel>
      <select
        value={configuredTag}
        onChange={(e)=>update({ ...c, tag: e.target.value })}
        className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"
      >
        <option value="">Choose approved tag</option>
        {configuredTag && !configuredExists && (
          <option value={configuredTag}>
            Unavailable / legacy: {configuredTag}
          </option>
        )}
        {refs.tags
          .filter((tag) => action.type === "remove_tag" || tag.active)
          .map((tag) => (
            <option key={tag.key} value={tag.key}>
              {tag.name}{!tag.active ? " (archived)" : ""}
            </option>
          ))}
      </select>
    </label>;
  }

  return null;
}

function ActionMetaEditor({ action, refs, index, updateAction }: { action: WorkflowAction; refs: ReferenceData; index: number; updateAction: (index: number, next: WorkflowAction) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const condition = (action.condition || {}) as Record<string, any>;
  const retry = (action.retry || {}) as { maxAttempts?: number; delayMinutes?: number };

  const setCondition = (patch: Record<string, unknown>) =>
    updateAction(index, { ...action, condition: { ...condition, ...patch } });

  const setRetry = (patch: Record<string, unknown>) =>
    updateAction(index, { ...action, retry: { ...retry, ...patch } });

  const requiredTags = Array.isArray(condition.requiredTags) ? condition.requiredTags : [];
  const excludedTags = Array.isArray(condition.excludedTags) ? condition.excludedTags : [];

  return <div className="mt-3 grid gap-3 border-t border-[var(--theme-border)] pt-3 sm:grid-cols-2">
    <div className="sm:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Action conditions</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Optional. This action only runs when the selected contact matches all conditions.</p></div>

    <label><FieldLabel>Program interest</FieldLabel><select value={String(condition.programInterest || "")} onChange={(e)=>setCondition({ programInterest: e.target.value || undefined })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any program</option>{PROGRAMS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>

    <label><FieldLabel>CRM stage</FieldLabel><select value={String(condition.stage || "")} onChange={(e)=>setCondition({ stage: e.target.value || undefined })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Any stage</option>{refs.stages.map((stage)=><option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}</select></label>

    <label><FieldLabel>Required tags</FieldLabel><input value={requiredTags.join(", ")} onChange={(e)=>setCondition({ requiredTags: e.target.value.split(",").map((tag)=>tag.trim()).filter(Boolean) })} placeholder="tag1, tag2" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label>

    <label><FieldLabel>Excluded tags</FieldLabel><input value={excludedTags.join(", ")} onChange={(e)=>setCondition({ excludedTags: e.target.value.split(",").map((tag)=>tag.trim()).filter(Boolean) })} placeholder="tag1, tag2" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label>

    <div className="sm:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Retry</p></div>

    <label><FieldLabel>Max attempts</FieldLabel><input type="number" min={1} max={3} value={Number(retry.maxAttempts || 1)} onChange={(e)=>setRetry({ maxAttempts: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label>

    <label><FieldLabel>Delay minutes</FieldLabel><input type="number" min={0} max={60} value={Number(retry.delayMinutes || 0)} onChange={(e)=>setRetry({ delayMinutes: Number(e.target.value) })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label>
  </div>;
}

function WorkflowBuilder({ initial, refs, onClose, onSaved }: { initial: WorkflowDefinition | null; refs: ReferenceData; onClose:()=>void; onSaved:()=>Promise<void> }) {
  const [draft, setDraft] = useState<DraftWorkflow>(() => initial ? JSON.parse(JSON.stringify(initial)) : freshDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      const body = {
        name: draft.name,
        description: draft.description || "",
        mode: draft.mode || "live",
        isTemplate: draft.isTemplate || false,
        templateCategory: draft.templateCategory || "",
        trigger: draft.trigger,
        actions: draft.actions,
      };
      const response = draft._id ? await api.patch<{ workflow: WorkflowDefinition }>(`/workflows/${draft._id}`, body) : await api.post<{ workflow: WorkflowDefinition }>("/workflows", body);
      setDraft(response.workflow);
      await onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save workflow."); }
    finally { setSaving(false); }
  };

  const setStatus = async (status: WorkflowStatus) => {
    if (!draft._id) { setError("Save the workflow before activating it."); return; }
    setSaving(true); setError("");
    try { const response = await api.patch<{ workflow: WorkflowDefinition }>(`/workflows/${draft._id}/status`, { status }); setDraft(response.workflow); await onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update workflow status."); }
    finally { setSaving(false); }
  };

  const updateAction = (index: number, next: WorkflowAction) => setDraft((current) => current ? ({ ...current, actions: current.actions.map((item,i)=>i===index?next:item) }) : current);
  const moveAction = (index: number, direction: -1|1) => setDraft((current) => {
    if (!current) return current; const target=index+direction; if(target<0||target>=current.actions.length)return current; const actions=[...current.actions]; [actions[index],actions[target]]=[actions[target],actions[index]]; return {...current,actions};
  });
  const removeAction = (index: number) => setDraft((current)=>current?({...current,actions:current.actions.filter((_,i)=>i!==index)}):current);

  return <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[2px]" data-testid="workflow-builder"><div className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl">
    <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4 sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><WorkflowIcon size={15} className="text-[#0d9488]"/><h2 className="truncate text-base font-semibold text-white">{draft.name || "Untitled workflow"}</h2><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusStyle(draft.status)}`}>{draft.status}</span></div><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Define the trigger, then tell KhairoDietClinic exactly what should happen.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-white"><X size={16}/></button></header>
    <main className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:p-5"><label><FieldLabel>Workflow name</FieldLabel><input value={draft.name} onChange={(e)=>setDraft((c)=>c?({...c,name:e.target.value}):c)} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-base font-medium text-white outline-none focus:border-[#0d9488]/50"/></label><label className="mt-3 block"><FieldLabel>Description <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel><input value={draft.description || ""} onChange={(e)=>setDraft((c)=>c?({...c,description:e.target.value}):c)} placeholder="What this workflow is responsible for" className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"/></label>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <label className="inline-flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
          <input
            type="checkbox"
            checked={draft.mode === "test"}
            onChange={(event) => setDraft((current) => current ? ({ ...current, mode: event.target.checked ? "test" : "live" }) : current)}
            className="h-4 w-4 rounded border-[var(--theme-border)] bg-[var(--theme-input)] accent-[#0d9488]"
          />
          Test mode (skip actions)
        </label>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
          <input
            type="checkbox"
            checked={draft.isTemplate === true}
            onChange={(event) => setDraft((current) => current ? ({ ...current, isTemplate: event.target.checked }) : current)}
            className="h-4 w-4 rounded border-[var(--theme-border)] bg-[var(--theme-input)] accent-[#0d9488]"
          />
          Workflow template
        </label>
      </div>

      {draft.isTemplate && (
        <label className="mt-3 block">
          <FieldLabel>Template category <span className="text-[var(--theme-text-muted)]">optional</span></FieldLabel>
          <input
            value={draft.templateCategory || ""}
            onChange={(event) => setDraft((current) => current ? ({ ...current, templateCategory: event.target.value }) : current)}
            placeholder="e.g. Onboarding"
            className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
          />
        </label>
      )}</section>
      <section className="rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/[0.025] p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#0d9488]/10 text-[#ff76c5]"><Zap size={15}/></span><div><p className="text-sm font-semibold text-white">When this happens</p><p className="text-xs text-[var(--theme-text-muted)]">The event that starts the workflow.</p></div></div><label><FieldLabel>Trigger</FieldLabel><select value={draft.trigger.type} onChange={(e)=>setDraft((c)=>c?({...c,trigger:{type:e.target.value as TriggerType,config:{}}}):c)} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">{TRIGGERS.map((trigger)=><option key={trigger.value} value={trigger.value}>{trigger.label}</option>)}</select></label><p className="mt-2 text-xs leading-5 text-[var(--theme-text-muted)]">{TRIGGERS.find((item)=>item.value===draft.trigger.type)?.description}</p><div className="mt-4"><TriggerConfig draft={draft} setDraft={setDraft} refs={refs}/></div></section>
      <section><div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-semibold text-white">Then do this</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Actions run from top to bottom. A failed action is recorded without hiding the remaining steps.</p></div><span className="text-xs text-[var(--theme-text-muted)]">{draft.actions.length}/12 actions</span></div><div className="space-y-3">{draft.actions.map((action,index)=>{const meta=ACTIONS.find((item)=>item.value===action.type);const Icon=meta?.icon||CircleDot;return <div key={action._id || `${action.type}-${index}`} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"><Icon size={14}/></span><select value={action.type} onChange={(e)=>updateAction(index,{type:e.target.value as ActionType,config:actionDefaults(e.target.value as ActionType)})} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 text-sm font-medium text-white outline-none">{ACTIONS.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select><button onClick={()=>moveAction(index,-1)} disabled={index===0} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white disabled:opacity-20"><ArrowUp size={14}/></button><button onClick={()=>moveAction(index,1)} disabled={index===draft.actions.length-1} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white disabled:opacity-20"><ArrowDown size={14}/></button><button onClick={()=>removeAction(index)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-rose-400/[0.08] hover:text-rose-300"><X size={14}/></button></div><div className="mt-4 pl-0 sm:pl-11"><ActionConfig action={action} refs={refs} update={(config)=>updateAction(index,{...action,config})}/><ActionMetaEditor action={action} refs={refs} index={index} updateAction={updateAction}/></div></div>})}</div><button disabled={draft.actions.length>=12} onClick={()=>setDraft((c)=>c?({...c,actions:[...c.actions,{type:"add_note",config:actionDefaults("add_note")}]}):c)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:text-white disabled:opacity-30"><Plus size={14}/>Add action</button></section>
      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Message tokens</p><p className="mt-2 text-xs leading-5 text-[var(--theme-text-muted)]">Notes, tasks, email fields, and portal messages can use <code className="text-[#ff76c5]">{"{{contact.name}}"}</code>, <code className="text-[#ff76c5]">{"{{contact.email}}"}</code>, <code className="text-[#ff76c5]">{"{{contact.program}}"}</code>, <code className="text-[#ff76c5]">{"{{tag.name}}"}</code>, <code className="text-[#ff76c5]">{"{{tag.change}}"}</code>, <code className="text-[#ff76c5]">{"{{stage.to}}"}</code> and <code className="text-[#ff76c5]">{"{{form.name}}"}</code>.</p></section>
    </div></main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 sm:px-6"><div className="min-h-5">{error&&<p className="text-xs text-rose-300">{error}</p>}</div><div className="flex items-center gap-2">{draft._id&&<button disabled={saving} onClick={()=>void setStatus(draft.status==="active"?"paused":"active")} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold ${draft.status==="active"?"border-amber-400/20 text-amber-300":"border-emerald-400/20 text-emerald-300"}`}>{draft.status==="active"?<Pause size={13}/>:<Play size={13}/>} {draft.status==="active"?"Pause":"Activate"}</button>}<Button size="sm" disabled={saving} onClick={()=>void save()}>{saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}Save</Button></div></footer>
  </div></div>;
}

function ManualRunDialog({ workflow, contacts, onClose, onDone }: { workflow: WorkflowDefinition; contacts: ContactOption[]; onClose:()=>void; onDone:()=>Promise<void> }) {
  const [contactId,setContactId]=useState(contacts[0]?._id||""); const [running,setRunning]=useState(false); const [error,setError]=useState("");
  const run=async()=>{if(!contactId){setError("Choose a CRM contact.");return;}setRunning(true);setError("");try{await api.post(`/workflows/${workflow._id}/run`,{contactId});await onDone();onClose();}catch(err){setError(err instanceof Error?err.message:"Could not run workflow.");}finally{setRunning(false)}};
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4"><div className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-white">Run workflow</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{workflow.name}</p></div><button onClick={onClose} className="text-[var(--theme-text-muted)] hover:text-white"><X size={16}/></button></div><label className="mt-5 block"><FieldLabel>CRM contact</FieldLabel><select value={contactId} onChange={(e)=>setContactId(e.target.value)} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"><option value="">Choose contact</option>{contacts.map((contact)=><option key={contact._id} value={contact._id}>{contact.fullName}{contact.email?` · ${contact.email}`:""}</option>)}</select></label>{error&&<p className="mt-3 text-xs text-rose-300">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="h-10 rounded-full px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white">Cancel</button><Button size="sm" disabled={running} onClick={()=>void run()}>{running?<Loader2 size={13} className="animate-spin"/>:<Play size={13}/>}Run now</Button></div></div></div>;
}

export default function WorkflowsPage() {
  const [workflows,setWorkflows]=useState<WorkflowDefinition[]>([]); const [runs,setRuns]=useState<WorkflowRun[]>([]); const [refs,setRefs]=useState<ReferenceData>({users:[],forms:[],stages:[],tags:[]}); const [contacts,setContacts]=useState<ContactOption[]>([]); const [stats,setStats]=useState({total:0,active:0,runsToday:0,failuresToday:0}); const [loading,setLoading]=useState(true); const [tab,setTab]=useState<"workflows"|"history">("workflows"); const [editor,setEditor]=useState<WorkflowDefinition|"new"|null>(null); const [manual,setManual]=useState<WorkflowDefinition|null>(null); const [error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{const [w,r,ref,c,tagData]=await Promise.all([api.get<{workflows:WorkflowDefinition[];stats:typeof stats}>("/workflows"),api.get<{runs:WorkflowRun[]}>("/workflows/runs"),api.get<Omit<ReferenceData,"tags">>("/workflows/reference-data"),api.get<{contacts:ContactOption[]}>("/workflows/manual-contacts"),api.get<{tags:WorkflowTagOption[]}>("/crm/tags",{params:{includeInactive:true}})]);setWorkflows(w.workflows||[]);setStats(w.stats||{total:0,active:0,runsToday:0,failuresToday:0});setRuns(r.runs||[]);setRefs({users:ref.users||[],forms:ref.forms||[],stages:ref.stages||[],tags:tagData.tags||[]});setContacts(c.contacts||[]);}catch(err){setError(err instanceof Error?err.message:"Could not load workflows.");}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  const open=async(id:string)=>{try{const response=await api.get<{workflow:WorkflowDefinition}>(`/workflows/${id}`);setEditor(response.workflow)}catch(err){setError(err instanceof Error?err.message:"Could not open workflow.")}};
  const duplicateTemplate = async (id: string) => {
    try {
      await api.post(`/workflows/templates/${id}/duplicate`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not duplicate workflow template.");
    }
  };
  const successRate=useMemo(()=>{const complete=runs.filter((run)=>run.status!=="running"&&run.status!=="skipped");return complete.length?Math.round((complete.filter((run)=>run.status==="success").length/complete.length)*100):100},[runs]);
  return <div data-testid="workflows-admin" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#ff76c5]"><WorkflowIcon size={14}/>Automation</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Workflow Builder</h1><p className="mt-1 max-w-2xl text-sm text-[var(--theme-text-muted)]">Automate repeatable KhairoDietClinic follow-up without hiding what happened. Every run keeps a step-by-step history.</p></div><Button data-testid="new-workflow-button" onClick={()=>setEditor("new")}><Plus size={15}/>New workflow</Button></header>
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] sm:grid-cols-4">{[["Workflows",stats.total],["Active",stats.active],["Runs today",stats.runsToday],["Success rate",`${successRate}%`]].map(([label,value])=><div key={String(label)} className="border-b border-r border-[var(--theme-border)] p-4 last:border-r-0 sm:border-b-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}</div>
    <div className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]"><div className="flex items-center gap-4 border-b border-[var(--theme-border)] px-4"><button onClick={()=>setTab("workflows")} className={`border-b-2 py-3 text-xs font-semibold ${tab==="workflows"?"border-[#0d9488] text-white":"border-transparent text-[var(--theme-text-muted)]"}`}>Workflows</button><button onClick={()=>setTab("history")} className={`border-b-2 py-3 text-xs font-semibold ${tab==="history"?"border-[#0d9488] text-white":"border-transparent text-[var(--theme-text-muted)]"}`}>Run history</button></div>{error&&<p className="border-b border-[var(--theme-border)] px-4 py-3 text-xs text-rose-300">{error}</p>}
      {loading?<div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--theme-text-muted)]"><Loader2 size={15} className="animate-spin"/>Loading workflows…</div>:tab==="workflows"?<div className="divide-y divide-[var(--theme-border-soft)]">{workflows.map((workflow)=><div key={workflow._id} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-[var(--theme-surface-hover)] sm:flex-row sm:items-center"><button onClick={()=>void open(workflow._id)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-[var(--theme-text)]">{workflow.name}</span><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusStyle(workflow.status)}`}>{workflow.status}</span></div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--theme-text-muted)]"><span className="inline-flex items-center gap-1.5"><Zap size={11}/>{TRIGGER_LABEL[workflow.trigger.type]}</span><span>{workflow.actions.length} action{workflow.actions.length===1?"":"s"}</span><span>Last run: {formatDate(workflow.lastRunAt)}</span></div></button><div className="flex items-center gap-2">{workflow.trigger.type==="manual"&&<button onClick={()=>setManual(workflow)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-emerald-300/70 hover:bg-emerald-400/[0.05] hover:text-emerald-300"><Play size={13}/>Run</button>}{workflow.isTemplate&&<button onClick={()=>void duplicateTemplate(workflow._id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:text-white"><Copy size={13}/>Duplicate</button>}<button onClick={()=>void open(workflow._id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:text-white"><Settings2 size={13}/>Edit</button></div></div>)}{workflows.length===0&&<div className="py-16 text-center"><WorkflowIcon size={26} className="mx-auto text-[var(--theme-text-muted)]"/><p className="mt-3 text-sm text-[var(--theme-text-muted)]">No workflows yet.</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Automate the first repeatable KhairoDietClinic follow-up.</p></div>}</div>:<div className="overflow-x-auto"><table className="min-w-full text-left"><thead><tr className="border-b border-[var(--theme-border)] text-[10px] uppercase tracking-[0.08em] text-[var(--theme-text-muted)]"><th className="px-4 py-3 font-semibold">Workflow</th><th className="px-4 py-3 font-semibold">Trigger</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Steps</th><th className="px-4 py-3 font-semibold">Date</th></tr></thead><tbody className="divide-y divide-[var(--theme-border-soft)]">{runs.map((run)=><tr key={run._id} className="text-sm"><td className="px-4 py-3 text-[var(--theme-text-secondary)]">{run.workflowName}</td><td className="px-4 py-3 text-[var(--theme-text-muted)]">{TRIGGER_LABEL[run.triggerType]||run.triggerType}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs ${run.status==="success"?"text-emerald-300":run.status==="failed"||run.status==="partial"?"text-rose-300":"text-[var(--theme-text-muted)]"}`}>{run.status==="success"?<CheckCircle2 size={12}/>:run.status==="failed"||run.status==="partial"?<XCircle size={12}/>:<Activity size={12}/>} {run.status}</span></td><td className="px-4 py-3 text-[var(--theme-text-muted)]">{run.steps?.length||0}</td><td className="whitespace-nowrap px-4 py-3 text-[var(--theme-text-muted)]">{formatDate(run.createdAt)}</td></tr>)}{runs.length===0&&<tr><td colSpan={5} className="px-4 py-14 text-center text-sm text-[var(--theme-text-muted)]">No workflow runs yet.</td></tr>}</tbody></table></div>}</div>
    {editor&&<WorkflowBuilder initial={editor==="new"?null:editor} refs={refs} onClose={()=>setEditor(null)} onSaved={load}/>} {manual&&<ManualRunDialog workflow={manual} contacts={contacts} onClose={()=>setManual(null)} onDone={load}/>} </div>;
}
