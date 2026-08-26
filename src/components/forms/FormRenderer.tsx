"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export type FormOption = { value: string; label: string };

export type FormFieldDefinition = {
  _id?: string;
  key?: string;
  label: string;
  type:
    | "text"
    | "long_text"
    | "number"
    | "date"
    | "boolean"
    | "select"
    | "multi_select"
    | "email"
    | "phone";
  placeholder?: string;
  description?: string;
  options?: FormOption[];
};

export type FormElement = {
  _id: string;
  kind: "field" | "heading" | "paragraph";
  source?: "standard" | "custom";
  standardKey?: string;
  customField?: string;
  label?: string;
  text?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  fieldDefinition?: FormFieldDefinition | null;
};

export type FormDefinition = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: "draft" | "published";
  visibility: "internal" | "public";
  targetEntityType: "none" | "crm_contact" | "application" | "client";
  publicAction: "submission_only" | "create_crm_lead";
  submitLabel: string;
  confirmationTitle: string;
  confirmationMessage: string;
  elements: FormElement[];
};

const THEME_INPUT_CLASS =
  "min-h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3.5 text-sm text-white outline-none transition placeholder:text-[var(--theme-text-muted)] focus:border-[#0d9488]/55 focus:ring-2 focus:ring-[#0d9488]/10";

const PUBLIC_INPUT_CLASS =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[16px] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm";

function FieldControl({
  element,
  value,
  onChange,
  publicMode,
}: {
  element: FormElement;
  value: unknown;
  onChange: (value: unknown) => void;
  publicMode: boolean;
}) {
  const field = element.fieldDefinition;

  if (!field) {
    return (
      <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
        This field is no longer available.
      </p>
    );
  }

  const label = element.label || field.label;
  const placeholder = element.placeholder || field.placeholder || "";
  const help = element.helpText || field.description || "";
  const type = field.type;
  const inputClass = publicMode ? PUBLIC_INPUT_CLASS : THEME_INPUT_CLASS;

  const autoComplete =
    element.standardKey === "firstName"
      ? "given-name"
      : element.standardKey === "lastName"
        ? "family-name"
        : element.standardKey === "email"
          ? "email"
          : element.standardKey === "phone"
            ? "tel"
            : undefined;

  return (
    <label className="block space-y-2">
      <span
        style={publicMode ? { color: "#ffffff" } : undefined}
        className={
          publicMode
            ? "flex items-start gap-1 text-sm font-semibold leading-5 text-white"
            : "flex items-start gap-1 text-sm font-medium text-[var(--theme-text)]"
        }
      >
        {label}
        {element.required && (
          <span className="text-[#ff4db2]" aria-hidden="true">
            *
          </span>
        )}
      </span>

      {type === "long_text" ? (
        <textarea
          rows={5}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={element.required}
          aria-required={element.required}
          className={`${inputClass} resize-y py-3`}
        />
      ) : type === "boolean" ? (
        <select
          value={
            value === true ? "true" : value === false ? "false" : ""
          }
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? null
                : e.target.value === "true"
            )
          }
          required={element.required}
          aria-required={element.required}
          className={inputClass}
        >
          <option value="">Choose an option</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : type === "select" ? (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={element.required}
          aria-required={element.required}
          className={inputClass}
        >
          <option value="">Choose an option</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "multi_select" ? (
        <div
          className={
            publicMode
              ? "flex flex-wrap gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-3"
              : "flex flex-wrap gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-3"
          }
        >
          {(field.options || []).map((option) => {
            const selected =
              Array.isArray(value) &&
              value.map(String).includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const existing = Array.isArray(value)
                    ? value.map(String)
                    : [];

                  onChange(
                    selected
                      ? existing.filter(
                          (item) => item !== option.value
                        )
                      : [...existing, option.value]
                  );
                }}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  selected
                    ? "border-[#0d9488] bg-[#0d9488]/20 text-white"
                    : publicMode
                      ? "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/30 hover:text-white"
                      : "border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type={
            type === "number"
              ? "number"
              : type === "date"
                ? "date"
                : type === "email"
                  ? "email"
                  : type === "phone"
                    ? "tel"
                    : "text"
          }
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={element.required}
          aria-required={element.required}
          className={inputClass}
        />
      )}

      {help && (
        <span
          className={
            publicMode
              ? "block text-xs leading-5 text-white/60"
              : "block text-xs leading-5 text-[var(--theme-text-muted)]"
          }
        >
          {help}
        </span>
      )}
    </label>
  );
}

