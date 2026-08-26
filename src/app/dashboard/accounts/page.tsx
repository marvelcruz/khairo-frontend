"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Plus,
  X,
  UserX,
  UserCheck,
  Pencil,
  Stethoscope,
  Users,
} from "lucide-react";
import { api } from "../../../lib/api";
import {
  accessProfileLabel,
  normalizeAccessProfile,
} from "../../../lib/accessControl";
import { PageTicker } from "../../../components/PageTicker";

type Account = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  accessProfile?: string;
  isActive?: boolean;
  lastLogin?: string;
};

const ACCESS_OPTIONS = [
  {
    value: "staff",
    label: "Staff",
    description: "Full access to run the business and serve clients.",
  },
  {
    value: "doctor",
    label: "Doctor",
    description: "Clinical access only: assigned clients, medical review, appointments and messages.",
  },
] as const;

const inputClass =
  "w-full rounded-xl border border-[var(--theme-border)] bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]";

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

type AccountsContainer = {
  users?: Account[];
  accounts?: Account[];
  data?: Account[];
};

type AccountsResponse =
  | Account[]
  | AccountsContainer
  | { data?: Account[] | AccountsContainer };

function extractAccounts(res: AccountsResponse): Account[] {
  if (Array.isArray(res)) return res;

  const direct =
    ("users" in res && res.users) ||
    ("accounts" in res && res.accounts);

  if (direct) return direct;

  const nested = "data" in res ? res.data : undefined;
  if (Array.isArray(nested)) return nested;

  if (nested && typeof nested === "object") {
    return nested.users || nested.accounts || nested.data || [];
  }

  return [];
}

function getAccountId(account: Account) {
  return account._id || account.id || "";
}

function profileFor(account: Account): "staff" | "doctor" {
  return normalizeAccessProfile(account);
}

function ProfileChoice({
  value,
  onChange,
}: {
  value: "staff" | "doctor";
  onChange: (value: "staff" | "doctor") => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ACCESS_OPTIONS.map((option) => {
        const selected = value === option.value;
        const Icon = option.value === "doctor" ? Stethoscope : Users;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border p-3 text-left transition ${
              selected
                ? "border-[#0d9488]/60 bg-[#0d9488]/10"
                : "border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className={selected ? "text-[#0d9488]" : "text-[var(--theme-text-muted)]"} />
              <span className="text-sm font-semibold text-white">{option.label}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--theme-text-secondary)]">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function AddLoginModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff" as "staff" | "doctor",
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
      await api.post("/auth/staff", form);
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err, "Could not create this login."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Add a team login</h2>
            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Choose the simplest access level that fits their job.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[var(--theme-text-secondary)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Temporary password</label>
            <input
              required
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--theme-text-secondary)]">What kind of access do they need?</p>
            <ProfileChoice
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
            />
          </div>

          <p className="text-xs leading-5 text-[var(--theme-text-muted)]">
            You can change Staff or Doctor access later. More detailed access controls can be added in the future without changing these two simple choices.
          </p>

          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditLoginModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: account.name || "",
    email: account.email || "",
    phone: account.phone || "",
    role: profileFor(account),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await api.patch("/auth/staff/" + getAccountId(account), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update this login."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Edit {account.name}</h2>
          <button onClick={onClose} aria-label="Close" className="text-[var(--theme-text-secondary)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">Phone / WhatsApp</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--theme-text-secondary)]">Access</p>
            <ProfileChoice
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
            />
          </div>

          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StaffAccessPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const res = await api.get<AccountsResponse>("/auth/staff");
      setAccounts(extractAccounts(res));
      setError("");
    } catch (err) {
      setAccounts([]);
      setError(err instanceof Error ? err.message : "Could not load team access");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
    const timer = window.setInterval(() => void fetchAccounts(true), 45000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void fetchAccounts(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchAccounts]);

  const toggleStatus = async (accountId: string, currentlyActive: boolean) => {
    if (!accountId) return;
    const action = currentlyActive ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} this login?`)) return;

    setUpdatingId(accountId);
    try {
      await api.patch(`/auth/staff/${accountId}`, { isActive: !currentlyActive });
      await fetchAccounts();
    } catch (err) {
      window.alert(getErrorMessage(err, `Could not ${action} this login.`));
    } finally {
      setUpdatingId(null);
    }
  };

  const active = accounts.filter((account) => account.isActive !== false);
  const staffCount = active.filter((account) => profileFor(account) === "staff").length;
  const doctorCount = active.filter((account) => profileFor(account) === "doctor").length;
  const neverSignedIn = active.filter((account) => !account.lastLogin).length;

  const tickerItems = loading
    ? ["Reading team access…"]
    : [
        `${active.length} active team login${active.length === 1 ? "" : "s"}: ${staffCount} Staff, ${doctorCount} Doctor${doctorCount === 1 ? "" : "s"}.`,
        neverSignedIn > 0
          ? `${neverSignedIn} team member${neverSignedIn === 1 ? " has" : "s have"} not signed in yet.`
          : "Everyone with active access has signed in at least once.",
      ];

  return (
    <div className="pb-20">
      <PageTicker items={tickerItems} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">Setup</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Staff Access</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--theme-text-secondary)]">
            Keep access simple. Choose <strong className="font-semibold text-white">Staff</strong> for people who run the business, or <strong className="font-semibold text-white">Doctor</strong> for clinical access.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex min-h-10 self-start items-center gap-1.5 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white hover:bg-teal-700"
        >
          <Plus size={14} /> Add team login
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--theme-text-secondary)]">
        Clients do not appear here. They use the separate client portal. More detailed staff permissions can be added later if the business needs them.
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {loading ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-sm text-[var(--theme-text-secondary)]">Loading team access…</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center">
            <p className="text-sm font-semibold text-white">No team logins yet</p>
            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Add the first Staff or Doctor login.</p>
          </div>
        ) : (
          accounts.map((account, index) => {
            const accountId = getAccountId(account);
            const enabled = account.isActive !== false;
            const profile = profileFor(account);
            const Icon = profile === "doctor" ? Stethoscope : Users;

            return (
              <div key={accountId || index} className="flex flex-col gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{account.name || "Unnamed team member"}</p>
                      <span className="rounded-full border border-[var(--theme-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--theme-text-secondary)]">
                        {accessProfileLabel(account)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enabled ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
                        {enabled ? "Active" : "Off"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--theme-text-secondary)]">{account.email || "—"}</p>
                    <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                      {account.lastLogin ? `Last signed in ${new Date(account.lastLogin).toLocaleDateString()}` : "Has not signed in yet"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => setEditing(account)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--theme-border)] px-3 text-xs font-semibold text-white hover:bg-[var(--theme-surface-hover)]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => void toggleStatus(accountId, enabled)}
                    disabled={!accountId || updatingId === accountId}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold disabled:opacity-50 ${
                      enabled
                        ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                        : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                    }`}
                  >
                    {enabled ? <UserX size={13} /> : <UserCheck size={13} />}
                    {enabled ? "Turn off" : "Turn on"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editing && (
        <EditLoginModal
          account={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void fetchAccounts();
          }}
        />
      )}

      {showModal && (
        <AddLoginModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            void fetchAccounts();
          }}
        />
      )}
    </div>
  );
}
