/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const DEFAULT_LOGO_URL = "/icon.svg";

type Newsletter = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  logoUrl?: string;
  publishedAt?: string;
};

export default function PortalNewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Newsletter | null>(null);

  useEffect(() => {
    api
      .get<{ newsletters: Newsletter[] }>("/newsletters/client", true)
      .then((res) => setNewsletters(res.newsletters || []))
      .catch(() => setNewsletters([]))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl pb-24 pt-2 md:pb-12">
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-zinc-400 hover:text-white">
          ← Back
        </button>
        {(selected.logoUrl || DEFAULT_LOGO_URL) ? (
          <img src={selected.logoUrl} alt="KhairoDietClinic logo" className="mb-4 h-12 w-auto object-contain" />
        ) : (
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0d9488] text-sm font-bold text-white">F</span>
            <span className="font-bold tracking-tight text-white">KHAIRO</span>
          </div>
        )}
        <h1 className="text-3xl font-semibold text-white">{selected.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString() : ""}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 p-6 text-zinc-300 leading-7 whitespace-pre-wrap">
          {selected.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 pt-2 md:pb-12">
      <h1 className="text-3xl font-semibold text-white">KhairoDietClinic News</h1>
      <p className="mt-2 text-sm text-zinc-400">Updates, tips, and announcements from the KhairoDietClinic team.</p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : newsletters.length === 0 ? (
          <p className="text-zinc-400">No newsletters yet.</p>
        ) : newsletters.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelected(n)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-left hover:bg-zinc-800/50"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                {(n.logoUrl || DEFAULT_LOGO_URL) ? (
                  <img src={n.logoUrl} alt="KhairoDietClinic" className="h-6 w-auto object-contain" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0d9488] text-xs font-bold">F</span>
                )}
                {n.title}
              </div>
            <p className="mt-2 text-sm text-zinc-400">{n.excerpt}</p>
            <p className="mt-2 text-xs text-zinc-600">
              {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
