"use client";

import {
  useEffect,
  useState,
} from "react";
import { Pill } from "lucide-react";
import { api } from "../../lib/api";

type Supplement = {
  _id: string;
  name: string;
  price?: number;
};

type RecordItem = {
  _id: string;
  quantity?: number;
  supplement?:
    | Supplement
    | null;
};

export function ClientSupplements() {
  const [
    records,
    setRecords,
  ] = useState<RecordItem[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response =
          await api.get<{
            records?:
              RecordItem[];
          }>(
            "/client-supplements",
            true
          );

        setRecords(
          response.records || []
        );
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
          <Pill size={18} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            My Plan
          </p>

          <h2 className="text-lg font-semibold text-white">
            My supplements
          </h2>
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-zinc-500">
          Loading supplements...
        </p>
      ) : !records.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5">
          <p className="text-sm text-zinc-400">
            No supplements are currently listed for you.
          </p>

          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Supplements assigned to your Khairo Diet Clinic plan will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {records.map(
            (record) => (
              <div
                key={record._id}
                className="rounded-xl border border-white/8 bg-black/20 p-4"
              >
                <p className="text-sm font-semibold text-zinc-200">
                  {record
                    .supplement
                    ?.name ||
                    "Supplement"}
                </p>

                {typeof record.quantity ===
                  "number" && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Quantity:{" "}
                    {
                      record.quantity
                    }
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
