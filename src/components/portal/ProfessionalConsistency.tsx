"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../../lib/api";

type DailyLog = {
  _id: string;
  logDate: string;
};

function dateKey(
  date: Date
) {
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

export function ProfessionalConsistency() {
  const [logs, setLogs] =
    useState<DailyLog[]>([]);

  useEffect(() => {
    void api
      .get<{
        logs: DailyLog[];
      }>(
        "/client-portal/daily-logs?days=90",
        true
      )
      .then((response) =>
        setLogs(
          response.logs || []
        )
      )
      .catch(() => {});
  }, []);

  const metrics =
    useMemo(() => {
      const days =
        new Set(
          logs.map(
            (log) =>
              log.logDate
          )
        );

      const last7: string[] =
        [];

      const last30: string[] =
        [];

      for (
        let offset = 0;
        offset < 30;
        offset++
      ) {
        const d =
          new Date();

        d.setHours(
          0,
          0,
          0,
          0
        );

        d.setDate(
          d.getDate() -
            offset
        );

        const key =
          dateKey(d);

        last30.push(key);

        if (offset < 7) {
          last7.push(key);
        }
      }

      const sevenCount =
        last7.filter(
          (day) =>
            days.has(day)
        ).length;

      const thirtyCount =
        last30.filter(
          (day) =>
            days.has(day)
        ).length;

      // Today remains an open tracking day. If it has not been logged yet,
      // calculate the current run from yesterday rather than showing a false
      // streak break during the day.
      let consecutive = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOffset = days.has(dateKey(today)) ? 0 : 1;

      for (
        let offset = startOffset;
        offset < 90;
        offset++
      ) {
        const d =
          new Date();

        d.setHours(
          0,
          0,
          0,
          0
        );

        d.setDate(
          d.getDate() -
            offset
        );

        if (
          days.has(
            dateKey(d)
          )
        ) {
          consecutive++;
        } else {
          break;
        }
      }

      return {
        days,
        sevenCount,
        thirtyCount,
        sevenPct:
          Math.round(
            (sevenCount / 7) *
              100
          ),
        thirtyPct:
          Math.round(
            (thirtyCount /
              30) *
              100
          ),
        consecutive,
      };
    }, [logs]);

  const recent14 =
    Array.from({
      length: 14,
    }).map((_, index) => {
      const d =
        new Date();

      d.setHours(
        0,
        0,
        0,
        0
      );

      d.setDate(
        d.getDate() -
          (13 - index)
      );

      return {
        key: dateKey(d),
        day:
          d.toLocaleDateString(
            undefined,
            {
              weekday:
                "short",
            }
          )[0],
      };
    });

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          Consistency
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          Tracking consistency
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          A practical view of how consistently you are recording your daily progress. This is not a score of success or failure.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs text-zinc-500">
            Last 7 days
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              metrics.sevenPct
            }
            %
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {
              metrics.sevenCount
            }{" "}
            of 7 days tracked
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs text-zinc-500">
            Last 30 days
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              metrics.thirtyPct
            }
            %
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {
              metrics.thirtyCount
            }{" "}
            of 30 days tracked
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs text-zinc-500">
            Current tracking run
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              metrics.consecutive
            }
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            consecutive day
            {metrics.consecutive ===
            1
              ? ""
              : "s"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-zinc-500">
          Recent 14 days
        </p>

        <div className="mt-3 grid grid-cols-14 gap-1.5">
          {recent14.map(
            (item) => (
              <div
                key={
                  item.key
                }
                className="text-center"
              >
                <div
                  className={`mx-auto h-7 w-full max-w-8 rounded-md border ${
                    metrics.days.has(
                      item.key
                    )
                      ? "border-[#0d9488]/40 bg-[#0d9488]/25"
                      : "border-white/5 bg-white/[0.035]"
                  }`}
                  title={
                    item.key
                  }
                />

                <span className="mt-1 block text-[9px] text-zinc-700">
                  {
                    item.day
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
