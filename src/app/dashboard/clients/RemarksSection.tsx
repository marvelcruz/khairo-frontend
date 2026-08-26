"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { MessageSquarePlus } from "lucide-react";
import { api } from "../../../lib/api";

type Remark = {
  _id: string;
  text: string;
  createdAt: string;
  author?: { _id: string; name: string } | null;
};

export default function RemarksSection({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRemarks = useCallback(async () => {
    try {
      const res = await api.get<{ remarks: Remark[] }>(`/remarks/${entityType}/${entityId}`);
      setRemarks(res.remarks || []);
    } catch {}
  }, [entityType, entityId]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api.post(`/remarks/${entityType}/${entityId}`, { text: text.trim() });
      setText("");
      fetchRemarks();
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
      <p className="font-medium text-white">Staff remarks</p>
      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
        Timestamped, signed notes. Append-only — they never get overwritten and survive staff turnover.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a remark (e.g. called to pause next month)…"
          className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
        />
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="flex flex-wrap shrink-0 items-center gap-1 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <MessageSquarePlus size={14} /> Add
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {remarks.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-secondary)]">No remarks yet.</p>
        ) : (
          remarks.map((r) => (
            <div key={r._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2">
              <p className="text-sm text-[var(--theme-text)]">{r.text}</p>
              <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                {r.author?.name || "Staff"} · {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
