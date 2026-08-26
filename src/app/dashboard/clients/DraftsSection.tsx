"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type Draft = {
  _id: string;
  title: string;
  changes: Record<string, unknown>;
  note?: string;
  status: "pending" | "finalized" | "rejected";
  submittedBy?: { _id: string; name: string } | null;
  finalizedBy?: { _id: string; name: string } | null;
  createdAt: string;
};

type FieldOption = { key: string; label: string; kind: "select" | "number"; options?: string[] };

const FIELD_OPTIONS: FieldOption[] = [
  { key: "program", label: "Program", kind: "select", options: ["core", "plus", "vip"] },
  { key: "status", label: "Status", kind: "select", options: ["active", "paused", "completed", "cancelled"] },
  { key: "goalWeightKg", label: "Goal weight (kg)", kind: "number" },
];

export default function DraftsSection({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [fieldKey, setFieldKey] = useState("program");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await api.get<{ drafts: Draft[] }>(`/drafts/entity/${entityType}/${entityId}`);
      setDrafts(res.drafts || []);
    } catch {}
  }, [entityType, entityId]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setSaving(true);
    try {
      const opt = FIELD_OPTIONS.find((f) => f.key === fieldKey);
      const parsed = opt?.kind === "number" ? Number(value) : value;
      await api.post(`/drafts/entity/${entityType}/${entityId}`, {
        title: `${opt?.label || fieldKey} → ${value}`,
        changes: { [fieldKey]: parsed },
        note: note.trim() || undefined,
      });
      setValue("");
      setNote("");
      fetchDrafts();
    } catch {} finally { setSaving(false); }
  };

  const act = async (id: string, action: "finalize" | "reject") => {
    setActing(true);
    try {
      await api.post(`/drafts/${id}/${action}`);
      fetchDrafts();
    } catch {} finally { setActing(false); }
  };

  const opt = FIELD_OPTIONS.find((f) => f.key === fieldKey);

  return (
    <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
      <p className="font-medium text-white">Proposed changes (drafts)</p>
      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
        High-stakes edits are saved as drafts and only apply when an admin finalizes them. Every draft records who submitted it and who finalized it.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select value={fieldKey} onChange={(e) => { setFieldKey(e.target.value); setValue(""); }} className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]">
          {FIELD_OPTIONS.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
        </select>
        {opt?.kind === "select" ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]">
            <option value="">Choose new value…</option>
            {(opt.options || []).map((o) => (<option key={o} value={o}>{o}</option>))}
          </select>
        ) : (
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="New value" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
        )}
        <button type="submit" disabled={saving || !value} className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          Save as draft
        </button>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional, e.g. client upgraded after review)" className="rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] sm:col-span-3" />
      </form>

      <div className="mt-4 space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-secondary)]">No drafts yet.</p>
        ) : (
          drafts.map((d) => (
            <div key={d._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--theme-text)]">{d.title}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${d.status === "pending" ? "bg-yellow-500/10 text-yellow-400" : d.status === "finalized" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {d.status}
                </span>
              </div>
              {d.note && <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">“{d.note}”</p>}
              <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                Submitted by {d.submittedBy?.name || "Staff"} · {new Date(d.createdAt).toLocaleString()}
                {d.status !== "pending" && d.finalizedBy ? ` · ${d.status} by ${d.finalizedBy.name}` : ""}
              </p>
              {isAdmin && d.status === "pending" && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => act(d._id, "finalize")} disabled={acting} className="flex flex-wrap items-center gap-1 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50">
                    <CheckCircle2 size={13} /> Finalize
                  </button>
                  <button onClick={() => act(d._id, "reject")} disabled={acting} className="flex flex-wrap items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
