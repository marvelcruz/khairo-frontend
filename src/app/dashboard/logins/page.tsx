"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, X, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { api } from "../../../lib/api";

type Account = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  isActive?: boolean;
  lastLogin?: string;
};

const LOGIN_ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Coach" },
  { value: "doctor", label: "Doctor" },
  { value: "staff", label: "Staff" },
  { value: "sales", label: "Sales" },
];

const inputClass =
  "w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]";

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

function getAccountId(account: Account) {
  return account._id || account.id || "";
}

function getRoleLabel(roles?: string[]) {
  if (!roles || roles.length === 0) return "coach";
  return roles
    .map((role) => LOGIN_ROLES.find((r) => r.value === role)?.label || role.replace(/_/g, " "))
    .join(", ");
}

function AddLoginModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "coach",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/auth/staff", { name: form.name, email: form.email, password: form.password, roles: [form.role] });
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-5">
      <div className="w-full max-w-sm rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="text-xl font-medium text-white">New login account</h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--theme-text-secondary)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />

          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />

          <input
            required
            type="password"
            placeholder="Temporary password (8+ characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            {LOGIN_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          <p className="text-xs text-[var(--theme-text-secondary)]">
            Share this password with them directly and ask them to change it after first login.
          </p>

          {error && <p className="rounded-sm bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0d9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function extractLoginAccounts(value: unknown): Account[] {
  if (Array.isArray(value)) return value as Account[];

  if (typeof value !== "object" || value === null) return [];

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.users)) return record.users as Account[];
  if (Array.isArray(record.accounts)) return record.accounts as Account[];

  if ("data" in record) return extractLoginAccounts(record.data);

  return [];
}
export default function LoginsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get<unknown>("/auth/staff");
      setAccounts(extractLoginAccounts(res));
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const toggleStatus = async (accountId: string, currentlyActive: boolean) => {
    if (!accountId) return;

    const action = currentlyActive ? "deactivate" : "reactivate";
    const confirmed = window.confirm(`Are you sure you want to ${action} this login?`);
    if (!confirmed) return;

    setUpdatingId(accountId);

    try {
      await api.patch(`/auth/staff/${accountId}`, {
        isActive: !currentlyActive,
      });

      await fetchAccounts();
    } catch (err) {
      alert(getErrorMessage(err, `Could not ${action} account.`));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Staff logins</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
            Who can sign in to the Khairo Diet Clinic dashboard, and as which role.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex min-h-10 self-start items-center gap-1.5 rounded-full bg-[#0d9488] px-4 text-xs font-medium text-white hover:bg-teal-700"
        >
          <Plus size={14} /> New login
        </button>
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-center text-sm text-[var(--theme-text-secondary)]">No login accounts found.</div>
        ) : (
          accounts.map((account, index) => {
            const accountId = getAccountId(account);
            const active = account.isActive !== false;

            return (
              <div key={accountId || index} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{account.name || "—"}</p>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-secondary)]">{account.email || "—"}</p>
                    <p className="mt-1 text-xs capitalize text-[var(--theme-text-secondary)]">{getRoleLabel(account.roles)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                    active ? "bg-green-500/10 text-green-400" : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"
                  }`}>
                    {active ? "Active" : "Off"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-3">
                  <span className="text-[11px] text-[var(--theme-text-secondary)]">
                    {account.lastLogin ? `Last login ${new Date(account.lastLogin).toLocaleDateString()}` : "Never logged in"}
                  </span>
                  <button
                    onClick={() => toggleStatus(accountId, active)}
                    disabled={!accountId || updatingId === accountId}
                    className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-xs font-medium disabled:opacity-50 ${
                      active
                        ? "border-red-500/30 text-red-400"
                        : "border-green-500/30 text-green-400"
                    }`}
                  >
                    {active ? <UserX size={13} /> : <UserCheck size={13} />}
                    {active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--theme-border)] text-xs uppercase tracking-wide text-[var(--theme-text-secondary)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">
                  Loading…
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--theme-text-secondary)]">
                  No login accounts found.
                </td>
              </tr>
            ) : (
              accounts.map((account, index) => {
                const accountId = getAccountId(account);
                const active = account.isActive !== false;

                return (
                  <tr key={accountId || index} className="border-b border-[var(--theme-border)] last:border-0">
                    <td className="px-4 py-3 text-white">{account.name || "—"}</td>
                    <td className="px-4 py-3 text-[var(--theme-text-secondary)]">{account.email || "—"}</td>

                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1 text-xs font-medium capitalize text-[var(--theme-text-secondary)]">
                        {account.roles?.includes("admin") && (
                          <ShieldCheck size={13} className="text-[#0d9488]" />
                        )}
                        {getRoleLabel(account.roles)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          active
                            ? "bg-green-500/10 text-green-400"
                            : "bg-[var(--theme-surface-soft)] text-[var(--theme-text-secondary)]"
                        }`}
                      >
                        {active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[var(--theme-text-secondary)]">
                      {account.lastLogin ? new Date(account.lastLogin).toLocaleString() : "Never"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(accountId, active)}
                        disabled={!accountId || updatingId === accountId}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          active
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                      >
                        {active ? <UserX size={13} /> : <UserCheck size={13} />}
                        {active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddLoginModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}
