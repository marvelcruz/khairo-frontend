"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSignature,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { api } from "@/lib/api";

type SharedItem = {
  _id: string;
  kind: "document" | "form";
  title: string;
  url?: string;
  status:
    | "available"
    | "action_required"
    | "completed";
  createdAt: string;
  client: {
    _id: string;
    fullName: string;
    email?: string;
    status?: string;
    isArchived?: boolean;
  };
};

type SharedResponse = {
  success: boolean;
  count: number;
  counts: {
    total: number;
    documents: number;
    forms: number;
    actionRequired: number;
    completed: number;
  };
  items: SharedItem[];
};

type FormSummary = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: "draft" | "published";
  visibility: "internal" | "public";
  targetEntityType:
    | "none"
    | "crm_contact"
    | "application"
    | "client";
  submissionCount?: number;
  updatedAt: string;
};

type FormsResponse = {
  success: boolean;
  forms: FormSummary[];
};

type Tab =
  | "shared"
  | "forms"
  | "contracts";

const STATUS_LABELS: Record<
  SharedItem["status"],
  string
> = {
  available: "Available",
  action_required: "Action required",
  completed: "Completed",
};

const TARGET_LABELS: Record<
  FormSummary["targetEntityType"],
  string
> = {
  none: "Standalone",
  crm_contact: "CRM contacts",
  application: "Applications",
  client: "Clients",
};

function statusClass(
  status: SharedItem["status"]
) {
  if (status === "completed") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "action_required") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-[var(--theme-border)] bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]";
}

