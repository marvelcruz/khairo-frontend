"use client";

import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  Tags,
  Upload,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";


export type CrmTagDefinition = {
  _id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
  aliases?: string[];
  active: boolean;
  usageCount?: number;
};

type ExportFilters = {
  stage?: string;
  assignedTo?: string;
  tags?: string;
  source?: string;
  search?: string;
};

type Props = {
  tags: CrmTagDefinition[];
  canAdmin: boolean;
  filters: ExportFilters;
  onTagsChanged:
    (tags: CrmTagDefinition[]) => void;
  onImported: () => void | Promise<void>;
};

type ToolView =
  | "tags"
  | "import"
  | "export"
  | null;

type ImportPreview = {
  success: boolean;
  filename: string;
  headers: string[];
  mapping: Record<string, string>;
  summary: {
    rows: number;
    new: number;
    updates: number;
    invalid: number;
    duplicates: number;
    unknownTags: number;
  };
  unknownTags: Array<{
    token: string;
    mappingKey: string;
  }>;
  previewRows: Array<{
    rowNumber: number;
    fullName?: string;
    email?: string;
    phone?: string;
    stage?: string;
    tags?: string[];
    result:
      | "new"
      | "update"
      | "invalid";
    existingContactId?: string | null;
    ownerMatched?: boolean;
    errors?: string[];
  }>;
  truncated?: boolean;
};

type ImportResult = {
  success: boolean;
  summary: {
    rows: number;
    created: number;
    updated: number;
    skipped: number;
    skippedByChoice?: number;
    warnings: number;
    errors: number;
  };
  warnings?: Array<{
    rowNumber: number;
    message: string;
  }>;
  errors?: Array<{
    rowNumber: number;
    message: string;
  }>;
};

const TAG_CATEGORIES = [
  "source",
  "interest",
  "behavior",
  "payment",
  "onboarding",
  "operational",
  "relationship",
  "campaign",
  "other",
] as const;

const IMPORT_FIELDS = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["source", "Source"],
  ["sourceDetail", "Source detail / campaign"],
  ["preferredContactMethod", "Preferred contact"],
  ["programInterest", "Program interest"],
  ["stage", "CRM stage"],
  ["leadPriority", "Lead priority"],
  ["estimatedValue", "Estimated value"],
  ["nextFollowUpAt", "Next follow-up"],
  ["owner", "Owner"],
  ["tags", "Tags"],
] as const;

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none";

function messageFromError(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

async function saveDownload(
  path: string,
  params?: Record<
    string,
    string | number | boolean | undefined
  >
) {
  const {
    blob,
    filename,
  } = await api.download(
    path,
    { params }
  );

  const url =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
}


export function CrmContactTags({
  contactId,
  tagKeys,
  tags,
  canManage,
  onChanged,
}: {
  contactId: string;
  tagKeys: string[];
  tags: CrmTagDefinition[];
  canManage: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [addKey, setAddKey] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const tagMap =
    useMemo(
      () =>
        new Map(
          tags.map((tag) => [
            tag.key,
            tag,
          ])
        ),
      [tags]
    );

  const available =
    tags.filter(
      (tag) =>
        tag.active &&
        !tagKeys.includes(tag.key)
    );

  const mutate = async (
    add: string[] = [],
    remove: string[] = []
  ) => {
    setBusy(true);

    try {
      await api.post(
        "/crm/tags/bulk",
        {
          contactIds: [contactId],
          add,
          remove,
        }
      );

      setAddKey("");
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-[var(--theme-border)] pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-[var(--theme-text-secondary)]">
          Tags
        </h3>

        <span className="text-[11px] text-[var(--theme-text-muted)]">
          {tagKeys.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tagKeys.length === 0 ? (
          <span className="text-xs text-[var(--theme-text-muted)]">
            No tags.
          </span>
        ) : (
          tagKeys.map((key) => {
            const tag =
              tagMap.get(key);

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--theme-text-secondary)]"
              >
                {tag?.name || key}

                {canManage && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void mutate(
                        [],
                        [key]
                      )
                    }
                    className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                    aria-label={`Remove ${tag?.name || key}`}
                  >
                    <X size={11} />
                  </button>
                )}
              </span>
            );
          })
        )}
      </div>

      {canManage &&
        available.length > 0 && (
          <div className="mt-3 flex gap-2">
            <select
              value={addKey}
              onChange={(event) =>
                setAddKey(
                  event.target.value
                )
              }
              className={`${inputClass} min-w-0 flex-1 text-xs`}
            >
              <option value="">
                Add tag…
              </option>

              {available.map(
                (tag) => (
                  <option
                    key={tag.key}
                    value={tag.key}
                  >
                    {tag.name}
                  </option>
                )
              )}
            </select>

            <Button
              type="button"
              size="sm"
              disabled={
                !addKey || busy
              }
              onClick={() =>
                void mutate([addKey])
              }
            >
              Add
            </Button>
          </div>
        )}
    </section>
  );
}



