"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { api } from "../../../lib/api";

type SessionItem = {
  _id: string;
  startsAt: string;
  sessionType: string;
  status:
    | "pending"
    | "confirmed"
    | "declined"
    | "completed"
    | "cancelled";
  zoomLink?: string;
};

const STATUS_STYLES: Record<
  string,
  string
> = {
  pending:
    "bg-amber-500/10 text-amber-400 border-amber-500/15",
  confirmed:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
  declined:
    "bg-red-500/10 text-red-400 border-red-500/15",
  completed:
    "bg-blue-500/10 text-blue-400 border-blue-500/15",
  cancelled:
    "bg-white/5 text-zinc-500 border-white/8",
};

function localToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

export default function PortalAppointmentsPage() {
  const { client } =
    useClientAuth();

  const [
    sessions,
    setSessions,
  ] = useState<SessionItem[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [
    preferredDate,
    setPreferredDate,
  ] = useState("");

  const [
    preferredTime,
    setPreferredTime,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [
    requesting,
    setRequesting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadSessions =
    useCallback(async () => {
      setLoading(true);

      try {
        const response =
          await api.get<{
            sessions: SessionItem[];
          }>(
            "/client-portal/sessions",
            true
          );

        setSessions(
          response.sessions || []
        );
      } catch {
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  if (!client) {
    return null;
  }

  const requestAppointment =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !preferredDate ||
        !preferredTime
      ) {
        return;
      }

      setError("");
      setSuccess("");
      setRequesting(true);

      try {
        await api.post(
          "/client-portal/sessions",
          {
            startsAt: new Date(
              `${preferredDate}T${preferredTime}`
            ).toISOString(),
            sessionType:
              "consultation",
            note,
          },
          true
        );

        setPreferredDate("");
        setPreferredTime("");
        setNote("");

        setSuccess(
          "Your preferred time has been sent. Your KhairoDietClinic team will confirm the appointment."
        );

        await loadSessions();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not send your appointment request."
        );
      } finally {
        setRequesting(false);
      }
    };

  const upcoming =
    sessions
      .filter(
        (session) =>
          new Date(
            session.startsAt
          ).getTime() >=
            Date.now() &&
          ![
            "cancelled",
            "declined",
            "completed",
          ].includes(
            session.status
          )
      )
      .sort(
        (a, b) =>
          +new Date(a.startsAt) -
          +new Date(b.startsAt)
      );

  const past =
    sessions
      .filter(
        (session) =>
          !upcoming.includes(
            session
          )
      )
      .sort(
        (a, b) =>
          +new Date(b.startsAt) -
          +new Date(a.startsAt)
      );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Appointments
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
          Your appointments
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          View upcoming sessions
          or request a preferred
          appointment time with
          your KhairoDietClinic team.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-2xl border border-[#0d9488]/15 bg-gradient-to-br from-zinc-900/70 to-[#0d9488]/5 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
            Request a Time
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            What works for you?
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Choose your preferred
            date and time. This is
            a request, not an
            instant booking. Your
            KhairoDietClinic team will
            confirm the final
            appointment.
          </p>

          <form
            onSubmit={
              requestAppointment
            }
            className="mt-5 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Preferred date
                </span>

                <input
                  type="date"
                  min={localToday()}
                  required
                  value={
                    preferredDate
                  }
                  onChange={(e) =>
                    setPreferredDate(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none [color-scheme:inherit] focus:border-[#0d9488]"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Preferred time
                </span>

                <input
                  type="time"
                  required
                  value={
                    preferredTime
                  }
                  onChange={(e) =>
                    setPreferredTime(
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none [color-scheme:inherit] focus:border-[#0d9488]"
                />
              </label>
            </div>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Anything you want
                to discuss?
              </span>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Optional note for your KhairoDietClinic team"
                className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm leading-relaxed text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={
                requesting ||
                !preferredDate ||
                !preferredTime
              }
              className="h-11 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:bg-[#d90081] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {requesting
                ? "Sending request..."
                : "Request this time"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Upcoming
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Your next sessions
              </h2>
            </div>

            {upcoming.length >
              0 && (
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-500">
                {upcoming.length}{" "}
                upcoming
              </span>
            )}
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-zinc-500">
              Loading your
              appointments...
            </p>
          ) : !upcoming.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-7 text-center">
              <p className="font-medium text-zinc-300">
                No upcoming
                appointment yet.
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                Request a preferred
                time and your
                KhairoDietClinic team will
                confirm the
                appointment with
                you.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {upcoming.map(
                (session) => (
                  <article
                    key={
                      session._id
                    }
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0d9488]">
                          {session.sessionType ||
                            "Appointment"}
                        </p>

                        <p className="mt-1 font-semibold text-white">
                          {new Date(
                            session.startsAt
                          ).toLocaleDateString(
                            undefined,
                            {
                              weekday:
                                "long",
                              month:
                                "long",
                              day: "numeric",
                            }
                          )}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {new Date(
                            session.startsAt
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "numeric",
                              minute:
                                "2-digit",
                            }
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
                            STATUS_STYLES[
                              session
                                .status
                            ] ||
                            STATUS_STYLES.cancelled
                          }`}
                        >
                          {
                            session.status
                          }
                        </span>

                        {session.zoomLink && (
                          <a
                            href={
                              session.zoomLink
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white"
                          >
                            Join session
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {past.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-[var(--theme-surface)]">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-zinc-400 sm:px-6">
            Previous appointments
            {" · "}
            {past.length}
          </summary>

          <div className="space-y-2 border-t border-white/8 p-5 sm:p-6">
            {past
              .slice(0, 12)
              .map(
                (session) => (
                  <div
                    key={
                      session._id
                    }
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 px-4 py-3"
                  >
                    <span className="text-sm text-zinc-500">
                      {new Date(
                        session.startsAt
                      ).toLocaleString()}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${
                        STATUS_STYLES[
                          session.status
                        ] ||
                        STATUS_STYLES.cancelled
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                )
              )}
          </div>
        </details>
      )}
    </div>
  );
}