function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === "";
}

export default function FormRenderer({
  form,
  mode = "public",
  entityType,
  entityId,
  onSubmitted,
}: {
  form: FormDefinition;
  mode?: "public" | "internal" | "preview";
  entityType?: "crm_contact" | "application" | "client";
  entityId?: string;
  onSubmitted?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const publicMode = mode === "public";

  const fields = useMemo(
    () =>
      (form.elements || []).filter(
        (element) => element.kind === "field"
      ),
    [form.elements]
  );

  const submit = async () => {
    if (mode === "preview") return;

    const missing = fields.filter(
      (field) =>
        field.required && isEmpty(answers[field._id])
    );

    if (missing.length) {
      const names = missing
        .map(
          (field) =>
            field.label ||
            field.fieldDefinition?.label ||
            "required field"
        )
        .slice(0, 4);

      setError(
        `Please complete: ${names.join(", ")}${
          missing.length > 4 ? " and the remaining required fields" : ""
        }.`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "public") {
        await api.post(`/forms/public/${form.slug}/submit`, {
          answers,
        });
      } else {
        await api.post(`/forms/${form._id}/submit`, {
          answers,
          entityType,
          entityId,
        });
      }

      setComplete(true);
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not submit form."
      );
    } finally {
      setSaving(false);
    }
  };

  if (complete) {
    return (
      <div
        data-testid="form-confirmation"
        className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-7 text-center sm:p-9"
      >
        <CheckCircle2
          className="mx-auto text-emerald-300"
          size={34}
        />
        <h2 className="mt-4 text-2xl font-semibold text-white">
          {form.confirmationTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/70">
          {form.confirmationMessage}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="form-renderer" data-public-form={publicMode ? "true" : undefined} className="space-y-7">
      {(form.elements || []).map((element) => {
        if (element.kind === "heading") {
          return (
            <div
              key={element._id}
              className={
                publicMode
                  ? "border-b border-white/10 pb-3 pt-2"
                  : "border-b border-[var(--theme-border)] pb-2"
              }
            >
              <h3
                style={publicMode ? { color: "#ffffff" } : undefined}
                className="text-lg font-semibold text-white sm:text-xl"
              >
                {element.text}
              </h3>
            </div>
          );
        }

        if (element.kind === "paragraph") {
          return (
            <p
              key={element._id}
              className={
                publicMode
                  ? "text-sm leading-7 text-white/70"
                  : "text-sm leading-6 text-[var(--theme-text-secondary)]"
              }
            >
              {element.text}
            </p>
          );
        }

        return (
          <FieldControl
            key={element._id}
            element={element}
            value={answers[element._id]}
            onChange={(value) =>
              setAnswers((current) => ({
                ...current,
                [element._id]: value,
              }))
            }
            publicMode={publicMode}
          />
        );
      })}

      {fields.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/55">
          No fields have been added yet.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm leading-5 text-rose-100"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled={
          mode === "preview" || saving || fields.length === 0
        }
        onClick={() => void submit()}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0d9488] px-7 text-sm font-semibold text-white shadow-[0_0_28px_rgba(236,0,140,0.28)] transition hover:bg-[#ff159b] focus:outline-none focus:ring-4 focus:ring-[#0d9488]/25 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {mode === "preview"
          ? form.submitLabel
          : saving
            ? "Submitting…"
            : form.submitLabel}
      </button>
    </div>
  );
}