function downloadImportIssueReport(
  result: ImportResult
) {
  const issues = [
    ...(result.errors || []).map(
      (item) => ({
        rowNumber:
          item.rowNumber,
        type: "Error",
        message:
          item.message,
      })
    ),
    ...(result.warnings || []).map(
      (item) => ({
        rowNumber:
          item.rowNumber,
        type: "Warning",
        message:
          item.message,
      })
    ),
  ];

  if (!issues.length) {
    return;
  }

  const escapeCsv = (
    value: string | number
  ) => {
    const text =
      String(value ?? "");

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  };

  const csv = [
    [
      "Row",
      "Type",
      "Message",
    ],
    ...issues.map(
      (item) => [
        item.rowNumber,
        item.type,
        item.message,
      ]
    ),
  ]
    .map(
      (row) =>
        row
          .map(escapeCsv)
          .join(",")
    )
    .join("\n");

  const blob =
    new Blob(
      [
        "\uFEFF",
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      }
    );

  const url =
    window.URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement("a");

  anchor.href = url;

  anchor.download =
    `khairo-crm-import-issues-${
      new Date()
        .toISOString()
        .slice(0, 10)
    }.csv`;

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(
    url
  );
}

export default function CrmDataTools({
  tags,
  canAdmin,
  filters,
  onTagsChanged,
  onImported,
}: Props) {
  const [view, setView] =
    useState<ToolView>(null);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [tagForm, setTagForm] =
    useState({
      name: "",
      category: "other",
      description: "",
      aliases: "",
    });

  const [importFile, setImportFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<ImportPreview | null>(
      null
    );

  const [mapping, setMapping] =
    useState<Record<string, string>>(
      {}
    );

  const [
    existingAction,
    setExistingAction,
  ] = useState<"update" | "skip">(
    "update"
  );

  const [tagMode, setTagMode] =
    useState<"merge" | "replace">(
      "merge"
    );

  const [rowActions, setRowActions] =
    useState<
      Record<string, string>
    >({});

  const [
    tagMappings,
    setTagMappings,
  ] = useState<
    Record<string, string>
  >({});

  const [
    importResult,
    setImportResult,
  ] = useState<ImportResult | null>(
    null
  );

  const activeTags =
    tags.filter(
      (tag) => tag.active
    );

  const groupedTags =
    useMemo(() => {
      const result =
        new Map<
          string,
          CrmTagDefinition[]
        >();

      for (const tag of tags) {
        const rows =
          result.get(tag.category) ||
          [];

        rows.push(tag);
        result.set(
          tag.category,
          rows
        );
      }

      return result;
    }, [tags]);

  const refreshTags =
    async () => {
      const data =
        await api.get<{
          success: boolean;
          tags: CrmTagDefinition[];
        }>("/crm/tags", {
          params: {
            includeInactive: true,
          },
        });

      onTagsChanged(
        data.tags || []
      );
    };

  const resetTagForm = () => {
    setEditingId(null);

    setTagForm({
      name: "",
      category: "other",
      description: "",
      aliases: "",
    });
  };

  const editTag = (
    tag: CrmTagDefinition
  ) => {
    setEditingId(tag._id);

    setTagForm({
      name: tag.name,
      category: tag.category,
      description:
        tag.description || "",
      aliases:
        (tag.aliases || []).join(
          ", "
        ),
    });
  };

  const saveTag = async () => {
    if (
      !canAdmin ||
      !tagForm.name.trim()
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const body = {
        name:
          tagForm.name.trim(),
        category:
          tagForm.category,
        description:
          tagForm.description.trim(),
        aliases:
          tagForm.aliases
            .split(",")
            .map((value) =>
              value.trim()
            )
            .filter(Boolean),
      };

      if (editingId) {
        await api.patch(
          `/crm/tags/${editingId}`,
          body
        );
      } else {
        await api.post(
          "/crm/tags",
          body
        );
      }

      await refreshTags();
      resetTagForm();
    } catch (err) {
      setError(
        messageFromError(
          err,
          "Could not save tag."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleTag = async (
    tag: CrmTagDefinition
  ) => {
    if (!canAdmin) return;

    setBusy(true);
    setError("");

    try {
      await api.patch(
        `/crm/tags/${tag._id}`,
        {
          active: !tag.active,
        }
      );

      await refreshTags();
    } catch (err) {
      setError(
        messageFromError(
          err,
          "Could not update tag."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const chooseFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    setImportFile(file);
    setPreview(null);
    setImportResult(null);
    setMapping({});
    setRowActions({});
    setTagMappings({});
    setError("");
  };

  const previewImport =
    async (
      useMapping?: Record<
        string,
        string
      >
    ) => {
      if (!importFile) return;

      setBusy(true);
      setError("");
      setImportResult(null);

      try {
        const form =
          new FormData();

        form.append(
          "file",
          importFile
        );

        if (useMapping) {
          form.append(
            "mapping",
            JSON.stringify(
              useMapping
            )
          );
        }

        const data =
          await api.post<ImportPreview>(
            "/crm/contacts/import/preview",
            form
          );

        setPreview(data);
        setMapping(
          data.mapping || {}
        );

        // Keep rowActions for explicit per-row overrides only.
        // Rows without an override inherit the current global action.
        setRowActions({});
      } catch (err) {
        setError(
          messageFromError(
            err,
            "Could not preview import."
          )
        );
      } finally {
        setBusy(false);
      }
    };

  const commitImport =
    async () => {
      if (
        !importFile ||
        !preview
      ) {
        return;
      }

      const unresolved =
        preview.unknownTags.filter(
          (item) =>
            !tagMappings[
              item.mappingKey
            ]
        );

      if (unresolved.length) {
        setError(
          "Resolve every unknown tag before importing."
        );
        return;
      }

      setBusy(true);
      setError("");

      try {
        const form =
          new FormData();

        form.append(
          "file",
          importFile
        );

        form.append(
          "mapping",
          JSON.stringify(mapping)
        );

        form.append(
          "tagMappings",
          JSON.stringify(
            tagMappings
          )
        );

        form.append(
          "existingAction",
          existingAction
        );

        form.append(
          "rowActions",
          JSON.stringify(
            rowActions
          )
        );

        form.append(
          "tagMode",
          tagMode
        );

        const data =
          await api.post<ImportResult>(
            "/crm/contacts/import/commit",
            form
          );

        setImportResult(data);

        await Promise.all([
          refreshTags(),
          onImported(),
        ]);
      } catch (err) {
        setError(
          messageFromError(
            err,
            "Could not import contacts."
          )
        );
      } finally {
        setBusy(false);
      }
    };

  const exportContacts =
    async (
      format: "csv" | "xlsx"
    ) => {
      setBusy(true);
      setError("");

      try {
        await saveDownload(
          "/crm/contacts/export",
          {
            format,
            stage:
              filters.stage,
            assignedTo:
              filters.assignedTo,
            tags:
              filters.tags,
            source:
              filters.source,
            search:
              filters.search,
          }
        );
      } catch (err) {
        setError(
          messageFromError(
            err,
            "Could not export CRM contacts."
          )
        );
      } finally {
        setBusy(false);
      }
    };

  const downloadTemplate =
    async (
      format: "csv" | "xlsx"
    ) => {
      setBusy(true);
      setError("");

      try {
        await saveDownload(
          "/crm/contacts/import/template",
          { format }
        );
      } catch (err) {
        setError(
          messageFromError(
            err,
            "Could not download template."
          )
        );
      } finally {
        setBusy(false);
      }
    };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            setView("tags")
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)]"
        >
          <Tags size={14} />
          <span className="hidden xl:inline">
            Tags
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setView("import")
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)]"
        >
          <Upload size={14} />
          <span className="hidden xl:inline">
            Import
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setView("export")
          }
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)]"
        >
          <Download size={14} />
          <span className="hidden xl:inline">
            Export
          </span>
        </button>
      </div>

      {view && (
        <div
          className="fixed inset-0 z-[90] bg-black/55"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setView(null);
            }
          }}
        >
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-[680px] flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface-raised)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--theme-border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">
                  {view === "tags"
                    ? "CRM Tags"
                    : view === "import"
                      ? "Import Contacts"
                      : "Export Contacts"}
                </h2>

                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                  {view === "tags"
                    ? "Keep segmentation consistent across the team."
                    : view === "import"
                      ? "Preview and validate before anything is written."
                      : "Download CRM data as CSV or Excel."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setView(null)
                }
                className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            {error && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] p-3 text-xs text-red-200">
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0"
                />
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {view === "tags" && (
                <div className="space-y-6">
                  {canAdmin && (
                    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                          {editingId
                            ? "Edit tag"
                            : "Create tag"}
                        </h3>

                        {editingId && (
                          <button
                            type="button"
                            onClick={
                              resetTagForm
                            }
                            className="text-xs font-semibold text-[var(--theme-text-muted)]"
                          >
                            Cancel edit
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label>
                          <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                            Name
                          </span>
                          <input
                            value={
                              tagForm.name
                            }
                            onChange={(
                              event
                            ) =>
                              setTagForm(
                                (
                                  value
                                ) => ({
                                  ...value,
                                  name:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            maxLength={80}
                            className={
                              inputClass
                            }
                          />
                        </label>

                        <label>
                          <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                            Category
                          </span>
                          <select
                            value={
                              tagForm.category
                            }
                            onChange={(
                              event
                            ) =>
                              setTagForm(
                                (
                                  value
                                ) => ({
                                  ...value,
                                  category:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            className={
                              inputClass
                            }
                          >
                            {TAG_CATEGORIES.map(
                              (
                                category
                              ) => (
                                <option
                                  key={
                                    category
                                  }
                                  value={
                                    category
                                  }
                                >
                                  {category}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      </div>

                      <label className="mt-3 block">
                        <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                          Aliases
                        </span>

                        <input
                          value={
                            tagForm.aliases
                          }
                          onChange={(
                            event
                          ) =>
                            setTagForm(
                              (
                                value
                              ) => ({
                                ...value,
                                aliases:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="IG lead, Instagram"
                          className={
                            inputClass
                          }
                        />

                        <span className="mt-1 block text-[10px] text-[var(--theme-text-muted)]">
                          Separate aliases with commas.
                        </span>
                      </label>

                      <label className="mt-3 block">
                        <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                          Description
                        </span>

                        <textarea
                          rows={2}
                          maxLength={300}
                          value={
                            tagForm.description
                          }
                          onChange={(
                            event
                          ) =>
                            setTagForm(
                              (
                                value
                              ) => ({
                                ...value,
                                description:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full resize-none rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)] outline-none"
                        />
                      </label>

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            busy ||
                            !tagForm.name.trim()
                          }
                          onClick={() =>
                            void saveTag()
                          }
                        >
                          {editingId
                            ? "Save tag"
                            : "Create tag"}
                        </Button>
                      </div>
                    </section>
                  )}

                  <section>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                        Tag library
                      </h3>

                      <span className="text-xs text-[var(--theme-text-muted)]">
                        {tags.length} tags
                      </span>
                    </div>

                    <div className="mt-3 space-y-5">
                      {[
                        ...groupedTags.entries(),
                      ].map(
                        ([
                          category,
                          rows,
                        ]) => (
                          <div
                            key={
                              category
                            }
                          >
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--theme-text-muted)]">
                              {category}
                            </p>

                            <div className="divide-y divide-[var(--theme-border-soft)] overflow-hidden rounded-xl border border-[var(--theme-border)]">
                              {rows.map(
                                (tag) => (
                                  <div
                                    key={
                                      tag._id
                                    }
                                    className="flex items-center gap-3 bg-[var(--theme-surface)] px-3 py-3"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${tag.active ? "text-[var(--theme-text)]" : "text-[var(--theme-text-muted)] line-through"}`}>
                                          {
                                            tag.name
                                          }
                                        </span>

                                        {!tag.active && (
                                          <span className="rounded bg-[var(--theme-surface-soft)] px-1.5 py-0.5 text-[9px] uppercase text-[var(--theme-text-muted)]">
                                            Archived
                                          </span>
                                        )}
                                      </div>

                                      <p className="mt-1 text-[10px] text-[var(--theme-text-muted)]">
                                        {tag.usageCount || 0} contacts
                                        {tag.aliases?.length
                                          ? ` · ${tag.aliases.length} aliases`
                                          : ""}
                                      </p>
                                    </div>

                                    {canAdmin && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            editTag(
                                              tag
                                            )
                                          }
                                          className="text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
                                        >
                                          Edit
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            busy
                                          }
                                          onClick={() =>
                                            void toggleTag(
                                              tag
                                            )
                                          }
                                          className="text-xs font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                                        >
                                          {tag.active
                                            ? "Archive"
                                            : "Reactivate"}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                </div>
              )}

              {view === "export" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                      Current filters
                    </h3>

                    <div className="mt-3 space-y-1 text-xs text-[var(--theme-text-muted)]">
                      <p>
                        Stage:{" "}
                        {filters.stage ||
                          "All"}
                      </p>
                      <p>
                        Owner:{" "}
                        {filters.assignedTo ||
                          "All"}
                      </p>
                      <p>
                        Tag:{" "}
                        {filters.tags ||
                          "All"}
                      </p>
                    </div>

                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--theme-text-muted)]">
                      Export includes the matching CRM contacts, their current sales stage, owner, programme, priority, follow-up date and tags.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void exportContacts(
                          "xlsx"
                        )
                      }
                      className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-left transition hover:bg-[var(--theme-surface-hover)]"
                    >
                      <FileSpreadsheet
                        size={22}
                        className="text-[var(--theme-text-secondary)]"
                      />

                      <p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">
                        Excel workbook
                      </p>

                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        .xlsx
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void exportContacts(
                          "csv"
                        )
                      }
                      className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-left transition hover:bg-[var(--theme-surface-hover)]"
                    >
                      <Download
                        size={22}
                        className="text-[var(--theme-text-secondary)]"
                      />

                      <p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">
                        CSV file
                      </p>

                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        .csv
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {view === "import" && (
                <div className="space-y-6">
                  <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                          Import file
                        </h3>

                        <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                          CSV or XLSX. Maximum 2,000 contacts.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void downloadTemplate(
                              "xlsx"
                            )
                          }
                          className="text-xs font-semibold text-[var(--theme-text-secondary)]"
                        >
                          Excel template
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void downloadTemplate(
                              "csv"
                            )
                          }
                          className="text-xs font-semibold text-[var(--theme-text-secondary)]"
                        >
                          CSV template
                        </button>
                      </div>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-page-alt)] px-4 py-8 text-sm text-[var(--theme-text-secondary)]">
                      <Upload size={18} />

                      {importFile
                        ? importFile.name
                        : "Choose CSV or XLSX file"}

                      <input
                        type="file"
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={
                          chooseFile
                        }
                      />
                    </label>

                    {importFile &&
                      !preview && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void previewImport()
                            }
                          >
                            {busy
                              ? "Reading…"
                              : "Preview import"}
                          </Button>
                        </div>
                      )}
                  </section>

                  {preview && (
                    <>
                      <section>
                        <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                          Preview
                        </h3>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {[
                            [
                              "Rows",
                              preview.summary.rows,
                            ],
                            [
                              "New",
                              preview.summary.new,
                            ],
                            [
                              "Updates",
                              preview.summary.updates,
                            ],
                            [
                              "Invalid",
                              preview.summary.invalid,
                            ],
                            [
                              "Unknown tags",
                              preview.summary.unknownTags,
                            ],
                          ].map(
                            ([
                              label,
                              value,
                            ]) => (
                              <div
                                key={
                                  label
                                }
                                className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3"
                              >
                                <p className="text-[10px] text-[var(--theme-text-muted)]">
                                  {label}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-[var(--theme-text)]">
                                  {value}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </section>

                      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                              Column mapping
                            </h3>

                            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                              Confirm which spreadsheet column belongs to each CRM field.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void previewImport(
                                mapping
                              )
                            }
                            className="text-xs font-semibold text-[var(--theme-text-secondary)]"
                          >
                            Re-preview
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {IMPORT_FIELDS.map(
                            ([
                              key,
                              label,
                            ]) => (
                              <label
                                key={
                                  key
                                }
                              >
                                <span className="mb-1.5 block text-[11px] font-medium text-[var(--theme-text-secondary)]">
                                  {label}
                                </span>

                                <select
                                  value={
                                    mapping[
                                      key
                                    ] ||
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setMapping(
                                      (
                                        value
                                      ) => ({
                                        ...value,
                                        [key]:
                                          event
                                            .target
                                            .value,
                                      })
                                    )
                                  }
                                  className={`${inputClass} text-xs`}
                                >
                                  <option value="">
                                    Not mapped
                                  </option>

                                  {preview.headers.map(
                                    (
                                      header
                                    ) => (
                                      <option
                                        key={
                                          header
                                        }
                                        value={
                                          header
                                        }
                                      >
                                        {
                                          header
                                        }
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>
                            )
                          )}
                        </div>
                      </section>

                      {preview.unknownTags.length >
                        0 && (
                        <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                          <h3 className="text-sm font-semibold text-amber-200">
                            Resolve unknown tags
                          </h3>

                          <p className="mt-1 text-xs text-amber-100/70">
                            Every unknown tag must be mapped, created or ignored.
                          </p>

                          <div className="mt-4 space-y-3">
                            {preview.unknownTags.map(
                              (
                                item
                              ) => (
                                <div
                                  key={
                                    item.mappingKey
                                  }
                                  className="grid gap-2 sm:grid-cols-[1fr_1.5fr] sm:items-center"
                                >
                                  <span className="text-xs font-semibold text-[var(--theme-text-secondary)]">
                                    {
                                      item.token
                                    }
                                  </span>

                                  <select
                                    value={
                                      tagMappings[
                                        item
                                          .mappingKey
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setTagMappings(
                                        (
                                          value
                                        ) => ({
                                          ...value,
                                          [item.mappingKey]:
                                            event
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    className={`${inputClass} text-xs`}
                                  >
                                    <option value="">
                                      Choose…
                                    </option>

                                    {canAdmin && (
                                      <option value="__create__">
                                        Create approved tag
                                      </option>
                                    )}

                                    <option value="__ignore__">
                                      Ignore this tag
                                    </option>

                                    {activeTags.map(
                                      (
                                        tag
                                      ) => (
                                        <option
                                          key={
                                            tag.key
                                          }
                                          value={
                                            tag.key
                                          }
                                        >
                                          Map to:{" "}
                                          {
                                            tag.name
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>
                              )
                            )}
                          </div>
                        </section>
                      )}

                      <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                        <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                          Import rules
                        </h3>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label>
                            <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">
                              Existing contacts
                            </span>

                            <select
                              value={
                                existingAction
                              }
                              onChange={(
                                event
                              ) =>
                                setExistingAction(
                                  event
                                    .target
                                    .value as
                                    | "update"
                                    | "skip"
                                )
                              }
                              className={
                                inputClass
                              }
                            >
                              <option value="update">
                                Update
                              </option>
                              <option value="skip">
                                Skip
                              </option>
                            </select>
                          </label>

                          <label>
                            <span className="mb-1.5 block text-xs text-[var(--theme-text-secondary)]">
                              Imported tags
                            </span>

                            <select
                              value={
                                tagMode
                              }
                              onChange={(
                                event
                              ) =>
                                setTagMode(
                                  event
                                    .target
                                    .value as
                                    | "merge"
                                    | "replace"
                                )
                              }
                              className={
                                inputClass
                              }
                            >
                              <option value="merge">
                                Add to existing tags
                              </option>
                              <option value="replace">
                                Replace existing tags
                              </option>
                            </select>
                          </label>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-[var(--theme-text)]">
                            Rows
                          </h3>

                          {preview.truncated && (
                            <span className="text-[10px] text-[var(--theme-text-muted)]">
                              Showing first 100
                            </span>
                          )}
                        </div>

                        <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-[var(--theme-border)]">
                          <table className="w-full min-w-[640px] text-left text-xs">
                            <thead className="sticky top-0 bg-[var(--theme-surface)] text-[10px] uppercase text-[var(--theme-text-muted)]">
                              <tr>
                                <th className="px-3 py-2">
                                  Row
                                </th>
                                <th className="px-3 py-2">
                                  Contact
                                </th>
                                <th className="px-3 py-2">
                                  Result
                                </th>
                                <th className="px-3 py-2">
                                  Action
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--theme-border-soft)]">
                              {preview.previewRows.map(
                                (
                                  row
                                ) => (
                                  <tr
                                    key={
                                      row.rowNumber
                                    }
                                  >
                                    <td className="px-3 py-3 text-[var(--theme-text-muted)]">
                                      {
                                        row.rowNumber
                                      }
                                    </td>

                                    <td className="px-3 py-3">
                                      <p className="font-semibold text-[var(--theme-text-secondary)]">
                                        {row.fullName ||
                                          "Unnamed"}
                                      </p>

                                      <p className="mt-0.5 text-[10px] text-[var(--theme-text-muted)]">
                                        {row.email ||
                                          row.phone ||
                                          "—"}
                                      </p>

                                      {row.errors?.length ? (
                                        <p className="mt-1 text-[10px] text-red-300">
                                          {row.errors.join(
                                            " "
                                          )}
                                        </p>
                                      ) : !row.ownerMatched ? (
                                        <p className="mt-1 text-[10px] text-amber-300">
                                          Owner not matched
                                        </p>
                                      ) : null}
                                    </td>

                                    <td className="px-3 py-3">
                                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                        row.result ===
                                        "new"
                                          ? "bg-emerald-600/10 text-emerald-300"
                                          : row.result ===
                                              "update"
                                            ? "bg-blue-500/10 text-blue-300"
                                            : "bg-red-500/10 text-red-300"
                                      }`}>
                                        {
                                          row.result
                                        }
                                      </span>
                                    </td>

                                    <td className="px-3 py-3">
                                      {row.result ===
                                      "update" ? (
                                        <select
                                          value={
                                            rowActions[
                                              String(
                                                row.rowNumber
                                              )
                                            ] ||
                                            existingAction
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            setRowActions(
                                              (
                                                value
                                              ) => ({
                                                ...value,
                                                [String(
                                                  row.rowNumber
                                                )]:
                                                  event
                                                    .target
                                                    .value,
                                              })
                                            )
                                          }
                                          className="h-8 rounded-md border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 text-[11px] text-[var(--theme-text-secondary)]"
                                        >
                                          <option value="update">
                                            Update
                                          </option>
                                          <option value="skip">
                                            Skip
                                          </option>
                                        </select>
                                      ) : row.result ===
                                        "new" ? (
                                        <select
                                          value={
                                            rowActions[
                                              String(
                                                row.rowNumber
                                              )
                                            ] ||
                                            "create"
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            setRowActions(
                                              (
                                                value
                                              ) => ({
                                                ...value,
                                                [String(
                                                  row.rowNumber
                                                )]:
                                                  event
                                                    .target
                                                    .value,
                                              })
                                            )
                                          }
                                          className="h-8 rounded-md border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 text-[11px] text-[var(--theme-text-secondary)]"
                                        >
                                          <option value="create">
                                            Create
                                          </option>
                                          <option value="skip">
                                            Skip
                                          </option>
                                        </select>
                                      ) : (
                                        <span className="text-[11px] text-red-300">
                                          Skip
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {!importResult && (
                        <div className="flex justify-end border-t border-[var(--theme-border)] pt-4">
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void commitImport()
                            }
                          >
                            {busy
                              ? "Importing…"
                              : "Import contacts"}
                          </Button>
                        </div>
                      )}

                      {importResult && (
                        <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                          <div className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
                            <Check
                              size={16}
                            />

                            <h3 className="text-sm font-semibold">
                              Import processed
                            </h3>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-lg font-semibold text-[var(--theme-text)]">
                                {
                                  importResult
                                    .summary
                                    .created
                                }
                              </p>
                              <p className="text-[10px] text-[var(--theme-text-muted)]">
                                Created
                              </p>
                            </div>

                            <div>
                              <p className="text-lg font-semibold text-[var(--theme-text)]">
                                {
                                  importResult
                                    .summary
                                    .updated
                                }
                              </p>
                              <p className="text-[10px] text-[var(--theme-text-muted)]">
                                Updated
                              </p>
                            </div>

                            <div>
                              <p className="text-lg font-semibold text-[var(--theme-text)]">
                                {
                                  importResult
                                    .summary
                                    .skipped
                                }
                              </p>
                              <p className="text-[10px] text-[var(--theme-text-muted)]">
                                Skipped
                              </p>
                            </div>
                          </div>

                          {(importResult.summary
                            .warnings >
                            0 ||
                            importResult.summary
                              .errors >
                              0) && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-3">
                              <p className="text-[10px] text-[var(--theme-text-muted)]">
                                {
                                  importResult
                                    .summary
                                    .warnings
                                }{" "}
                                warning
                                {importResult
                                  .summary
                                  .warnings ===
                                1
                                  ? ""
                                  : "s"}
                                {" · "}
                                {
                                  importResult
                                    .summary
                                    .errors
                                }{" "}
                                error
                                {importResult
                                  .summary
                                  .errors ===
                                1
                                  ? ""
                                  : "s"}
                              </p>

                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  downloadImportIssueReport(
                                    importResult
                                  )
                                }
                              >
                                Download issue report
                              </Button>
                            </div>
                          )}

                          {importResult.warnings &&
                            importResult.warnings
                              .length >
                              0 && (
                            <div className="mt-3 max-h-40 overflow-auto border-t border-[var(--theme-border)] pt-3">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                                Warnings
                              </p>

                              {importResult.warnings.map(
                                (
                                  item,
                                  index
                                ) => (
                                  <p
                                    key={`warning-${item.rowNumber}-${index}`}
                                    className="py-1 text-[10px] text-amber-300"
                                  >
                                    Row{" "}
                                    {
                                      item.rowNumber
                                    }
                                    :{" "}
                                    {
                                      item.message
                                    }
                                  </p>
                                )
                              )}
                            </div>
                          )}

                          {importResult.errors &&
                            importResult.errors.length >
                              0 && (
                            <div className="mt-3 max-h-40 overflow-auto border-t border-[var(--theme-border)] pt-3">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                                Errors
                              </p>

                              {importResult.errors.map(
                                (
                                  item,
                                  index
                                ) => (
                                  <p
                                    key={`error-${item.rowNumber}-${index}`}
                                    className="py-1 text-[10px] text-red-300"
                                  >
                                    Row{" "}
                                    {
                                      item.rowNumber
                                    }
                                    :{" "}
                                    {
                                      item.message
                                    }
                                  </p>
                                )
                              )}
                            </div>
                          )}
                        </section>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
