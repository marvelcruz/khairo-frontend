"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Save } from "lucide-react";

type MessageTemplate = {
  _id: string;
  name: string;
  dayOffset: number;
  audience: string;
  active: boolean;
  body: string;
};

type TemplatesResponse = {
  success: boolean;
  templates: MessageTemplate[];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<TemplatesResponse>("/templates").then((res) => {
      if (res.success) setTemplates(res.templates);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const update = (id: string, patch: Partial<MessageTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t._id === id ? { ...t, ...patch } : t)));
  };

  const save = async (tpl: MessageTemplate) => {
    setSaving(tpl._id);
    try {
      await api.put(`/templates/${tpl._id}`, tpl);
      alert(" Template saved!");
    } catch (err) {
      alert(" " + (err instanceof Error ? err.message : "Could not save"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-8 text-[var(--theme-text-secondary)]">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Message Templates</h1>
      <p className="text-sm text-[var(--theme-text-secondary)] mb-5 sm:mb-8">Edit your automated WhatsApp messages. Changes go live instantly.</p>

      <div className="space-y-4 max-w-3xl">
        {templates.map((tpl) => (
          <div key={tpl._id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <input
                  value={tpl.name}
                  onChange={(e) => update(tpl._id, { name: e.target.value })}
                  className="w-full text-lg font-semibold text-white bg-transparent border-none outline-none mb-1"
                />
                <div className="flex flex-wrap gap-4 text-xs text-[var(--theme-text-secondary)]">
                  <span>Offset: {tpl.dayOffset} day{tpl.dayOffset !== 1 ? "s" : ""}</span>
                  <span>Audience: {tpl.audience}</span>
                </div>
              </div>
              <label className="flex min-h-10 shrink-0 items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                <input
                  type="checkbox"
                  checked={tpl.active}
                  onChange={(e) => update(tpl._id, { active: e.target.checked })}
                  className="h-4 w-4 accent-[#0d9488]"
                />
                Active
              </label>
            </div>

            <textarea
              value={tpl.body}
              onChange={(e) => update(tpl._id, { body: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-white outline-none focus:border-[#0d9488]"
              placeholder="Use {first} for name, {payLink} for payment link"
            />

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => save(tpl)}
                disabled={saving === tpl._id}
                className="flex min-h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Save size={14} />
                {saving === tpl._id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
