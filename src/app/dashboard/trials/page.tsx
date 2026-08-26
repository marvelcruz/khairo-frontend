"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import {
  Plus,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import { useAuth } from "../../../context/AuthContext";

type TrialRegistration = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  attended: boolean;
  enrolled?: boolean;
  applicationId?: string | null;
  applicationStatus?: string | null;
};

type TrialEvent = {
  _id: string;
  title: string;
  date: string;
  capacity: number;
  location?: string;
  zoomLink?: string;
  isActive: boolean;
  registrationOpen?: boolean;
  registrations: TrialRegistration[];
};

type TrialsResponse = {
  success: boolean;
  events: TrialEvent[];
};

type AttendTrialResponse = {
  success: boolean;
  waLink?: string | null;
};

const emptyForm = {
  title: "Free Trial Day",
  date: "",
  capacity: 20,
  zoomLink: "",
  location: "",
};

export default function TrialsPage() {
  const { hasRole } = useAuth();

  const canCreate = hasRole("admin");
  const canManageAttendance = hasRole(
    "admin",
    "coach"
  );

  const [events, setEvents] =
    useState<TrialEvent[]>([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [actingId, setActingId] =
    useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const res =
        await api.get<TrialsResponse>(
          "/trials/admin"
        );

      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load trial events."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();

    const timer = setInterval(
      () => void load(true),
      45000
    );

    const onVisibility = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void load(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {
      clearInterval(timer);
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, []);

  const create = async () => {
    setError("");

    if (!form.date) {
      setError(
        "Choose a trial date and time."
      );
      return;
    }

    const eventDate = new Date(form.date);

    if (
      Number.isNaN(eventDate.getTime()) ||
      eventDate.getTime() <= Date.now()
    ) {
      setError(
        "Trial events must be scheduled in the future."
      );
      return;
    }

    if (
      !Number.isInteger(form.capacity) ||
      form.capacity < 1 ||
      form.capacity > 500
    ) {
      setError(
        "Capacity must be between 1 and 500."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/trials", {
        ...form,
        date: eventDate.toISOString(),
      });

      setShowCreate(false);
      setForm(emptyForm);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create trial event."
      );
    } finally {
      setLoading(false);
    }
  };

  const markAttended = async (
    eventId: string,
    regId: string
  ) => {
    const actionKey = `${eventId}:${regId}`;
    setActingId(actionKey);
    setError("");

    try {
      const res =
        await api.post<AttendTrialResponse>(
          `/trials/${eventId}/attend/${regId}`
        );

      if (
        res.success &&
        res.waLink &&
        window.confirm(
          "Attendance recorded. Open the follow-up WhatsApp message?"
        )
      ) {
        window.open(
          res.waLink,
          "_blank",
          "noopener,noreferrer"
        );
      }

      await load(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not record attendance."
      );
    } finally {
      setActingId(null);
    }
  };

  const daysUntil = (dateStr: string) => {
    const diff =
      new Date(dateStr).getTime() -
      Date.now();

    return Math.max(
      0,
      Math.floor(diff / 86400000)
    );
  };

  const tickerItems = (() => {
    const items: string[] = [];

    if (loading && events.length === 0) {
      return [
        "Reading the trial events board…",
      ];
    }

    if (events.length === 0) {
      items.push(
        "no trial events yet — use New Trial Day to plan the next prospect experience"
      );
      items.push(
        "trial registrations enter Requests automatically; this board tracks sign-ups, attendance and fully reconciled enrollments"
      );
      return items;
    }

    const now = Date.now();

    const upcoming = events
      .filter(
        (event) =>
          new Date(event.date).getTime() >
          now
      )
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

    const past = events.filter(
      (event) =>
        new Date(event.date).getTime() <=
        now
    );

    items.push(
      events.length +
        " trial event" +
        (events.length === 1 ? "" : "s") +
        " on the calendar" +
        (upcoming.length
          ? ` — ${upcoming.length} upcoming`
          : "") +
        (past.length
          ? ` — ${past.length} past`
          : "")
    );

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const regs =
        next.registrations || [];

      const days =
        daysUntil(next.date);

      items.push(
        "next trial day is " +
          (days === 0
            ? "today"
            : days === 1
              ? "tomorrow"
              : `in ${days} days`) +
          ` — ${next.title} on ${new Date(
            next.date
          ).toLocaleDateString()} — ${
            regs.length
          }/${next.capacity} registered`
      );

      if (regs.length === 0) {
        items.push(
          "no registrations yet — share the public trial link to start collecting sign-ups"
        );
      }
    }

    if (past.length > 0) {
      const pastRegistrations =
        past.flatMap(
          (event) =>
            event.registrations || []
        );

      const attended =
        pastRegistrations.filter(
          (reg) => reg.attended
        );

      const enrolledAfterAttendance =
        attended.filter(
          (reg) => reg.enrolled
        );

      const rate =
        attended.length > 0
          ? Math.round(
              (enrolledAfterAttendance.length /
                attended.length) *
                100
            )
          : 0;

      items.push(
        "across past trials: " +
          enrolledAfterAttendance.length +
          " fully enrolled out of " +
          attended.length +
          " attendees — " +
          rate +
          "% attendee-to-enrollment rate"
      );
    }

    return items;
  })();

  return (
    <div className="[&_button]:min-h-10 [&_input]:min-h-10 sm:[&_button]:min-h-0 sm:[&_input]:min-h-0">
      <PageTicker items={tickerItems} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-white">
            <Calendar size={24} />
            Trial Day Events
          </h1>

          <p className="mt-1 text-[var(--theme-text-secondary)]">
            Trial registrations enter
            Requests first. Enrollment is
            counted only after completed
            reconciliation.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="flex items-center gap-2 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus size={16} />
            New Trial Day
          </button>
        )}
      </div>

      {error && (
        <p className="mb-5 rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {showCreate && canCreate && (
        <div className="mb-6 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Create Trial Day
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title:
                    event.target.value,
                })
              }
              placeholder="Event title"
              className="rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
            />

            <input
              type="datetime-local"
              value={form.date}
              onChange={(event) =>
                setForm({
                  ...form,
                  date:
                    event.target.value,
                })
              }
              className="rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488] [color-scheme:inherit]"
            />

            <input
              type="number"
              min={1}
              max={500}
              value={form.capacity}
              onChange={(event) =>
                setForm({
                  ...form,
                  capacity: Number(
                    event.target.value
                  ),
                })
              }
              placeholder="Capacity"
              className="rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
            />

            <input
              value={form.location}
              onChange={(event) =>
                setForm({
                  ...form,
                  location:
                    event.target.value,
                })
              }
              placeholder="Location (optional)"
              className="rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
            />

            <input
              value={form.zoomLink}
              onChange={(event) =>
                setForm({
                  ...form,
                  zoomLink:
                    event.target.value,
                })
              }
              placeholder="Zoom link (optional)"
              className="rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488] sm:col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={create}
              disabled={loading}
              className="rounded-full bg-[#0d9488] px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading
                ? "Creating…"
                : "Create"}
            </button>

            <button
              onClick={() => {
                setShowCreate(false);
                setError("");
              }}
              className="rounded-full border border-[var(--theme-border)] px-5 py-2 text-sm text-white hover:bg-[var(--theme-surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading &&
        events.length === 0 ? (
          <p className="py-12 text-center text-[var(--theme-text-secondary)]">
            Loading…
          </p>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-[var(--theme-text-secondary)]">
            No trial events yet.
          </p>
        ) : (
          events.map((event) => {
            const eventHasStarted =
              new Date(
                event.date
              ).getTime() <= Date.now();

            const open =
              event.registrationOpen ??
              (event.isActive &&
                !eventHasStarted);

            return (
              <div
                key={event._id}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">
                      {event.title}
                    </h3>

                    <p className="mt-1 break-words text-sm text-[var(--theme-text-secondary)]">
                      {new Date(
                        event.date
                      ).toLocaleString()}
                      {" · "}
                      {
                        event
                          .registrations
                          .length
                      }
                      /{event.capacity}{" "}
                      registered
                      {event.location
                        ? ` · ${event.location}`
                        : ""}
                    </p>
                  </div>

                  {!open && (
                    <span className="rounded-full bg-[var(--theme-surface-soft)] px-3 py-1 text-xs text-[var(--theme-text-secondary)]">
                      Closed
                    </span>
                  )}
                </div>

                {event.registrations
                  .length > 0 ? (
                  <div className="space-y-1.5">
                    {event.registrations.map(
                      (reg) => (
                        <div
                          key={reg._id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-2.5 ${
                            reg.enrolled
                              ? "bg-green-500/10"
                              : reg.attended
                                ? "bg-blue-500/10"
                                : "bg-[var(--theme-surface-soft)]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-white">
                                {
                                  reg.name
                                }
                              </p>

                              {reg.enrolled ? (
                                <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                                  ENROLLED 
                                </span>
                              ) : reg.attended ? (
                                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                                  ATTENDED
                                </span>
                              ) : null}

                              {!reg.enrolled &&
                                reg.applicationId && (
                                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                                    IN
                                    REQUESTS
                                  </span>
                                )}
                            </div>

                            <p className="mt-0.5 break-all text-xs text-[var(--theme-text-secondary)]">
                              {reg.phone}
                              {" · "}
                              {reg.email}
                            </p>
                          </div>

                          {canManageAttendance &&
                            eventHasStarted &&
                            !reg.attended && (
                              <button
                                onClick={() =>
                                  markAttended(
                                    event._id,
                                    reg._id
                                  )
                                }
                                disabled={
                                  actingId ===
                                  `${event._id}:${reg._id}`
                                }
                                className="flex items-center gap-1 rounded-full border border-blue-500/30 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                              >
                                <CheckCircle
                                  size={12}
                                />
                                Attended
                              </button>
                            )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--theme-text-secondary)]">
                    No registrations yet.
                  </p>
                )}

                <div className="mt-4 border-t border-[var(--theme-border)] pt-4 text-xs text-[var(--theme-text-secondary)]">
                  <span>
                    Public link:{" "}
                  </span>

                  <code className="break-all rounded bg-[var(--theme-surface-soft)] px-2 py-0.5">
                    {typeof window !==
                    "undefined"
                      ? window.location
                          .origin
                      : ""}
                    /trial/{event._id}
                  </code>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
