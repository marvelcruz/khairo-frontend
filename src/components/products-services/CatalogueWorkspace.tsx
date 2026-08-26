"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  billingLabel,
  CATALOGUE_TYPES,
  type BillingInterval,
  type BillingType,
  type CatalogueItem,
  type CatalogueItemResponse,
  type CatalogueType,
} from "@/lib/products-services/catalogue";

type Props = {
  items: CatalogueItem[];
  title: string;
  emptyLabel: string;
  allowedTypes?: CatalogueType[];
  loading?: boolean;
  error?: string;
  onRefresh: () => Promise<void> | void;
};

type EditorState = {
  id?: string;
  name: string;
  type: CatalogueType;
  sku: string;
  description: string;
  price: string;
  currency: string;
  billingType: BillingType;
  interval: BillingInterval;
  intervalCount: string;
  durationWeeks: string;
  isPublic: boolean;
};

const EMPTY_EDITOR: EditorState = {
  name: "",
  type: "product",
  sku: "",
  description: "",
  price: "",
  currency: "NGN",
  billingType: "one_time",
  interval: "month",
  intervalCount: "1",
  durationWeeks: "",
  isPublic: false,
};

function formatMoney(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function typeLabel(type: CatalogueType) {
  return type
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function editorFromItem(item: CatalogueItem): EditorState {
  return {
    id: item._id,
    name: item.name,
    type: item.type,
    sku: item.sku || "",
    description: item.description || item.shortDescription || "",
    price: String(item.price ?? ""),
    currency: item.currency || "NGN",
    billingType: item.billing?.type || "one_time",
    interval: item.billing?.interval || "month",
    intervalCount: String(item.billing?.intervalCount || 1),
    durationWeeks:
      item.durationWeeks === null || item.durationWeeks === undefined
        ? ""
        : String(item.durationWeeks),
    isPublic: Boolean(item.isPublic),
  };
}

export function CatalogueWorkspace({
  items,
  title,
  emptyLabel,
  allowedTypes,
  loading = false,
  error = "",
  onRefresh,
}: Props) {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const availableTypes = useMemo(
    () =>
      CATALOGUE_TYPES.filter(
        (entry) => !allowedTypes || allowedTypes.includes(entry.value)
      ),
    [allowedTypes]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (allowedTypes && !allowedTypes.includes(item.type)) return false;
      if (status === "active" && !item.isActive) return false;
      if (status === "archived" && item.isActive) return false;

      const term = query.trim().toLowerCase();
      if (!term) return true;

      return [
        item.name,
        item.type,
        item.sku || "",
        item.description || item.shortDescription || "",
        billingLabel(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [items, allowedTypes, query, status]);

  const openCreate = () => {
    const firstType = availableTypes[0]?.value || "product";
    setEditor({ ...EMPTY_EDITOR, type: firstType });
    setLocalError("");
    setMessage("");
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;

    const price = Number(editor.price);
    if (!editor.name.trim() || !Number.isFinite(price) || price < 0) {
      setLocalError("Enter a name and a valid non-negative price.");
      return;
    }

    setSaving(true);
    setLocalError("");
    setMessage("");

    const payload = {
      name: editor.name.trim(),
      type: editor.type,
      sku: editor.sku.trim(),
      description: editor.description.trim(),
      shortDescription: editor.description.trim().slice(0, 300),
      price,
      currency: editor.currency.trim().toUpperCase() || "NGN",
      billing: {
        type: editor.billingType,
        interval: editor.billingType === "recurring" ? editor.interval : null,
        intervalCount:
          editor.billingType === "recurring"
            ? Math.max(1, Number(editor.intervalCount) || 1)
            : 1,
      },
      durationWeeks:
        (editor.type === "program" || editor.type === "service") &&
        editor.durationWeeks
          ? Math.max(0, Number(editor.durationWeeks) || 0)
          : null,
      isPublic: editor.isPublic,
    };

    try {
      if (editor.id) {
        await api.patch<CatalogueItemResponse>(`/catalogue/${editor.id}`, payload);
        setMessage("Catalogue item updated.");
      } else {
        await api.post<CatalogueItemResponse>("/catalogue", payload);
        setMessage("Catalogue item created.");
      }

      setEditor(null);
      await onRefresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not save catalogue item.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (item: CatalogueItem) => {
    if (!window.confirm(`Archive “${item.name}”?`)) return;
    setActionId(item._id);
    setLocalError("");
    setMessage("");

    try {
      await api.del(`/catalogue/${item._id}`);
      setMessage("Catalogue item archived.");
      await onRefresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not archive catalogue item.");
    } finally {
      setActionId(null);
    }
  };

  const restore = async (item: CatalogueItem) => {
    setActionId(item._id);
    setLocalError("");
    setMessage("");

    try {
      await api.patch(`/catalogue/${item._id}/restore`, {});
      setMessage("Catalogue item restored. It remains private until you publish it.");
      await onRefresh();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not restore catalogue item.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
            Live catalogue data from the KhairoDietClinic backend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] px-4 py-2 text-sm font-medium text-[var(--theme-text-secondary)] hover:bg-neutral-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-400"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          )}
        </div>
      </div>

      {(error || localError) && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {localError || error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      {editor && canManage && (
        <form
          onSubmit={saveItem}
          className="rounded-xl border border-teal-500/30 bg-pink-500/5 p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">
                {editor.id ? "Edit catalogue item" : "Add catalogue item"}
              </h3>
              <p className="mt-1 text-sm text-[var(--theme-text-muted)]">
                Saves directly to the existing Catalogue API.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
              aria-label="Close editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Name</span>
              <input
                required
                value={editor.name}
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-teal-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Type</span>
              <select
                value={editor.type}
                disabled={Boolean(editor.id)}
                onChange={(e) =>
                  setEditor({ ...editor, type: e.target.value as CatalogueType })
                }
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none disabled:opacity-50"
              >
                {availableTypes.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Price</span>
              <input
                required
                min="0"
                type="number"
                value={editor.price}
                onChange={(e) => setEditor({ ...editor, price: e.target.value })}
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-teal-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Currency</span>
              <input
                maxLength={3}
                value={editor.currency}
                onChange={(e) => setEditor({ ...editor, currency: e.target.value.toUpperCase() })}
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-teal-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">SKU</span>
              <input
                value={editor.sku}
                onChange={(e) => setEditor({ ...editor, sku: e.target.value })}
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-teal-500"
              />
            </label>

            {(editor.type === "program" || editor.type === "service") && (
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-[var(--theme-text-secondary)]">
                  Program/service length (weeks)
                </span>
                <input
                  min="0"
                  type="number"
                  value={editor.durationWeeks}
                  onChange={(e) =>
                    setEditor({ ...editor, durationWeeks: e.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-teal-500"
                />
              </label>
            )}

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Billing</span>
              <select
                value={editor.billingType}
                onChange={(e) =>
                  setEditor({ ...editor, billingType: e.target.value as BillingType })
                }
                className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white outline-none"
              >
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </label>

            {editor.billingType === "recurring" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Interval</span>
                  <select
                    value={editor.interval}
                    onChange={(e) =>
                      setEditor({ ...editor, interval: e.target.value as BillingInterval })
                    }
                    className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Every</span>
                  <input
                    min="1"
                    type="number"
                    value={editor.intervalCount}
                    onChange={(e) =>
                      setEditor({ ...editor, intervalCount: e.target.value })
                    }
                    className="min-h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-white"
                  />
                </label>
              </div>
            )}

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Description</span>
              <textarea
                rows={4}
                value={editor.description}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                className="w-full resize-y rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 py-3 text-sm text-white outline-none focus:border-teal-500"
              />
            </label>

            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-page)] px-3 text-sm text-[var(--theme-text-secondary)] md:col-span-2">
              <input
                type="checkbox"
                checked={editor.isPublic}
                onChange={(e) => setEditor({ ...editor, isPublic: e.target.checked })}
                className="h-4 w-4 accent-pink-500"
              />
              Visible in the public catalogue
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-pink-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : editor.id ? "Save changes" : "Create item"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 sm:flex-row sm:items-center">
        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
          <Search className="h-4 w-4 text-[var(--theme-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search catalogue"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(["all", "active", "archived"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-semibold capitalize ${
                status === value
                  ? "bg-pink-500 text-white"
                  : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          Loading catalogue…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          {emptyLabel}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((item) => (
              <article
                key={item._id}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-white">{item.name}</h3>
                    <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                      {typeLabel(item.type)}{item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] ${item.isActive ? "border-emerald-500/20 text-emerald-300" : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"}`}>
                    {item.isActive ? "Active" : "Archived"}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-5 text-[var(--theme-text-secondary)]">
                  {item.description || item.shortDescription || "No description"}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--theme-border)] pt-3 text-sm">
                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">Price</div>
                    <div className="mt-1 text-[var(--theme-text)]">{formatMoney(item.price, item.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">Billing</div>
                    <div className="mt-1 text-[var(--theme-text)]">{billingLabel(item)}</div>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.isActive ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditor(editorFromItem(item))}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-secondary)]"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={actionId === item._id}
                          onClick={() => void archive(item)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/20 px-3 text-xs text-red-300"
                        >
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={actionId === item._id}
                        onClick={() => void restore(item)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-500/20 px-3 text-xs text-emerald-300"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--theme-border)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--theme-surface)] text-xs uppercase tracking-wide text-[var(--theme-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      {item.sku && <div className="mt-1 text-xs text-[var(--theme-text-muted)]">{item.sku}</div>}
                    </td>
                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">{typeLabel(item.type)}</td>
                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">{formatMoney(item.price, item.currency)}</td>
                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">{billingLabel(item)}</td>
                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">{item.isPublic ? "Public" : "Private"}</td>
                    <td className="px-4 py-4 text-[var(--theme-text-secondary)]">{item.isActive ? "Active" : "Archived"}</td>
                    {canManage && (
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {item.isActive ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditor(editorFromItem(item))}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-white"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={actionId === item._id}
                                onClick={() => void archive(item)}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-red-500/20 text-red-300"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={actionId === item._id}
                              onClick={() => void restore(item)}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-500/20 text-emerald-300"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
