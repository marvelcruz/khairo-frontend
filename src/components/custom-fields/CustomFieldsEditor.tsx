"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Edit3, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export type CustomFieldEntityType = "crm_contact" | "application" | "client";

type Option = { value: string; label: string };

type FieldDefinition = {
  _id: string;
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: "text" | "long_text" | "number" | "date" | "boolean" | "select" | "multi_select" | "email" | "phone";
  entityTypes: CustomFieldEntityType[];
  required?: boolean;
  active?: boolean;
  sortOrder?: number;
  options?: Option[];
};

type Response = {
  success: boolean;
  fields: FieldDefinition[];
  values: Record<string, unknown>;
};

function displayValue(field: FieldDefinition, value: unknown) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return "—";
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "multi_select" && Array.isArray(value)) {
    const labels = new Map((field.options || []).map((option) => [option.value, option.label]));
    return value.map((item) => labels.get(String(item)) || String(item)).join(", ");
  }
  if (field.type === "select") {
    return (field.options || []).find((option) => option.value === String(value))?.label || String(value);
  }
  if (field.type === "date") {
    const date = new Date(`${String(value)}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  return String(value);
}

function inputClass() {
  return "min-h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none transition placeholder:text-[var(--theme-text-muted)] focus:border-[#0d9488]/45 focus:ring-2 focus:ring-[#0d9488]/10";
}

export default function CustomFieldsEditor({
  entityType,
  entityId,
  canEdit = true,
  title = "Additional information",
  compact = false,
}: {
  entityType: CustomFieldEntityType;
  entityId: string;
  canEdit?: boolean;
  title?: string;
  compact?: boolean;
}) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get<Response>(`/custom-fields/records/${entityType}/${entityId}`);
      setFields(response.fields || []);
      setValues(response.values || {});
      setDraft(response.values || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load additional information.");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { void load(); }, [load]);

  const visibleFields = useMemo(() => fields.filter((field) => field.active !== false), [fields]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const payloadValues = Object.fromEntries(visibleFields.map((field) => [field._id, draft[field._id] ?? null]));
      const response = await api.put<{ success: boolean; values: Record<string, unknown> }>(
        `/custom-fields/records/${entityType}/${entityId}`,
        { values: payloadValues }
      );
      setValues(response.values || draft);
      setDraft(response.values || draft);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save additional information.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-3 text-xs text-[var(--theme-text-muted)]"><Loader2 size={13} className="animate-spin" />Loading additional information…</div>;
  }

  if (error && fields.length === 0) {
    return <p className="py-2 text-xs text-rose-300/80">{error}</p>;
  }

  if (visibleFields.length === 0) return null;

  return (
    <section data-testid={`custom-fields-${entityType}`} className={compact ? "space-y-3" : "rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:p-5"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">{title}</h3>
          {!compact && <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Khairo Diet Clinic-specific information configured by Admin.</p>}
        </div>
        {canEdit && !editing && (
          <button type="button" onClick={() => { setDraft(values); setEditing(true); setError(""); }} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-white">
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 pt-1">
          {visibleFields.map((field) => {
            const value = draft[field._id];
            return (
              <label key={field._id} className="block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[var(--theme-text-secondary)]">
                  {field.label}{field.required && <span className="text-[#ff67be]">*</span>}
                </span>
                {field.type === "long_text" ? (
                  <textarea rows={3} required={field.required} value={String(value ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field._id]: event.target.value }))} placeholder={field.placeholder} className={`${inputClass()} resize-y py-2.5`} />
                ) : field.type === "boolean" ? (
                  <select required={field.required} value={value === true ? "true" : value === false ? "false" : ""} onChange={(event) => setDraft((current) => ({ ...current, [field._id]: event.target.value === "" ? null : event.target.value === "true" }))} className={inputClass()}>
                    <option value="">Select…</option><option value="true">Yes</option><option value="false">No</option>
                  </select>
                ) : field.type === "select" ? (
                  <select required={field.required} value={String(value ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field._id]: event.target.value }))} className={inputClass()}>
                    <option value="">Select…</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : field.type === "multi_select" ? (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-2.5">
                    {(field.options || []).map((option) => {
                      const selected = Array.isArray(value) && value.map(String).includes(option.value);
                      return <button key={option.value} type="button" onClick={() => setDraft((current) => { const existing = Array.isArray(current[field._id]) ? current[field._id] as unknown[] : []; const strings = existing.map(String); return { ...current, [field._id]: selected ? strings.filter((item) => item !== option.value) : [...strings, option.value] }; })} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${selected ? "border-[#0d9488]/35 bg-[#0d9488]/12 text-[#ff89cf]" : "border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-border)] hover:text-[var(--theme-text)]"}`}>{option.label}</button>;
                    })}
                  </div>
                ) : (
                  <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"} required={field.required} value={String(value ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field._id]: event.target.value }))} placeholder={field.placeholder} className={inputClass()} />
                )}
                {field.description && <span className="mt-1 block text-[11px] leading-4 text-[var(--theme-text-muted)]">{field.description}</span>}
              </label>
            );
          })}
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-[var(--theme-border)] pt-3">
            <button type="button" disabled={saving} onClick={() => { setDraft(values); setEditing(false); setError(""); }} className="h-9 px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white">Cancel</button>
            <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0d9488] px-3.5 text-xs font-semibold text-white transition hover:bg-[#ff199c] disabled:opacity-50">{saving && <Loader2 size={13} className="animate-spin" />}{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <div className={`grid gap-x-6 gap-y-3 pt-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
          {visibleFields.map((field) => (
            <div key={field._id} className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--theme-text-muted)]">{field.label}</p>
              <p className="mt-1 break-words text-sm leading-5 text-[var(--theme-text)]">{displayValue(field, values[field._id])}</p>
            </div>
          ))}
        </div>
      )}
      {saved && <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300"><Check size={12} />Saved</div>}
    </section>
  );
}