export default function DocumentsContractsPage() {
  const [shared, setShared] =
    useState<SharedItem[]>([]);

  const [forms, setForms] =
    useState<FormSummary[]>([]);

  const [tab, setTab] =
    useState<Tab>("shared");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        sharedResult,
        formsResult,
      ] = await Promise.allSettled([
        api.get<SharedResponse>(
          "/client-experience-admin/documents",
          {
            timeoutMs: 15000,
          }
        ),
        api.get<FormsResponse>(
          "/forms",
          {
            timeoutMs: 15000,
          }
        ),
      ]);

      const failures: string[] = [];

      if (
        sharedResult.status ===
        "fulfilled"
      ) {
        setShared(
          sharedResult.value.items || []
        );
      } else {
        failures.push(
          "shared client items"
        );
      }

      if (
        formsResult.status ===
        "fulfilled"
      ) {
        setForms(
          formsResult.value.forms || []
        );
      } else {
        failures.push(
          "reusable forms"
        );
      }

      if (failures.length) {
        setError(
          `Could not refresh ${failures.join(
            " and "
          )}. Please try again.`
        );
      }
    } catch {
      setError(
        "Could not refresh documents and forms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredShared =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      if (!q) return shared;

      return shared.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(q) ||
          item.client.fullName
            .toLowerCase()
            .includes(q) ||
          item.client.email
            ?.toLowerCase()
            .includes(q)
      );
    }, [shared, search]);

  const filteredForms =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      if (!q) return forms;

      return forms.filter(
        (form) =>
          form.name
            .toLowerCase()
            .includes(q) ||
          form.description
            ?.toLowerCase()
            .includes(q)
      );
    }, [forms, search]);

  const documentCount =
    shared.filter(
      (item) =>
        item.kind === "document"
    ).length;

  const actionRequired =
    shared.filter(
      (item) =>
        item.status ===
        "action_required"
    ).length;

  const publishedForms =
    forms.filter(
      (form) =>
        form.status === "published"
    ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
              Administration
            </p>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <CheckCircle2 size={11} />
              Connected
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Documents & Contracts
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)]">
            Review documents and forms
            shared with clients, manage
            reusable forms, and see which
            document capabilities are
            currently available in
            KhairoDietClinic.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            size={13}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
          <FileText
            size={17}
            className="text-[#0d9488]"
          />
          <p className="mt-4 text-2xl font-semibold text-white">
            {documentCount}
          </p>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Shared documents
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
          <ClipboardList
            size={17}
            className="text-[#0d9488]"
          />
          <p className="mt-4 text-2xl font-semibold text-white">
            {forms.length}
          </p>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Reusable forms
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
          <CheckCircle2
            size={17}
            className="text-[#0d9488]"
          />
          <p className="mt-4 text-2xl font-semibold text-white">
            {publishedForms}
          </p>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Published forms
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
          <AlertTriangle
            size={17}
            className="text-amber-300"
          />
          <p className="mt-4 text-2xl font-semibold text-white">
            {actionRequired}
          </p>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Client actions required
          </p>
        </div>
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]">
        <div className="border-b border-[var(--theme-border)]">
          <div className="flex max-w-full gap-1 overflow-x-auto px-3 pt-2 sm:px-4">
            {[
              ["shared", "Shared items"],
              ["forms", "Forms"],
              ["contracts", "Contracts"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setTab(key as Tab)
                }
                className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${
                  tab === key
                    ? "border-[#0d9488] text-white"
                    : "border-transparent text-[var(--theme-text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab !== "contracts" && (
          <div className="border-b border-[var(--theme-border)] p-4">
            <div className="flex h-10 max-w-xl items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
              <Search
                size={15}
                className="shrink-0 text-[var(--theme-text-muted)]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  tab === "shared"
                    ? "Search client documents and forms"
                    : "Search reusable forms"
                }
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--theme-text-muted)]">
            <Loader2
              size={15}
              className="animate-spin"
            />
            Loading…
          </div>
        ) : tab === "shared" ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--theme-border)] text-[10px] uppercase tracking-wide text-[var(--theme-text-muted)]">
                    <th className="px-5 py-3 font-medium">
                      Item
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Client
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Type
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Shared
                    </th>
                    <th className="w-16 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredShared.map(
                    (item) => (
                      <tr
                        key={item._id}
                        className="border-b border-[var(--theme-border)] last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="max-w-xs truncate text-sm font-medium text-white">
                            {item.title}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-[var(--theme-text-secondary)]">
                            {
                              item.client
                                .fullName
                            }
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--theme-text-muted)]">
                            {
                              item.client
                                .email ||
                              "No email"
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm capitalize text-[var(--theme-text-secondary)]">
                          {item.kind}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(
                              item.status
                            )}`}
                          >
                            {
                              STATUS_LABELS[
                                item.status
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[var(--theme-text-muted)]">
                          {new Date(
                            item.createdAt
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-3 py-4">
                          {item.url && (
                            <a
                              href={
                                item.url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${item.title}`}
                              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-muted)] transition hover:text-[#0d9488]"
                            >
                              <ExternalLink
                                size={14}
                              />
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  )}

                  {!filteredShared.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center text-sm text-[var(--theme-text-muted)]"
                      >
                        No shared
                        documents or
                        forms found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[var(--theme-border-soft)] md:hidden">
              {filteredShared.map(
                (item) => (
                  <div
                    key={item._id}
                    className="p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]">
                        {item.kind ===
                        "form" ? (
                          <ClipboardList
                            size={17}
                          />
                        ) : (
                          <FileText
                            size={17}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-white">
                              {item.title}
                            </p>

                            <p className="mt-1 break-words text-xs text-[var(--theme-text-muted)]">
                              {
                                item.client
                                  .fullName
                              }{" "}
                              ·{" "}
                              {item.kind}
                            </p>
                          </div>

                          {item.url && (
                            <a
                              href={
                                item.url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${item.title}`}
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
                            >
                              <ExternalLink
                                size={14}
                              />
                            </a>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass(
                              item.status
                            )}`}
                          >
                            {
                              STATUS_LABELS[
                                item.status
                              ]
                            }
                          </span>

                          <span className="text-[10px] text-[var(--theme-text-muted)]">
                            {new Date(
                              item.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {!filteredShared.length && (
                <p className="px-4 py-12 text-center text-sm text-[var(--theme-text-muted)]">
                  No shared documents
                  or forms found.
                </p>
              )}
            </div>
          </>
        ) : tab === "forms" ? (
          <div>
            <div className="flex flex-col gap-3 border-b border-[var(--theme-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--theme-text-secondary)]">
                  Reusable KhairoDietClinic forms
                </p>
                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                  Forms are created,
                  published and edited in
                  Form Builder.
                </p>
              </div>

              <Link
                href="/dashboard/forms"
                className="inline-flex h-9 w-fit items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white"
              >
                <ClipboardList
                  size={13}
                />
                Open Form Builder
              </Link>
            </div>

            <div className="divide-y divide-[var(--theme-border-soft)]">
              {filteredForms.map(
                (form) => (
                  <div
                    key={form._id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-medium text-[var(--theme-text)]">
                          {form.name}
                        </p>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${
                            form.status ===
                            "published"
                              ? "border-emerald-500/20 text-emerald-300"
                              : "border-[var(--theme-border)] text-[var(--theme-text-muted)]"
                          }`}
                        >
                          {form.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                        {
                          TARGET_LABELS[
                            form
                              .targetEntityType
                          ]
                        }{" "}
                        ·{" "}
                        {
                          form.visibility
                        }{" "}
                        ·{" "}
                        {Number(
                          form.submissionCount ||
                            0
                        )}{" "}
                        response
                        {Number(
                          form.submissionCount ||
                            0
                        ) === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <Link
                      href="/dashboard/forms"
                      className="inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white"
                    >
                      Manage
                      <ExternalLink
                        size={12}
                      />
                    </Link>
                  </div>
                )
              )}

              {!filteredForms.length && (
                <p className="px-4 py-12 text-center text-sm text-[var(--theme-text-muted)]">
                  No reusable forms
                  found.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <FileSignature
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-300"
                />

                <div>
                  <h2 className="font-semibold text-white">
                    Contract &
                    e-signature support
                    is not configured yet
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--theme-text-secondary)]">
                    KhairoDietClinic currently
                    supports reusable
                    forms and documents
                    or form links shared
                    with individual
                    clients. It does not
                    yet have a dedicated
                    contract,
                    e-signature,
                    signature audit trail
                    or executed-contract
                    repository.
                  </p>

                  <p className="mt-3 text-xs leading-5 text-amber-100/55">
                    No contract records
                    are being simulated
                    on this page.
                    Contract management
                    can be added later as
                    a separate,
                    auditable workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3 text-xs leading-5 text-[var(--theme-text-muted)]">
        Client-shared items shown here
        come from the same records used
        by the KhairoDietClinic client portal.
        This screen does not create a
        second document repository.
      </div>
    </main>
  );
}
