"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { api } from "../../../lib/api";
import { ClientSupplements } from "../../../components/portal/ClientSupplements";

type ChecklistItem = {
  _id: string;
  text: string;
  period?:
    | "morning"
    | "afternoon"
    | "evening";
};

type Exercise = {
  _id?: string;
  text: string;
  reps?: string;
  duration?: string;
};

type TimetableDay = {
  dayNumber: number;
  items: ChecklistItem[];
  exercises?: Exercise[];
};

type DailyLog = {
  _id: string;
  logDate: string;
  completedMealItemIds?: string[];
};

function todayKey() {
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

function timing(
  startDate: string,
  cycleWeeks: number
) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const rawDay =
    Math.floor(
      (now.getTime() -
        start.getTime()) /
        86400000
    ) + 1;

  const totalDays =
    Math.max(
      1,
      cycleWeeks * 7
    );

  const day =
    Math.min(
      totalDays,
      Math.max(1, rawDay)
    );

  return {
    day,
    week: Math.min(
      cycleWeeks,
      Math.max(
        1,
        Math.ceil(day / 7)
      )
    ),
  };
}

export default function PortalPlanPage() {
  const { client } =
    useClientAuth();

  const [
    checkedMealItems,
    setCheckedMealItems,
  ] = useState<Set<string>>(
    new Set()
  );

  const [saving, setSaving] =
    useState(false);

  const [
    loadingToday,
    setLoadingToday,
  ] = useState(true);

  const loadToday =
    useCallback(async () => {
      setLoadingToday(true);

      try {
        const response =
          await api.get<{
            logs: DailyLog[];
          }>(
            "/client-portal/daily-logs?days=1",
            true
          );

        const current =
          response.logs.find(
            (log) =>
              log.logDate ===
              todayKey()
          );

        setCheckedMealItems(
          new Set(
            current?.completedMealItemIds ||
              []
          )
        );
      } catch {
      } finally {
        setLoadingToday(false);
      }
    }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  if (!client) {
    return null;
  }

  const portalClient =
    client as typeof client & {
      mealChecklist?: ChecklistItem[];
      mealTimetableMode?:
        | "weekly"
        | "full_cycle";
      mealTimetable?: TimetableDay[];
    };

  const currentTiming =
    timing(
      client.startDate,
      client.cycleWeeks
    );

  const mode =
    portalClient.mealTimetableMode ||
    "weekly";

  const timetable =
    portalClient.mealTimetable ||
    [];

  const planDayNumber =
    mode === "full_cycle"
      ? currentTiming.day
      : ((currentTiming.day -
          1) %
          7) +
        1;

  const todayPlan =
    timetable.find(
      (entry) =>
        entry.dayNumber ===
        planDayNumber
    );

  const mealChecklist =
    portalClient.mealChecklist ||
    [];

  const exercises =
    todayPlan?.exercises || [];

  const programName =
    client.program
      .charAt(0)
      .toUpperCase() +
    client.program.slice(1);

  const toggleMealItem =
    async (itemId: string) => {
      const next = new Set(
        checkedMealItems
      );

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      setCheckedMealItems(next);
      setSaving(true);

      try {
        await api.post(
          "/client-portal/daily-logs",
          {
            completedMealItemIds:
              Array.from(next),
          },
          true
        );
      } catch {
        setCheckedMealItems(
          checkedMealItems
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
            My Plan
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Today&apos;s plan
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {programName} Program
            {" · "}Week{" "}
            {currentTiming.week} of{" "}
            {client.cycleWeeks}
            {" · "}Day{" "}
            {currentTiming.day}
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-2 text-xs font-semibold text-[#0d9488]">
          Program day{" "}
          {currentTiming.day}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Nutrition
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              What&apos;s planned
              for today
            </h2>
          </div>

          {!todayPlan ||
          !todayPlan.items.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/15 p-6 sm:p-8">
              <p className="text-base font-medium text-zinc-300">
                Today&apos;s meal
                plan has not been
                added yet.
              </p>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
                You have not done
                anything wrong.
                Your Khairo Diet Clinic team
                will add your plan
                here when it is
                ready. Any coach
                guidance already
                available appears
                alongside this
                section.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {[
                "morning",
                "afternoon",
                "evening",
              ].map(
                (period) => {
                  const periodItems =
                    todayPlan.items.filter(
                      (item) =>
                        item.period ===
                        period
                    );

                  if (
                    !periodItems.length
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={period}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#0d9488]">
                        {period}
                      </p>

                      <div className="mt-2 space-y-2">
                        {periodItems.map(
                          (item) => (
                            <div
                              key={
                                item._id
                              }
                              className="rounded-xl border border-white/8 bg-black/20 px-4 py-3.5 text-sm leading-relaxed text-zinc-300"
                            >
                              {
                                item.text
                              }
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Coach Guidance
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Notes from your
              coach
            </h2>

            {client.mealPlanNotes ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                {
                  client.mealPlanNotes
                }
              </p>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4">
                <p className="text-sm text-zinc-500">
                  No coach note
                  has been added
                  yet.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Movement
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Today&apos;s
              exercises
            </h2>

            {!exercises.length ? (
              <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                No exercises have
                been assigned for
                today.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {exercises.map(
                  (
                    exercise,
                    index
                  ) => (
                    <div
                      key={
                        exercise._id ||
                        `${exercise.text}-${index}`
                      }
                      className="rounded-xl bg-black/20 p-4"
                    >
                      <p className="text-sm font-medium text-zinc-200">
                        {
                          exercise.text
                        }
                      </p>

                      {(exercise.reps ||
                        exercise.duration) && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {[
                            exercise.reps,
                            exercise.duration,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " · "
                            )}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {mealChecklist.length >
        0 && (
        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Daily Checklist
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Check off as you
              go
            </h2>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {mealChecklist.map(
              (item) => (
                <label
                  key={item._id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={checkedMealItems.has(
                      item._id
                    )}
                    disabled={
                      loadingToday ||
                      saving
                    }
                    onChange={() =>
                      void toggleMealItem(
                        item._id
                      )
                    }
                    className="h-4 w-4 accent-[#0d9488]"
                  />

                  <span>
                    {item.text}
                  </span>
                </label>
              )
            )}
          </div>
        </section>
      )}
      <ClientSupplements />

    </div>
  );
}
