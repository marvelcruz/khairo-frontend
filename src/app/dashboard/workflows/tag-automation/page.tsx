"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Plus, RefreshCw, Save, Tags, Trash2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

type TagOption = {
  key: string;
  name: string;
  active: boolean;
  category?: string;
  automationManaged?: boolean;
  automationRule?: string;
};

type StageOption = string;

type ActionType = "add_tag" | "remove_tag" | "create_task" | "set_stage" | "set_follow_up";

type WorkflowAction = {
  type: ActionType;
  config: Record<string, string | number>;
};

type Workflow = {
  _id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused";
  trigger: {
    type: string;
    config: Record<string, string>;
  };
  actions: WorkflowAction[];
  runCount?: number;
  successCount?: number;
  failureCount?: number;
};

type ReferenceData = {
  tags: TagOption[];
  stages: StageOption[];
};

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

function actionDefaults(type: ActionType): Record<string, string | number> {
  if (type === "add_tag" || type === "remove_tag") return { tag: "" };
  if (type === "create_task") return { body: "Follow up with {{contact.name}}", dueInDays: 1, hour: 10 };
  if (type === "set_stage") return { stage: "qualification" };
  return { daysFromNow: 1, hour: 10 };
}

function actionLabel(type: ActionType) {
  if (type === "add_tag") return "Add tag";
  if (type === "remove_tag") return "Remove tag";
  if (type === "create_task") return "Create task";
  if (type === "set_stage") return "Move stage";
  return "Set follow-up";
}

