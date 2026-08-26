"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignLeft, ArrowDown, ArrowUp, Check, ClipboardList, Copy, FileText,
  Globe2, Heading2, Loader2, Lock, Plus, Save, Send, Settings2, Trash2, X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import FormRenderer, { FormDefinition, FormElement, FormFieldDefinition } from "@/components/forms/FormRenderer";

type CustomField = FormFieldDefinition & { _id: string; key: string; active: boolean; entityTypes: string[] };
type FormSummary = Omit<FormDefinition, "elements"> & { elements?: FormElement[]; submissionCount?: number; updatedAt?: string };
type SubmissionSchemaElement = {
  id: string;
  kind: "field" | "heading" | "paragraph";
  label?: string;
  text?: string;
  type?: FormFieldDefinition["type"];
  source?: "standard" | "custom";
  standardKey?: string;
  customField?: string;
};

type Submission = {
  _id: string;
  form: string;
  formName: string;
  submitterName?: string;
  entityType?: string;
  entityId?: string;
  source: string;
  createdAt: string;
  answers?: Record<string, unknown>;
  schemaSnapshot?: SubmissionSchemaElement[];
};
type BuilderTab = "build" | "settings" | "preview";

const STANDARD_FIELDS: Array<{
  key: string;
  label: string;
  type: FormFieldDefinition["type"];
  options?: FormFieldDefinition["options"];
}> = [
  {
    key: "firstName",
    label: "First name",
    type: "text",
  },
  {
    key: "lastName",
    label: "Last name",
    type: "text",
  },
  {
    key: "startTimeline",
    label: "When would you ideally like to get started?",
    type: "select",
    options: [
      { value: "asap", label: "As soon as possible" },
      { value: "within_2_weeks", label: "Within 2 weeks" },
      { value: "within_a_month", label: "Within a month" },
      { value: "exploring", label: "I am still exploring" },
    ],
  },
  {
    key: "readyToSpeak",
    label: "Are you ready to speak with a KhairoDietClinic team member about the next step?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "questions", label: "I have a few questions first" },
      { value: "not_yet", label: "Not yet" },
    ],
  },

  { key: "fullName", label: "Full name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "phone" },
  {
    key: "programInterest",
    label: "Program interest",
    type: "select",
    options: [
      { value: "core", label: "Core" },
      { value: "plus", label: "Plus" },
      { value: "vip", label: "VIP" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
  { key: "goals", label: "Goals", type: "long_text" },
  { key: "healthNotes", label: "Health notes", type: "long_text" },
];
const TARGET_LABELS: Record<string, string> = { none: "Submission only", crm_contact: "CRM contacts", application: "Requests", client: "Clients" };
const blankForm = (): FormDefinition => ({
  _id: "new", name: "Untitled form", slug: "untitled-form", description: "", status: "draft", visibility: "internal",
  targetEntityType: "none", publicAction: "submission_only", submitLabel: "Submit", confirmationTitle: "Thank you",
  confirmationMessage: "Your response has been received.", elements: [],
});
const tempId = () => `tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`;

function Builder({ initial, customFields, onClose, onSaved }: { initial: FormDefinition | null; customFields: CustomField[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<FormDefinition>(() => initial || blankForm());
  const [tab, setTab] = useState<BuilderTab>("build");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const addStandard = (field: (typeof STANDARD_FIELDS)[number]) => {
    const definition: FormFieldDefinition = field.options
      ? { label: field.label, type: field.type, options: field.options }
      : field.key === "programInterest"
        ? { label: field.label, type: field.type, options: [{ value: "core", label: "Core" }, { value: "plus", label: "Plus" }, { value: "vip", label: "VIP" }, { value: "not_sure", label: "Not sure yet" }] }
        : { label: field.label, type: field.type };
    const element: FormElement = { _id: tempId(), kind: "field", source: "standard", standardKey: field.key, label: field.label, required: ["firstName", "lastName", "email", "phone"].includes(field.key), fieldDefinition: definition };
    setForm((current) => ({ ...current, elements: [...current.elements, element] }));
  };
  const addCustom = (field: CustomField) => {
    const element: FormElement = { _id: tempId(), kind: "field", source: "custom", customField: field._id, label: field.label, required: false, fieldDefinition: field };
    setForm((current) => ({ ...current, elements: [...current.elements, element] }));
  };
  const addText = (kind: "heading" | "paragraph") => setForm((current) => ({ ...current, elements: [...current.elements, { _id: tempId(), kind, text: kind === "heading" ? "Section heading" : "Add instructions for the person completing this form." }] }));
  const updateElement = (id: string, patch: Partial<FormElement>) => setForm((current) => ({ ...current, elements: current.elements.map((item) => item._id === id ? { ...item, ...patch } : item) }));
  const removeElement = (id: string) => setForm((current) => ({ ...current, elements: current.elements.filter((item) => item._id !== id) }));
  const move = (index: number, direction: -1 | 1) => setForm((current) => { const next = index + direction; if (next < 0 || next >= current.elements.length) return current; const elements = [...current.elements]; [elements[index], elements[next]] = [elements[next], elements[index]]; return { ...current, elements }; });

  const payload = () => ({
    name: form.name, slug: form.slug, description: form.description, visibility: form.visibility, targetEntityType: form.targetEntityType,
    publicAction: form.publicAction, submitLabel: form.submitLabel, confirmationTitle: form.confirmationTitle,
    confirmationMessage: form.confirmationMessage,
    elements: form.elements.map((element) => element.kind === "field" ? {
      ...(element._id && !element._id.startsWith("tmp_") ? { _id: element._id } : {}),
      kind: "field", source: element.source, standardKey: element.source === "standard" ? element.standardKey : undefined,
      customField: element.source === "custom" ? (typeof element.customField === "string" ? element.customField : String(element.customField || "")) : undefined,
      label: element.label || "", helpText: element.helpText || "", placeholder: element.placeholder || "", required: Boolean(element.required),
    } : { ...(element._id && !element._id.startsWith("tmp_") ? { _id: element._id } : {}), kind: element.kind, text: element.text || "" }),
  });

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = form._id === "new"
        ? await api.post<{ form: FormDefinition }>("/forms", payload())
        : await api.patch<{ form: FormDefinition }>(`/forms/${form._id}`, payload());
      setForm(response.form); setSaved(true); window.setTimeout(() => setSaved(false), 1800); await onSaved();
    } catch (err) { setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save form."); }
    finally { setSaving(false); }
  };
  const setStatus = async (status: "draft" | "published") => {
    if (form._id === "new") { setError("Save the form before publishing it."); return; }
    setSaving(true); setError("");
    try { const response = await api.patch<{ form: FormDefinition }>(`/forms/${form._id}/status`, { status }); setForm(response.form); await onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not change form status."); }
    finally { setSaving(false); }
  };

  const previewForm = useMemo(() => ({ ...form, elements: form.elements.map((element) => {
    if (element.kind !== "field") return element;
    if (element.fieldDefinition) return element;
    if (element.source === "custom") return { ...element, fieldDefinition: customFields.find((field) => field._id === String(element.customField)) || null };
    const standard = STANDARD_FIELDS.find((field) => field.key === element.standardKey);
    return { ...element, fieldDefinition: standard ? { label: standard.label, type: standard.type } : null };
  }) }), [form, customFields]);

  return <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-[1px]"><div data-testid="form-builder" className="absolute inset-0 ml-0 flex flex-col bg-[var(--theme-surface)] lg:left-auto lg:w-[min(1120px,calc(100vw-220px))] lg:border-l lg:border-white/[0.08]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] px-4 py-3 sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><FileText size={16} className="text-[#ff71c5]"/><h2 className="truncate text-base font-semibold text-white">{form.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${form.status === "published" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300" : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"}`}>{form.status}</span></div><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Build the form, configure delivery, then preview before publishing.</p></div><div className="flex items-center gap-2">{saved && <span className="hidden items-center gap-1 text-xs text-emerald-300 sm:flex"><Check size={13}/>Saved</span>}<button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white"><X size={17}/></button></div></header>
    <div className="flex border-b border-[var(--theme-border)] px-4 sm:px-6">{(["build","settings","preview"] as BuilderTab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-4 py-3 text-xs font-semibold capitalize transition ${tab === item ? "border-[#0d9488] text-white" : "border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"}`}>{item}</button>)}</div>
    <main className="min-h-0 flex-1 overflow-y-auto">
      {tab === "build" && <div className="grid min-h-full lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-[var(--theme-border)] p-4 lg:border-b-0 lg:border-r"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">Add fields</p><div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">{STANDARD_FIELDS.map((field) => <button key={field.key} onClick={() => addStandard(field)} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 py-2.5 text-left text-xs font-medium text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:text-white"><Plus size={12} className="mr-1.5 inline"/>{field.label}</button>)}</div><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">Custom Fields</p><div className="mt-3 space-y-2">{customFields.filter((field) => field.active).map((field) => <button key={field._id} onClick={() => addCustom(field)} className="w-full rounded-lg border border-[var(--theme-border)] px-3 py-2.5 text-left text-xs text-[var(--theme-text-secondary)] hover:border-[#0d9488]/25 hover:text-white"><Plus size={12} className="mr-1.5 inline"/>{field.label}</button>)}{customFields.length === 0 && <p className="text-xs leading-5 text-[var(--theme-text-muted)]">Create reusable Custom Fields first, then add them here.</p>}</div><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">Content</p><div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1"><button onClick={() => addText("heading")} className="rounded-lg border border-[var(--theme-border)] px-3 py-2.5 text-left text-xs text-[var(--theme-text-secondary)]"><Heading2 size={12} className="mr-1.5 inline"/>Heading</button><button onClick={() => addText("paragraph")} className="rounded-lg border border-[var(--theme-border)] px-3 py-2.5 text-left text-xs text-[var(--theme-text-secondary)]"><AlignLeft size={12} className="mr-1.5 inline"/>Instructions</button></div></aside>
        <section className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6"><div><label className="text-xs font-medium text-[var(--theme-text-secondary)]">Form name</label><input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3.5 text-lg font-semibold text-white outline-none focus:border-[#0d9488]/45"/></div><div className="space-y-2">{form.elements.map((element, index) => <div key={element._id} className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 transition hover:border-[var(--theme-border)]"><div className="flex items-start gap-3"><div className="flex shrink-0 flex-col"><button disabled={index===0} onClick={()=>move(index,-1)} className="grid h-6 w-6 place-items-center text-[var(--theme-text-muted)] hover:text-white disabled:opacity-15"><ArrowUp size={13}/></button><button disabled={index===form.elements.length-1} onClick={()=>move(index,1)} className="grid h-6 w-6 place-items-center text-[var(--theme-text-muted)] hover:text-white disabled:opacity-15"><ArrowDown size={13}/></button></div><div className="min-w-0 flex-1">{element.kind === "heading" ? <input value={element.text || ""} onChange={(e)=>updateElement(element._id,{text:e.target.value})} className="h-9 w-full bg-transparent text-base font-semibold text-white outline-none"/> : element.kind === "paragraph" ? <textarea rows={2} value={element.text || ""} onChange={(e)=>updateElement(element._id,{text:e.target.value})} className="w-full resize-none bg-transparent text-sm leading-6 text-[var(--theme-text-secondary)] outline-none"/> : <><input value={element.label || element.fieldDefinition?.label || ""} onChange={(e)=>updateElement(element._id,{label:e.target.value})} className="h-8 w-full bg-transparent text-sm font-semibold text-white outline-none"/><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={element.helpText || ""} onChange={(e)=>updateElement(element._id,{helpText:e.target.value})} placeholder="Help text (optional)" className="h-8 rounded-md border border-[var(--theme-border)] bg-[var(--theme-input)] px-2.5 text-xs text-[var(--theme-text-secondary)] outline-none"/><label className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]"><input type="checkbox" checked={Boolean(element.required)} onChange={(e)=>updateElement(element._id,{required:e.target.checked})}/>Required</label></div><p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{element.source === "custom" ? "Custom Field" : "Standard field"}</p></>}</div><button onClick={()=>removeElement(element._id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--theme-text-muted)] hover:bg-rose-400/[0.06] hover:text-rose-300"><Trash2 size={14}/></button></div></div>)}{form.elements.length===0 && <div className="rounded-2xl border border-dashed border-[var(--theme-border)] py-16 text-center"><ClipboardList size={26} className="mx-auto text-[var(--theme-text-muted)]"/><p className="mt-3 text-sm font-medium text-[var(--theme-text-muted)]">Start with the fields people need to complete.</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Use standard data, reusable Custom Fields, headings and instructions.</p></div>}</div></section>
      </div>}
      {tab === "settings" && <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8"><div><h3 className="text-base font-semibold text-white">Form settings</h3><p className="mt-1 text-sm text-[var(--theme-text-muted)]">Control where the form is used and what happens after submission.</p></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Visibility</span><select value={form.visibility} onChange={(e)=>setForm((c)=>({...c,visibility:e.target.value as FormDefinition["visibility"]}))} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"><option value="internal">Internal staff form</option><option value="public">Public link</option></select></label><label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Attach responses to</span><select value={form.targetEntityType} onChange={(e)=>setForm((c)=>({...c,targetEntityType:e.target.value as FormDefinition["targetEntityType"],publicAction:e.target.value==="crm_contact"?c.publicAction:"submission_only"}))} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white">{Object.entries(TARGET_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>{form.visibility === "public" && form.targetEntityType === "crm_contact" && <label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Public submission action</span><select value={form.publicAction} onChange={(e)=>setForm((c)=>({...c,publicAction:e.target.value as FormDefinition["publicAction"]}))} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"><option value="submission_only">Save response only</option><option value="create_crm_lead">Create or update CRM lead</option></select></label>}<label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Description</span><textarea rows={3} value={form.description || ""} onChange={(e)=>setForm((c)=>({...c,description:e.target.value}))} className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none"/></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Public link</span><div className="flex"><span className="flex h-11 items-center rounded-l-xl border border-r-0 border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-3 text-xs text-[var(--theme-text-muted)]">/forms/</span><input value={form.slug} onChange={(e)=>setForm((c)=>({...c,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-")}))} className="h-11 min-w-0 flex-1 rounded-r-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></div></label><label><span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Submit button</span><input value={form.submitLabel} onChange={(e)=>setForm((c)=>({...c,submitLabel:e.target.value}))} className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/></label></div><div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">Confirmation</p><div className="mt-3 space-y-3"><input value={form.confirmationTitle} onChange={(e)=>setForm((c)=>({...c,confirmationTitle:e.target.value}))} className="h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"/><textarea rows={3} value={form.confirmationMessage} onChange={(e)=>setForm((c)=>({...c,confirmationMessage:e.target.value}))} className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-white outline-none"/></div></div></div>}
      {tab === "preview" && <div className="mx-auto max-w-2xl p-5 sm:p-8"><div className="mb-6 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-4 py-3"><p className="text-xs font-semibold text-[var(--theme-text-secondary)]">Preview</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">This is how the form content will read. The preview does not submit data.</p></div><h1 className="text-2xl font-semibold text-white">{form.name}</h1>{form.description && <p className="mt-2 text-sm leading-6 text-[var(--theme-text-secondary)]">{form.description}</p>}<div className="mt-7"><FormRenderer form={previewForm} mode="preview"/></div></div>}
    </main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 sm:px-6"><div className="min-h-5">{error && <p className="text-xs text-rose-300">{error}</p>}</div><div className="flex items-center gap-2">{form._id !== "new" && <button disabled={saving} onClick={()=>void setStatus(form.status === "published" ? "draft" : "published")} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${form.status === "published" ? "border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white" : "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300"}`}>{form.status === "published" ? <Lock size={13}/> : <Send size={13}/>} {form.status === "published" ? "Unpublish" : "Publish"}</button>}<Button size="sm" disabled={saving} onClick={()=>void save()}>{saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>}Save</Button></div></footer>
  </div></div>;
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"forms"|"submissions">("forms");
  const [editor, setEditor] = useState<FormDefinition | "new" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [formsResponse, fieldsResponse, submissionsResponse] = await Promise.all([
        api.get<{ forms: FormSummary[] }>("/forms"),
        api.get<{ fields: CustomField[] }>("/custom-fields/definitions", { params: { includeInactive: true } }),
        api.get<{ submissions: Submission[] }>("/forms/submissions"),
      ]);
      setForms(formsResponse.forms || []); setCustomFields(fieldsResponse.fields || []); setSubmissions(submissionsResponse.submissions || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load forms."); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{void load()},[load]);

  const openForm = async (id: string) => {
    setError("");
    try { const response = await api.get<{ form: FormDefinition }>(`/forms/${id}`); setEditor(response.form); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not open form."); }
  };
  const copyLink = async (slug: string) => { await navigator.clipboard.writeText(`${window.location.origin}/forms/${slug}`); };
  const published = forms.filter((form)=>form.status === "published").length;
  const publicCount = forms.filter((form)=>form.visibility === "public").length;
  const totalResponses = forms.reduce((sum,form)=>sum+Number(form.submissionCount||0),0);

  return <div data-testid="forms-admin" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#ff76c5]"><ClipboardList size={14}/>Data collection</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Form Builder</h1><p className="mt-1 max-w-2xl text-sm text-[var(--theme-text-muted)]">Create reusable KhairoDietClinic forms from standard data and your Custom Fields, then publish them internally or as secure public links.</p></div><Button data-testid="new-form-button" onClick={()=>setEditor("new")}><Plus size={15}/>New form</Button></header>
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] sm:grid-cols-4">{[["Forms",forms.length],["Published",published],["Public",publicCount],["Responses",totalResponses]].map(([label,value])=><div key={String(label)} className="border-b border-r border-[var(--theme-border)] p-4 last:border-r-0 sm:border-b-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}</div>
    <div className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]"><div className="flex items-center gap-4 border-b border-[var(--theme-border)] px-4"><button onClick={()=>setTab("forms")} className={`border-b-2 py-3 text-xs font-semibold ${tab==="forms"?"border-[#0d9488] text-white":"border-transparent text-[var(--theme-text-muted)]"}`}>Forms</button><button onClick={()=>setTab("submissions")} className={`border-b-2 py-3 text-xs font-semibold ${tab==="submissions"?"border-[#0d9488] text-white":"border-transparent text-[var(--theme-text-muted)]"}`}>Submissions</button></div>
      {error && <p className="border-b border-[var(--theme-border)] px-4 py-3 text-xs text-rose-300">{error}</p>}
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--theme-text-muted)]"><Loader2 size={15} className="animate-spin"/>Loading forms…</div> : tab === "forms" ? <div className="divide-y divide-[var(--theme-border-soft)]">{forms.map((form)=><div key={form._id} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-[var(--theme-surface-hover)] sm:flex-row sm:items-center"><button onClick={()=>void openForm(form._id)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-[var(--theme-text)]">{form.name}</span><span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${form.status==="published"?"border-emerald-400/20 text-emerald-300":"border-[var(--theme-border)] text-[var(--theme-text-muted)]"}`}>{form.status}</span>{form.visibility === "public" ? <Globe2 size={12} className="text-sky-300/70"/> : <Lock size={12} className="text-[var(--theme-text-muted)]"/>}</div><p className="mt-1 text-xs text-[var(--theme-text-muted)]">{TARGET_LABELS[form.targetEntityType]} · {form.submissionCount || 0} response{Number(form.submissionCount||0)===1?"":"s"}</p></button><div className="flex items-center gap-2">{form.visibility === "public" && <button onClick={()=>void copyLink(form.slug)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white"><Copy size={13}/>Copy link</button>}<button onClick={()=>void openForm(form._id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:border-[var(--theme-border)] hover:text-white"><Settings2 size={13}/>Edit</button></div></div>)}{forms.length===0&&<div className="py-16 text-center"><FileText size={25} className="mx-auto text-[var(--theme-text-muted)]"/><p className="mt-3 text-sm text-[var(--theme-text-muted)]">No forms yet.</p><p className="mt-1 text-xs text-[var(--theme-text-muted)]">Create the first reusable KhairoDietClinic form.</p></div>}</div> : <div className="overflow-x-auto"><table className="min-w-full text-left"><thead><tr className="border-b border-[var(--theme-border)] text-[10px] uppercase tracking-[0.08em] text-[var(--theme-text-muted)]"><th className="px-4 py-3 font-semibold">Form</th><th className="px-4 py-3 font-semibold">Submitted by</th><th className="px-4 py-3 font-semibold">Linked record</th><th className="px-4 py-3 font-semibold">Date</th></tr></thead><tbody className="divide-y divide-[var(--theme-border-soft)]">{submissions.map((submission)=><tr
  key={submission._id}
  onClick={() => setSelectedSubmission(submission)}
  className="cursor-pointer text-sm transition hover:bg-[var(--theme-surface-hover)]"
><td className="px-4 py-3 text-[var(--theme-text-secondary)]">{submission.formName}</td><td className="px-4 py-3 text-[var(--theme-text-secondary)]">{submission.submitterName || (submission.source === "public_form" ? "Public response" : "Staff")}</td><td className="px-4 py-3 text-[var(--theme-text-muted)]">{submission.entityType ? TARGET_LABELS[submission.entityType] || submission.entityType : "—"}</td><td className="px-4 py-3 text-[var(--theme-text-muted)]">{new Date(submission.createdAt).toLocaleString()}</td></tr>)}{submissions.length===0&&<tr><td colSpan={4} className="px-4 py-14 text-center text-sm text-[var(--theme-text-muted)]">No form responses yet.</td></tr>}</tbody></table></div>}
    </div>
    {selectedSubmission && (
      <div
        className="fixed inset-0 z-[100] bg-black/55"
        onClick={() => setSelectedSubmission(null)}
      >
        <aside
          className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--theme-border)] bg-[var(--theme-surface)] px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#ff76c5]">
                Form submission
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {selectedSubmission.formName}
              </h2>
              <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                {new Date(selectedSubmission.createdAt).toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-white"
              aria-label="Close submission"
            >
              <X size={17} />
            </button>
          </header>

          <div className="space-y-6 p-5">
            <div className="grid gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                  Submitted by
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedSubmission.submitterName ||
                    (selectedSubmission.source === "public_form"
                      ? "Public response"
                      : "Staff")}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">
                  Linked record
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedSubmission.entityType
                    ? TARGET_LABELS[selectedSubmission.entityType] ||
                      selectedSubmission.entityType
                    : "None"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Responses</h3>

              <div className="mt-3 space-y-3">
                {(selectedSubmission.schemaSnapshot || [])
                  .filter((element) => element.kind === "field")
                  .map((element) => {
                    const rawValue = selectedSubmission.answers?.[element.id];
                    const options =
                      STANDARD_FIELDS.find(
                        (field) => field.key === element.standardKey
                      )?.options || [];

                    let displayValue = "—";

                    if (Array.isArray(rawValue)) {
                      displayValue =
                        rawValue
                          .map((item) => {
                            const option = options.find(
                              (candidate) => candidate.value === String(item)
                            );
                            return option?.label || String(item);
                          })
                          .join(", ") || "—";
                    } else if (typeof rawValue === "boolean") {
                      displayValue = rawValue ? "Yes" : "No";
                    } else if (
                      rawValue !== undefined &&
                      rawValue !== null &&
                      String(rawValue).trim()
                    ) {
                      const option = options.find(
                        (candidate) => candidate.value === String(rawValue)
                      );
                      displayValue = option?.label || String(rawValue);
                    }

                    return (
                      <div
                        key={element.id}
                        className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"
                      >
                        <p className="text-xs font-medium leading-5 text-[var(--theme-text-muted)]">
                          {element.label ||
                            STANDARD_FIELDS.find(
                              (field) => field.key === element.standardKey
                            )?.label ||
                            "Response"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white">
                          {displayValue}
                        </p>
                      </div>
                    );
                  })}

                {(!selectedSubmission.schemaSnapshot ||
                  selectedSubmission.schemaSnapshot.filter(
                    (element) => element.kind === "field"
                  ).length === 0) && (
                  <p className="rounded-xl border border-[var(--theme-border)] p-4 text-sm text-[var(--theme-text-muted)]">
                    No saved form schema is available for this response.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    )}

    {editor && <Builder initial={editor === "new" ? null : editor} customFields={customFields} onClose={()=>setEditor(null)} onSaved={load}/>}
  </div>;
}
