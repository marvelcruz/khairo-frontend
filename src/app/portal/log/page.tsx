"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { api } from "../../../lib/api";
import { ProfessionalConsistency } from "../../../components/portal/ProfessionalConsistency";
import { ProgressPhotos } from "../../../components/portal/ProgressPhotos";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DailyLog = {
  _id: string;
  logDate: string;
  weightKg?: number;
  calories?: number;
  waterMl?: number;
  steps?: number;
  workoutDone?: boolean;
};

function todayKey() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(
      d.getMonth() + 1
    ).padStart(2, "0"),
    String(d.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
}

export default function PortalProgressPage() {
  const {
    client,
    refresh,
  } = useClientAuth();

  const [logs, setLogs] =
    useState<DailyLog[]>([]);

  const [streak, setStreak] =
    useState(0);

  const [
    logWeightKg,
    setLogWeightKg,
  ] = useState("");

  const [
    logCalories,
    setLogCalories,
  ] = useState("");

  const [
    logWaterMl,
    setLogWaterMl,
  ] = useState("");

  const [
    logSteps,
    setLogSteps,
  ] = useState("");

  const [
    workoutDone,
    setWorkoutDone,
  ] = useState(false);

  const [
    dailySaving,
    setDailySaving,
  ] = useState(false);

  const [
    dailyError,
    setDailyError,
  ] = useState("");

  const [
    weeklyWeight,
    setWeeklyWeight,
  ] = useState("");

  const [
    weeklyNotes,
    setWeeklyNotes,
  ] = useState("");

  const [
    weeklySaving,
    setWeeklySaving,
  ] = useState(false);

  const [
    weeklyError,
    setWeeklyError,
  ] = useState("");

  const loadData =
    useCallback(async () => {
      try {
        const [
          logsResponse,
          streakResponse,
        ] = await Promise.all([
          api.get<{
            logs: DailyLog[];
          }>(
            "/client-portal/daily-logs?days=90",
            true
          ),
          api.get<{
            streak: number;
          }>(
            "/client-portal/streak",
            true
          ),
        ]);

        setLogs(
          logsResponse.logs || []
        );

        setStreak(
          streakResponse.streak || 0
        );
      } catch {
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const weightSeries =
    useMemo(
      () =>
        logs
          .filter(
            (log) =>
              typeof log.weightKg ===
              "number"
          )
          .map((log) => ({
            date: log.logDate,
            weightKg:
              log.weightKg as number,
          }))
          .sort((a, b) =>
            a.date.localeCompare(
              b.date
            )
          ),
      [logs]
    );

  const sevenDayAverage =
    useMemo(() => {
      if (!weightSeries.length) {
        return null;
      }

      const recent =
        weightSeries.slice(-7);

      return (
        recent.reduce(
          (sum, entry) =>
            sum + entry.weightKg,
          0
        ) / recent.length
      );
    }, [weightSeries]);

  if (!client) {
    return null;
  }

  const todayLog =
    logs.find(
      (log) =>
        log.logDate === todayKey()
    );

  const loggedDays = new Set(
    logs.map(
      (log) => log.logDate
    )
  );

  const heatmapDays: string[] =
    [];

  for (let i = 55; i >= 0; i--) {
    const date = new Date();
    date.setDate(
      date.getDate() - i
    );

    heatmapDays.push(
      [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-")
    );
  }

  const saveDaily = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setDailyError("");
    setDailySaving(true);

    try {
      await api.post(
        "/client-portal/daily-logs",
        {
          ...(logWeightKg && {
            weightKg:
              Number(
                logWeightKg
              ),
          }),
          ...(logCalories && {
            calories:
              Number(
                logCalories
              ),
          }),
          ...(logWaterMl && {
            waterMl:
              Number(
                logWaterMl
              ),
          }),
          ...(logSteps && {
            steps:
              Number(logSteps),
          }),
          workoutDone,
        },
        true
      );

      setLogWeightKg("");
      setLogCalories("");
      setLogWaterMl("");
      setLogSteps("");
      setWorkoutDone(false);

      await loadData();
    } catch (error) {
      setDailyError(
        error instanceof Error
          ? error.message
          : "Could not save today's tracking."
      );
    } finally {
      setDailySaving(false);
    }
  };

  const saveWeekly = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setWeeklyError("");
    setWeeklySaving(true);

    try {
      await api.post(
        "/client-portal/checkins",
        {
          weightKg:
            Number(
              weeklyWeight
            ),
          notes: weeklyNotes,
        },
        true
      );

      setWeeklyWeight("");
      setWeeklyNotes("");

      await refresh();
      await loadData();
    } catch (error) {
      setWeeklyError(
        error instanceof Error
          ? error.message
          : "Could not save your weekly check-in."
      );
    } finally {
      setWeeklySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Progress
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
          Track your progress
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Use daily tracking for
          everyday habits. Use your
          weekly check-in once a week
          for your official progress
          update.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
          <p className="text-xs text-zinc-500">
            Current check-in weight
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {typeof client.currentWeightKg ===
            "number"
              ? `${client.currentWeightKg.toFixed(
                  1
                )} kg`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
          <p className="text-xs text-zinc-500">
            Current tracking run
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {streak}{" "}
            <span className="text-sm font-normal text-zinc-500">
              day
              {streak === 1
                ? ""
                : "s"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
          <p className="text-xs text-zinc-500">
            7-day weight average
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {sevenDayAverage !==
            null
              ? `${sevenDayAverage.toFixed(
                  1
                )} kg`
              : "—"}
          </p>
        </div>
      </section>

      <ProfessionalConsistency />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section
          id="today-tracking"
          className="scroll-mt-24 rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Daily
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {todayLog
                ? "Update today's tracking"
                : "Today's tracking"}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              A quick daily snapshot.
              Weight is optional here —
              use the weekly check-in
              below for your official
              weekly weight.
            </p>
          </div>

          <form
            onSubmit={saveDaily}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Weight, optional
              </span>

              <input
                type="number"
                step="0.1"
                value={
                  logWeightKg
                }
                onChange={(e) =>
                  setLogWeightKg(
                    e.target.value
                  )
                }
                placeholder="kg"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Water
              </span>

              <input
                type="number"
                value={logWaterMl}
                onChange={(e) =>
                  setLogWaterMl(
                    e.target.value
                  )
                }
                placeholder="ml"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Steps
              </span>

              <input
                type="number"
                value={logSteps}
                onChange={(e) =>
                  setLogSteps(
                    e.target.value
                  )
                }
                placeholder="Steps"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Calories, optional
              </span>

              <input
                type="number"
                value={
                  logCalories
                }
                onChange={(e) =>
                  setLogCalories(
                    e.target.value
                  )
                }
                placeholder="Calories"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-3.5 text-sm text-zinc-300 sm:col-span-2">
              <input
                type="checkbox"
                checked={
                  workoutDone
                }
                onChange={(e) =>
                  setWorkoutDone(
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-[#0d9488]"
              />

              I completed my
              workout today
            </label>

            {dailyError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 sm:col-span-2">
                {dailyError}
              </p>
            )}

            <button
              type="submit"
              disabled={
                dailySaving
              }
              className="h-11 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:bg-[#d90081] disabled:opacity-50 sm:col-span-2 sm:w-fit"
            >
              {dailySaving
                ? "Saving..."
                : todayLog
                ? "Update today"
                : "Save today's tracking"}
            </button>
          </form>
        </section>

        <section
          id="weekly-checkin"
          className="scroll-mt-24 rounded-2xl border border-[#0d9488]/15 bg-gradient-to-br from-zinc-900/70 to-[#0d9488]/5 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
            Weekly
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Weekly check-in
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Complete this once each
            week. This is the weight
            and reflection your coach
            uses to review your
            progress.
          </p>

          <form
            onSubmit={saveWeekly}
            className="mt-5 space-y-3"
          >
            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                Current check-in weight
              </span>

              <input
                required
                type="number"
                step="0.1"
                value={
                  weeklyWeight
                }
                onChange={(e) =>
                  setWeeklyWeight(
                    e.target.value
                  )
                }
                placeholder="Weight in kg"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                How did your week go?
              </span>

              <textarea
                value={
                  weeklyNotes
                }
                onChange={(e) =>
                  setWeeklyNotes(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Wins, challenges or anything you want your coach to know..."
                className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            {weeklyError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {weeklyError}
              </p>
            )}

            <button
              type="submit"
              disabled={
                weeklySaving
              }
              className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {weeklySaving
                ? "Saving..."
                : "Submit weekly check-in"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Trend
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Weight progress
            </h2>
          </div>

          <span className="text-xs text-zinc-600">
            Based on logged
            weights
          </span>
        </div>

        {weightSeries.length ===
        0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm font-medium text-zinc-400">
              Your weight trend
              will appear here.
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Add your first
              weight to begin
              building your
              progress chart.
            </p>
          </div>
        ) : (
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={weightSeries}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.07)"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={(
                    date
                  ) =>
                    new Date(
                      date
                    ).toLocaleDateString(
                      undefined,
                      {
                        month:
                          "short",
                        day: "numeric",
                      }
                    )
                  }
                  stroke="rgba(255,255,255,0.35)"
                  fontSize={11}
                />

                <YAxis
                  domain={[
                    "auto",
                    "auto",
                  ]}
                  stroke="rgba(255,255,255,0.35)"
                  fontSize={11}
                  width={42}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "#18181b",
                    border:
                      "1px solid rgba(255,255,255,.1)",
                    borderRadius:
                      "12px",
                  }}
                  labelStyle={{
                    color: "#fff",
                  }}
                  formatter={(
                    value
                  ) => [
                    `${value ?? "—"} kg`,
                    "Weight",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">
            Consistency history
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Each highlighted
            square represents a
            day with tracking.
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {heatmapDays.map(
              (day) => (
                <div
                  key={day}
                  title={day}
                  className={`h-4 w-4 rounded ${
                    loggedDays.has(
                      day
                    )
                      ? "bg-[#0d9488]"
                      : "bg-white/8"
                  }`}
                />
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">
            Weekly check-in
            history
          </h2>

          <div className="mt-4 space-y-2">
            {!client.checkIns
              .length ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5">
                <p className="text-sm text-zinc-500">
                  No weekly
                  check-ins yet.
                </p>
              </div>
            ) : (
              [
                ...client.checkIns,
              ]
                .reverse()
                .slice(0, 6)
                .map(
                  (checkIn) => (
                    <div
                      key={
                        checkIn._id
                      }
                      className="flex items-center justify-between gap-4 rounded-xl bg-black/20 px-4 py-3"
                    >
                      <span className="text-xs text-zinc-500">
                        {new Date(
                          checkIn.date
                        ).toLocaleDateString()}
                      </span>

                      <span className="text-sm font-medium text-white">
                        {typeof checkIn.weightKg ===
                        "number"
                          ? `${checkIn.weightKg} kg`
                          : "—"}
                      </span>
                    </div>
                  )
                )
            )}
          </div>
        </div>
      </section>
      <ProgressPhotos />

    </div>
  );
}
