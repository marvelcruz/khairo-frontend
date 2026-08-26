"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Edit } from "lucide-react";

type Newsletter = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  logoUrl?: string;
  status: "draft" | "published";
  clientVisible: boolean;
  publicVisible: boolean;
  publishedAt?: string;
  createdAt: string;
};

export default function NewslettersPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Newsletter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [logoUrl, setLogoUrl] = useState("/icon.svg");
  const [clientVisible, setClientVisible] = useState(true);
  const [publicVisible, setPublicVisible] = useState(true);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ newsletters: Newsletter[] }>("/newsletters");
      setNewsletters(data.newsletters || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load newsletters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  const resetForm = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setLogoUrl("/icon.svg");
    setClientVisible(true);
    setPublicVisible(true);
    setStatus("draft");
    setEditing(null);
  };

  const openEdit = (n: Newsletter) => {
    setEditing(n);
    setTitle(n.title);
    setExcerpt(n.excerpt);
    setContent(n.content);
    setLogoUrl(n.logoUrl || "/icon.svg");
    setClientVisible(n.clientVisible);
    setPublicVisible(n.publicVisible);
    setStatus(n.status);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = { title, excerpt, content, logoUrl, clientVisible, publicVisible, status };
      if (editing?._id) {
        await api.patch(`/newsletters/${editing._id}`, body);
      } else {
        await api.post("/newsletters", body);
      }
      setShowForm(false);
      resetForm();
      await load();
      setNotice("Newsletter saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save newsletter.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this newsletter?")) return;
    try {
      await api.del(`/newsletters/${id}`);
      await load();
      setNotice("Newsletter deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete newsletter.");
    }
  };

  if (!canManage) {
    return <div className="p-6 text-sm text-zinc-400">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Newsletters</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Create and publish newsletters for the website and client portal.
        </p>
      </header>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-600/10 p-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <button
        onClick={() => { setShowForm(!showForm); resetForm(); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white"
      >
        <Plus size={15} />
        {showForm ? "Cancel" : "New Newsletter"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-zinc-900 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Excerpt</label>
            <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} />
              Visible to clients
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={publicVisible} onChange={(e) => setPublicVisible(e.target.checked)} />
              Visible on website
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Company logo URL</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://your-site.com/logo.png or /icon.svg" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="h-10 rounded-full bg-[#0d9488] px-5 text-xs font-semibold text-white">
              {saving ? "Saving..." : "Save Newsletter"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : newsletters.length === 0 ? (
          <p className="text-sm text-zinc-400">No newsletters yet.</p>
        ) : newsletters.map((n) => (
          <div key={n._id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{n.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{n.status} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : "Not published"}</p>
                <p className="mt-1 text-sm text-zinc-400">{n.excerpt}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(n)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white">
                  <Edit size={13} className="mr-1 inline" /> Edit
                </button>
                <button onClick={() => handleDelete(n._id)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                  <Trash2 size={13} className="mr-1 inline" /> Delete
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-xs text-zinc-500">
              <span className={n.clientVisible ? "text-emerald-300" : "text-zinc-600"}>
                {n.clientVisible ? "Client: ON" : "Client: OFF"}
              </span>
              <span className={n.publicVisible ? "text-emerald-300" : "text-zinc-600"}>
                {n.publicVisible ? "Website: ON" : "Website: OFF"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
