"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, FileText, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import FormRenderer, { FormDefinition } from "./FormRenderer";

type EntityType = "crm_contact" | "application" | "client";
type FormSummary = Pick<FormDefinition, "_id" | "name" | "description" | "targetEntityType">;
type Submission = { _id: string; formName: string; createdAt: string; submitterName?: string };

export default function RecordForms({ entityType, entityId, compact = false }: { entityType: EntityType; entityId: string; compact?: boolean }) {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [active, setActive] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true); setError("");
    try {
      const [available, history] = await Promise.all([
        api.get<{ forms: FormSummary[] }>(`/forms/available/${entityType}`),
        api.get<{ submissions: Submission[] }>("/forms/submissions", { params: { entityType, entityId } }),
      ]);
      setForms(available.forms || []); setSubmissions(history.submissions || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load forms."); }
    finally { setLoading(false); }
  }, [entityId, entityType]);
  useEffect(()=>{void load()},[load]);

  const open = async (id: string) => {
    setError("");
    try { const response = await api.get<{ form: FormDefinition }>(`/forms/run/${id}`); setActive(response.form); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not open form."); }
  };

  if (loading) return <div className="flex items-center gap-2 py-3 text-xs text-[var(--theme-text-muted)]"><Loader2 size={13} className="animate-spin"/>Loading forms…</div>;
  if (error && forms.length === 0 && submissions.length === 0) return null;
  if (forms.length === 0 && submissions.length === 0) return null;

  return <section data-testid={`record-forms-${entityType}`} className={compact ? "space-y-3" : "rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:p-5"}>
    <div className="flex items-center justify-between gap-3"><div><h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Forms</h3>{!compact && <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Complete approved KhairoDietClinic forms and keep the response attached to this record.</p>}</div></div>
    {forms.length > 0 && <div className="grid gap-2 pt-1 sm:grid-cols-2">{forms.map((form)=><button key={form._id} onClick={()=>void open(form._id)} className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-3 text-left transition hover:border-[#0d9488]/25 hover:bg-[#0d9488]/[0.025]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-surface-soft)] text-[#ff75c6]"><FileText size={14}/></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-[var(--theme-text-secondary)]">{form.name}</span><span className="mt-0.5 block text-[11px] text-[var(--theme-text-muted)]">Complete form</span></span></button>)}</div>}
    {submissions.length > 0 && <div className="border-t border-[var(--theme-border)] pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Recent responses</p><div className="mt-2 space-y-2">{submissions.slice(0,3).map((submission)=><div key={submission._id} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-[var(--theme-text-secondary)]"><CheckCircle2 size={12} className="shrink-0 text-emerald-300/70"/><span className="truncate">{submission.formName}</span></span><span className="shrink-0 text-[10px] text-[var(--theme-text-muted)]">{new Date(submission.createdAt).toLocaleDateString()}</span></div>)}</div></div>}
    {active && <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm"><div className="absolute inset-y-0 right-0 flex w-full max-w-[620px] flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl"><header className="flex items-start justify-between border-b border-[var(--theme-border)] px-5 py-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#ff73c6]"><ClipboardList size={13}/>Internal form</div><h2 className="mt-1 text-lg font-semibold text-white">{active.name}</h2>{active.description && <p className="mt-1 text-xs leading-5 text-[var(--theme-text-muted)]">{active.description}</p>}</div><button onClick={()=>setActive(null)} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white"><X size={16}/></button></header><div className="flex-1 overflow-y-auto p-5"><FormRenderer form={active} mode="internal" entityType={entityType} entityId={entityId} onSubmitted={()=>{void load(); window.setTimeout(()=>setActive(null),1200)}}/></div></div></div>}
  </section>;
}
