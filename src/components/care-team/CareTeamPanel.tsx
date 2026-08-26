/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type Person = { _id?: string; id?: string; name?: string; email?: string };
type Snapshot = {
  client: {
    _id: string;
    fullName: string;
    assignedCoach?: Person | null;
    assignedDoctor?: Person | null;
  };
  summary: {
    currentCheckInWeightKg?: number | null;
    latestDailyWeightKg?: number | null;
    tracking7: { trackedDays: number; days: number; percentage: number };
    tracking30: { trackedDays: number; days: number; percentage: number };
  };
  measurements: Array<{
    _id?: string;
    date?: string;
    waistCm?: number;
    hipsCm?: number;
    chestCm?: number;
    energy?: number;
    sleep?: number;
    mobility?: number;
    confidence?: number;
    notes?: string;
  }>;
  progressPhotos: Array<{ _id: string; uploadedAt: string; angle?: string; note?: string }>;
  messages: Array<{ _id: string; senderType: string; senderName?: string; body: string; createdAt: string }>;
  supplements: Array<{ _id: string; quantity?: number; supplement?: { name?: string; unit?: string } | null }>;
  sharedItems: Array<{ _id?: string; title: string; kind: string; status?: string; url?: string }>;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function peopleFromResponse(value: unknown): Person[] {
  if (Array.isArray(value)) return value as Person[];
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  for (const key of ["doctors", "users", "staff", "data"]) {
    if (Array.isArray(obj[key])) return obj[key] as Person[];
  }
  return [];
}

export default function CareTeamPanel({ clientId }: { clientId: string }) {
  const { hasRole } = useAuth();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [doctors, setDoctors] = useState<Person[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ snapshot?: Snapshot } & Snapshot>(`/care-team/clients/${clientId}`);
      setSnapshot((res.snapshot || res) as Snapshot);
    } catch {
      setSnapshot(null);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!hasRole("admin")) return;
    api.get<unknown>("/auth/doctors")
      .then((res) => setDoctors(peopleFromResponse(res)))
      .catch(() => setDoctors([]));
  }, [hasRole]);

  useEffect(() => {
    const photos = snapshot?.progressPhotos?.slice(0, 4) || [];
    if (!photos.length) {
      setPhotoUrls({});
      return;
    }

    let cancelled = false;
    const created: string[] = [];
    const token = localStorage.getItem("khairo_staff_token");

    Promise.all(
      photos.map(async (photo) => {
        const response = await fetch(
          `${API}/care-team/clients/${clientId}/progress-photos/${photo._id}/image`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!response.ok) return [photo._id, ""] as const;
        const url = URL.createObjectURL(await response.blob());
        created.push(url);
        return [photo._id, url] as const;
      })
    ).then((pairs) => {
      if (!cancelled) setPhotoUrls(Object.fromEntries(pairs.filter(([, url]) => Boolean(url))));
    });

    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [snapshot?.progressPhotos, clientId]);

  const latestMeasurement = useMemo(() => {
    const items = snapshot?.measurements || [];
    return [...items].sort((a, b) => +new Date(b.date || 0) - +new Date(a.date || 0))[0] || null;
  }, [snapshot?.measurements]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/client-experience-admin/messages/${clientId}/reply`, { body: reply.trim(), category: "general" });
      setReply("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const assignDoctor = async (doctorId: string) => {
    setAssigning(true);
    try {
      await api.patch(`/clients/${clientId}`, { assignedDoctor: doctorId || null });
      await load();
    } finally {
      setAssigning(false);
    }
  };

  if (!snapshot) return null;

  return (
    <section className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Care team overview</h2>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">One shared client record across the client portal, coach and doctor views.</p>
        </div>
        <div className="text-right text-xs text-[var(--theme-text-secondary)]">
          <p>Coach: <span className="text-white">{snapshot.client.assignedCoach?.name || "Unassigned"}</span></p>
          <p className="mt-1">Doctor: <span className="text-white">{snapshot.client.assignedDoctor?.name || "Unassigned"}</span></p>
        </div>
      </div>

      {hasRole("admin") && (
        <div className="mt-4 max-w-sm">
          <label className="text-xs text-[var(--theme-text-secondary)]">Assigned doctor</label>
          <select
            value={snapshot.client.assignedDoctor?._id || snapshot.client.assignedDoctor?.id || ""}
            onChange={(e) => void assignDoctor(e.target.value)}
            disabled={assigning}
            className="mt-1 w-full rounded-sm border border-[var(--theme-border)] bg-black/40 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">Unassigned</option>
            {doctors.map((doctor) => (
              <option key={doctor._id || doctor.id} value={doctor._id || doctor.id}>{doctor.name || doctor.email}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
          <p className="text-xs text-[var(--theme-text-secondary)]">Current check-in weight</p>
          <p className="mt-1 text-xl font-semibold text-white">{snapshot.summary.currentCheckInWeightKg ?? "—"}{snapshot.summary.currentCheckInWeightKg != null ? " kg" : ""}</p>
        </div>
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
          <p className="text-xs text-[var(--theme-text-secondary)]">Latest daily weight</p>
          <p className="mt-1 text-xl font-semibold text-white">{snapshot.summary.latestDailyWeightKg ?? "—"}{snapshot.summary.latestDailyWeightKg != null ? " kg" : ""}</p>
        </div>
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
          <p className="text-xs text-[var(--theme-text-secondary)]">Tracking consistency · 7 days</p>
          <p className="mt-1 text-xl font-semibold text-white">{snapshot.summary.tracking7.percentage}%</p>
          <p className="text-xs text-[var(--theme-text-secondary)]">{snapshot.summary.tracking7.trackedDays} of 7 days tracked</p>
        </div>
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
          <p className="text-xs text-[var(--theme-text-secondary)]">Tracking consistency · 30 days</p>
          <p className="mt-1 text-xl font-semibold text-white">{snapshot.summary.tracking30.percentage}%</p>
          <p className="text-xs text-[var(--theme-text-secondary)]">{snapshot.summary.tracking30.trackedDays} of 30 days tracked</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
          <h3 className="text-sm font-medium text-white">Latest measurements</h3>
          {!latestMeasurement ? (
            <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No measurements submitted yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p className="text-[var(--theme-text-secondary)]">Waist <span className="float-right text-white">{latestMeasurement.waistCm ?? "—"}{latestMeasurement.waistCm != null ? " cm" : ""}</span></p>
              <p className="text-[var(--theme-text-secondary)]">Hips <span className="float-right text-white">{latestMeasurement.hipsCm ?? "—"}{latestMeasurement.hipsCm != null ? " cm" : ""}</span></p>
              <p className="text-[var(--theme-text-secondary)]">Energy <span className="float-right text-white">{latestMeasurement.energy ?? "—"}/5</span></p>
              <p className="text-[var(--theme-text-secondary)]">Sleep <span className="float-right text-white">{latestMeasurement.sleep ?? "—"}/5</span></p>
            </div>
          )}
        </div>

        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
          <h3 className="text-sm font-medium text-white">Assigned supplements</h3>
          {snapshot.supplements.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No supplements assigned.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {snapshot.supplements.slice(0, 6).map((item) => (
                <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--theme-text-secondary)]">{item.supplement?.name || "Supplement"}</span>
                  <span className="text-white">× {item.quantity || 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
        <h3 className="text-sm font-medium text-white">Progress photos</h3>
        {snapshot.progressPhotos.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">No progress photos uploaded yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {snapshot.progressPhotos.slice(0, 4).map((photo) => (
              <div key={photo._id}>
                {photoUrls[photo._id] ? (
                  <img src={photoUrls[photo._id]} alt={`${photo.angle || "Progress"} progress`} className="aspect-[3/4] w-full rounded-sm object-cover" />
                ) : (
                  <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-[var(--theme-surface-soft)]" />
                )}
                <p className="mt-1 text-[10px] capitalize text-[var(--theme-text-secondary)]">{photo.angle || "progress"} · {new Date(photo.uploadedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
          <h3 className="text-sm font-medium text-white">Client messages</h3>
          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
            {snapshot.messages.length === 0 ? (
              <p className="text-sm text-[var(--theme-text-secondary)]">No portal messages yet.</p>
            ) : snapshot.messages.slice(0, 10).map((message) => (
              <div key={message._id} className="rounded-sm bg-[var(--theme-input)] p-3">
                <p className="text-xs text-[var(--theme-text-secondary)]">{message.senderType === "client" ? snapshot.client.fullName : message.senderName || "KhairoDietClinic team"} · {new Date(message.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-sm text-[var(--theme-text)]">{message.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to client…" className="min-w-0 flex-1 rounded-sm border border-[var(--theme-border)] bg-black/40 px-3 py-2 text-sm text-white outline-none" />
            <button onClick={() => void sendReply()} disabled={sending || !reply.trim()} className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{sending ? "Sending…" : "Send"}</button>
          </div>
        </div>

        <div className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
          <h3 className="text-sm font-medium text-white">Shared documents & forms</h3>
          {snapshot.sharedItems.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">Nothing shared yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {snapshot.sharedItems.slice(0, 10).map((item, index) => (
                <div key={item._id || `${item.title}-${index}`} className="flex items-center justify-between gap-3 rounded-sm bg-[var(--theme-input)] p-3 text-sm">
                  <span className="text-[var(--theme-text)]">{item.title}</span>
                  <span className="text-xs capitalize text-[var(--theme-text-secondary)]">{item.status || item.kind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
