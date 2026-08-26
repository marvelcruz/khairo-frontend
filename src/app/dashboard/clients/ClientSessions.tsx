"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Session = {
  _id: string;
  startsAt: string;
  sessionType: string;
  status: string;
  isTeam?: boolean;
  zoomLink?: string;
  staff?: { name: string } | null;
  decidedBy?: { name: string } | null;
  client?: { _id: string } | null;
};

type TranscriptEntry = {
  source?: string;
  createdBy?: { name?: string } | null;
  createdAt?: string;
  text?: string;
};

type SessionsResponse = {
  sessions?: Session[];
};

type TranscriptsResponse = {
  transcripts?: TranscriptEntry[];
};

export default function ClientSessions({ clientId }: { clientId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTranscript, setOpenTranscript] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<SessionsResponse>("/sessions");
        const all = (res.sessions || []).filter((s) => !s.isTeam && s.client?._id === clientId);
        setSessions(all);
      } catch {}
      setLoading(false);
    })();
  }, [clientId]);

  const now = Date.now();
  const upcoming = sessions
    .filter((s) => new Date(s.startsAt).getTime() >= now && !["declined", "cancelled", "completed"].includes(s.status))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = sessions
    .filter((s) => new Date(s.startsAt).getTime() < now || s.status === "completed")
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  const loadTranscript = async (id: string) => {
    if (openTranscript === id) { setOpenTranscript(null); return; }
    setOpenTranscript(id);
    try {
      const res = await api.get<TranscriptsResponse>(`/transcripts/session/${id}`);
      setTranscripts(res.transcripts || []);
    } catch { setTranscripts([]); }
  };

  const chip = (status: string) =>
    status === "completed" ? "bg-blue-500/10 text-blue-400"
    : status === "confirmed" ? "bg-green-500/10 text-green-400"
    : status === "declined" || status === "cancelled" ? "bg-red-500/10 text-red-400"
    : "bg-amber-500/10 text-amber-400";

  return (
    <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
      <p className="font-medium text-white">Sessions ({upcoming.length} upcoming · {past.length} past)</p>
      {loading ? (
        <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No sessions booked yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {[...upcoming, ...past].slice(0, 8).map((s) => (
            <div key={s._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2.5">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <p className="text-sm text-white">
                  {new Date(s.startsAt).toLocaleDateString()} · {new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · <span className="capitalize">{s.sessionType}</span>
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${chip(s.status)}`}>{s.status}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                {s.staff ? `with ${s.staff.name}` : "unassigned"}
                {s.status === "completed" && s.decidedBy ? ` · closed by ${s.decidedBy.name}` : ""}
              </p>
              {s.status === "completed" && (
                <button onClick={() => loadTranscript(s._id)} className="mt-2 rounded-full bg-[var(--theme-surface-soft)] px-3 py-1 text-[10px] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)]">
                  {openTranscript === s._id ? "Hide transcript" : "View transcript"}
                </button>
              )}
              {openTranscript === s._id && (
                <div className="mt-2 space-y-2">
                  {transcripts.length === 0 ? (
                    <p className="text-xs text-[var(--theme-text-secondary)]">No transcript yet.</p>
                  ) : (
                    transcripts.map((t, i) => (
                      <div key={i} className="rounded-sm bg-black/40 p-3">
                        <div className="mb-1 flex flex-wrap gap-3 items-center justify-between text-[10px]">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${t.source === "webhook" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {t.source === "webhook" ? "AUTO" : "MANUAL"}
                          </span>
                          <span className="text-[var(--theme-text-secondary)]">{t.createdBy?.name ? `by ${t.createdBy.name} · ` : ""}{t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}</span>
                        </div>
                        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--theme-text-secondary)]">{t.text}</pre>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
