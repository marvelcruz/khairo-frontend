"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Ruler } from "lucide-react";
import { api } from "../../lib/api";

type Measurement = {
  _id: string;
  date: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  thighCm?: number;
  energy?: number;
  sleep?: number;
  mobility?: number;
  confidence?: number;
  notes?: string;
};

const SCORE_LABELS = [
  "Very low",
  "Low",
  "Okay",
  "Good",
  "Excellent",
];

export function MeasurementsPanel() {
  const [
    measurements,
    setMeasurements,
  ] = useState<Measurement[]>(
    []
  );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      waistCm: "",
      hipsCm: "",
      chestCm: "",
      thighCm: "",
      energy: "3",
      sleep: "3",
      mobility: "3",
      confidence: "3",
      notes: "",
    });

  const load =
    useCallback(async () => {
      try {
        const response =
          await api.get<{
            measurements:
              Measurement[];
          }>(
            "/client-experience/measurements",
            true
          );

        setMeasurements(
          response.measurements ||
            []
        );
      } catch {
      }
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (
    event:
      React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.post(
        "/client-experience/measurements",
        form,
        true
      );

      setForm({
        waistCm: "",
        hipsCm: "",
        chestCm: "",
        thighCm: "",
        energy: "3",
        sleep: "3",
        mobility: "3",
        confidence: "3",
        notes: "",
      });

      setMessage(
        "Progress update saved."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your update."
      );
    } finally {
      setSaving(false);
    }
  };

  const latest =
    measurements[0];

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6 lg:p-7">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
          <Ruler size={18} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
            Beyond the scale
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Measurements & how you feel
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Weight is only one part of progress. Measurements and how you feel can help show changes the scale may miss.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.85fr]">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/8 bg-black/20 p-4 sm:p-5"
        >
          <p className="font-semibold text-white">
            Add a progress update
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["waistCm", "Waist (cm)"],
              ["hipsCm", "Hips (cm)"],
              ["chestCm", "Chest (cm)"],
              ["thighCm", "Thigh (cm)"],
            ].map(
              ([key, label]) => (
                <label key={key}>
                  <span className="mb-1.5 block text-xs text-zinc-500">
                    {label}
                  </span>

                  <input
                    type="number"
                    step="0.1"
                    value={
                      form[
                        key as keyof typeof form
                      ]
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]:
                          e.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-[#0d9488]"
                  />
                </label>
              )
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["energy", "Energy"],
              ["sleep", "Sleep"],
              [
                "mobility",
                "Mobility",
              ],
              [
                "confidence",
                "Confidence",
              ],
            ].map(
              ([key, label]) => (
                <label key={key}>
                  <span className="mb-1.5 block text-xs text-zinc-500">
                    {label}
                  </span>

                  <select
                    value={
                      form[
                        key as keyof typeof form
                      ]
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]:
                          e.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-sm text-white outline-none focus:border-[#0d9488]"
                  >
                    {SCORE_LABELS.map(
                      (
                        text,
                        index
                      ) => (
                        <option
                          key={
                            text
                          }
                          value={
                            index +
                            1
                          }
                        >
                          {index +
                            1}{" "}
                          — {text}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )
            )}
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs text-zinc-500">
              Anything else you noticed?
            </span>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target.value,
                })
              }
              placeholder="Clothes fit differently, more energy, easier movement..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[var(--theme-page)] px-3.5 py-3 text-sm text-white outline-none focus:border-[#0d9488]"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-400">
              {message}
            </p>
          )}

          <button
            disabled={saving}
            className="mt-4 h-11 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save progress update"}
          </button>
        </form>

        <div>
          <p className="font-semibold text-white">
            Recent updates
          </p>

          {!latest ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-7 text-center">
              <p className="text-sm text-zinc-500">
                Your first update will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {measurements
                .slice(0, 5)
                .map(
                  (item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-white/8 bg-black/20 p-4"
                    >
                      <p className="text-xs text-zinc-600">
                        {new Date(
                          item.date
                        ).toLocaleDateString()}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {typeof item.waistCm ===
                          "number" && (
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                            Waist{" "}
                            {
                              item.waistCm
                            }{" "}
                            cm
                          </span>
                        )}

                        {typeof item.hipsCm ===
                          "number" && (
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                            Hips{" "}
                            {
                              item.hipsCm
                            }{" "}
                            cm
                          </span>
                        )}

                        {typeof item.energy ===
                          "number" && (
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                            Energy{" "}
                            {
                              item.energy
                            }
                            /5
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                          {
                            item.notes
                          }
                        </p>
                      )}
                    </div>
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