export default function TagAutomationPage() {
  const [tags, setTags] = useState<TagOption[]>([]);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [name, setName] = useState("Tag automation");
  const [triggerTag, setTriggerTag] = useState("");
  const [change, setChange] = useState<"added" | "removed">("added");
  const [requiredTag, setRequiredTag] = useState("");
  const [excludedTag, setExcludedTag] = useState("");
  const [actions, setActions] = useState<WorkflowAction[]>([
    { type: "create_task", config: actionDefaults("create_task") },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [refs, workflowData] = await Promise.all([
        api.get<ReferenceData>("/workflows/reference-data"),
        api.get<{ workflows: Workflow[] }>("/workflows"),
      ]);
      setTags((refs.tags || []).filter((tag) => tag.active));
      setStages(refs.stages || []);
      setWorkflows((workflowData.workflows || []).filter((workflow) => workflow.trigger?.type === "crm_tag_changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tag automation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeTags = useMemo(() => tags.filter((tag) => tag.active), [tags]);
  const managedTags = useMemo(() => activeTags.filter((tag) => tag.automationManaged), [activeTags]);

  const updateAction = (index: number, action: WorkflowAction) => {
    setActions((current) => current.map((item, i) => (i === index ? action : item)));
  };

  const removeAction = (index: number) => {
    setActions((current) => current.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!triggerTag) {
      setError("Choose the tag that starts this automation.");
      return;
    }
    if (!name.trim()) {
      setError("Give this automation a name.");
      return;
    }
    if (!actions.length) {
      setError("Add at least one action.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.post<{ workflow: Workflow }>("/workflows", {
        name: name.trim(),
        description: `Runs when ${triggerTag} is ${change}.`,
        trigger: {
          type: "crm_tag_changed",
          config: {
            tag: triggerTag,
            change,
            ...(requiredTag ? { requiredTag } : {}),
            ...(excludedTag ? { excludedTag } : {}),
          },
        },
        actions,
      });

      await api.patch(`/workflows/${response.workflow._id}/status`, { status: "active" });
      setNotice("Tag automation saved and activated.");
      setName("Tag automation");
      setTriggerTag("");
      setRequiredTag("");
      setExcludedTag("");
      setActions([{ type: "create_task", config: actionDefaults("create_task") }]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save tag automation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {notice && (
        <div className="fixed right-4 top-4 z-[100] rounded-lg border border-emerald-500/20 bg-[var(--theme-surface)] px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl">
          {notice}
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#ff76c5]">
            <Tags size={14} /> Automation
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tag automation</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--theme-text-muted)]">
            Use CRM tags as durable signals. A tag can start a workflow, qualify who enters it, and drive the next action.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0d9488]/10 text-[#ff76c5]">
            <Zap size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Automatic system tags</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--theme-text-muted)]">
              Khairo Diet Clinic manages these tags itself. They describe meaningful facts or operational states rather than duplicating the pipeline stage.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {managedTags.length ? managedTags.map((tag) => (
            <span key={tag.key} className="rounded-full border border-[#0d9488]/20 bg-[#0d9488]/[0.05] px-3 py-1.5 text-xs font-medium text-[#ff9bd5]">
              {tag.name}
            </span>
          )) : (
            <span className="text-xs text-[var(--theme-text-muted)]">Managed tags will appear as they are created by live CRM activity.</span>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Build a tag workflow</h2>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">When a tag changes, run these actions automatically.</p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Workflow name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none focus:border-[#0d9488]/50" />
            </label>

            <div className="rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff76c5]">When this happens</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px]">
                <label>
                  <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">Tag</span>
                  <select value={triggerTag} onChange={(e) => setTriggerTag(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                    <option value="">Choose tag</option>
                    {activeTags.map((tag) => <option key={tag.key} value={tag.key}>{tag.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">Change</span>
                  <select value={change} onChange={(e) => setChange(e.target.value as "added" | "removed")} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                    <option value="added">is added</option>
                    <option value="removed">is removed</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Only if</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">Contact also has <span className="text-[var(--theme-text-muted)]">optional</span></span>
                  <select value={requiredTag} onChange={(e) => setRequiredTag(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                    <option value="">No required tag</option>
                    {activeTags.map((tag) => <option key={tag.key} value={tag.key}>{tag.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">Contact does not have <span className="text-[var(--theme-text-muted)]">optional</span></span>
                  <select value={excludedTag} onChange={(e) => setExcludedTag(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                    <option value="">No excluded tag</option>
                    {activeTags.map((tag) => <option key={tag.key} value={tag.key}>{tag.name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Then do this</p>
                  <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Actions run top to bottom.</p>
                </div>
                <span className="text-xs text-[var(--theme-text-muted)]">{actions.length}/12</span>
              </div>

              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div key={`${action.type}-${index}`} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
                    <div className="flex items-center gap-2">
                      <select value={action.type} onChange={(e) => updateAction(index, { type: e.target.value as ActionType, config: actionDefaults(e.target.value as ActionType) })} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 text-sm font-medium text-white outline-none">
                        <option value="add_tag">Add tag</option>
                        <option value="remove_tag">Remove tag</option>
                        <option value="create_task">Create task</option>
                        <option value="set_stage">Move stage</option>
                        <option value="set_follow_up">Set follow-up</option>
                      </select>
                      <button type="button" onClick={() => removeAction(index)} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-rose-400/[0.08] hover:text-rose-300">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3">
                      {(action.type === "add_tag" || action.type === "remove_tag") && (
                        <select value={String(action.config.tag || "")} onChange={(e) => updateAction(index, { ...action, config: { tag: e.target.value } })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                          <option value="">Choose tag</option>
                          {activeTags.map((tag) => <option key={tag.key} value={tag.key}>{tag.name}</option>)}
                        </select>
                      )}

                      {action.type === "create_task" && (
                        <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                          <input value={String(action.config.body || "")} onChange={(e) => updateAction(index, { ...action, config: { ...action.config, body: e.target.value } })} placeholder="Task details" className="h-10 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none" />
                          <input type="number" min={0} max={365} value={Number(action.config.dueInDays ?? 1)} onChange={(e) => updateAction(index, { ...action, config: { ...action.config, dueInDays: Number(e.target.value) } })} className="h-10 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none" />
                        </div>
                      )}

                      {action.type === "set_stage" && (
                        <select value={String(action.config.stage || "qualification")} onChange={(e) => updateAction(index, { ...action, config: { stage: e.target.value } })} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none">
                          {stages.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage] || stage}</option>)}
                        </select>
                      )}

                      {action.type === "set_follow_up" && (
                        <label className="flex items-center gap-3 text-xs text-[var(--theme-text-secondary)]">
                          Follow up in
                          <input type="number" min={0} max={365} value={Number(action.config.daysFromNow ?? 1)} onChange={(e) => updateAction(index, { ...action, config: { ...action.config, daysFromNow: Number(e.target.value) } })} className="h-10 w-24 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none" />
                          days
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" disabled={actions.length >= 12} onClick={() => setActions((current) => [...current, { type: "add_tag", config: actionDefaults("add_tag") }])} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-30">
                <Plus size={14} /> Add action
              </button>
            </div>

            <div className="flex justify-end border-t border-[var(--theme-border)] pt-4">
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save & activate
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="border-b border-[var(--theme-border)] px-4 py-4">
            <h2 className="text-sm font-semibold text-white">Active tag workflows</h2>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Automations already listening for tag changes.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-[var(--theme-text-muted)]"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : workflows.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-[var(--theme-text-muted)]">No tag workflows yet.</div>
          ) : (
            <div className="divide-y divide-[var(--theme-border-soft)]">
              {workflows.map((workflow) => {
                const trigger = workflow.trigger?.config || {};
                const tagName = tags.find((tag) => tag.key === trigger.tag)?.name || trigger.tag || "Any tag";
                return (
                  <div key={workflow._id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--theme-text)]">{workflow.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--theme-text-muted)]">
                          <span className="rounded-md border border-[var(--theme-border)] px-2 py-1">{tagName}</span>
                          <ArrowRight size={12} />
                          <span>{trigger.change === "removed" ? "removed" : "added"}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${workflow.status === "active" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] text-[var(--theme-text-muted)]">{workflow.actions.map((action) => actionLabel(action.type)).join(" → ")}</p>
                    <p className="mt-2 text-[10px] text-[var(--theme-text-muted)]">Runs: {workflow.runCount || 0} · Success: {workflow.successCount || 0} · Failed: {workflow.failureCount || 0}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
