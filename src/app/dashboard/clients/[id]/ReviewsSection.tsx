"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../lib/api";
import { TrendingDown, TrendingUp, Calendar } from "lucide-react";

type Review = {
  _id: string;
  periodStart: string;
  periodEnd: string;
  weightChange: number;
  averageCalories: number;
  adherencePercent: number;
  totalWorkouts: number;
  daysLogged: number;
  summary: string;
  generatedAt: string;
};

export default function ReviewsSection({ clientId }: { clientId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReviews = useCallback(() => {
    api.get<{ reviews: Review[] }>(`/reviews/client/${clientId}`)
      .then((res) => setReviews(res.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/reviews/generate/${clientId}`, {});
      fetchReviews();
    } catch {
      alert("Could not generate review. Client may not have enough daily logs yet.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-xl font-bold text-white">30-Day Performance Reviews</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex flex-wrap items-center gap-2 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Review Now"}
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--theme-text-secondary)]">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-[var(--theme-text-secondary)] italic">No reviews generated yet. Click the button to calculate the last 30 days.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
              <div className="mb-3 flex flex-wrap gap-3 items-center justify-between border-b border-[var(--theme-border)] pb-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                  <Calendar size={14} />
                  {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                </div>
                <span className="text-xs text-[var(--theme-text-secondary)]">
                  Generated {new Date(r.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--theme-text-secondary)]">Weight Change</p>
                  <p className={`flex flex-wrap items-center gap-1 text-lg font-bold ${r.weightChange < 0 ? 'text-green-400' : r.weightChange > 0 ? 'text-red-400' : 'text-white'}`}>
                    {r.weightChange < 0 ? <TrendingDown size={16}/> : <TrendingUp size={16}/>}
                    {r.weightChange} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--theme-text-secondary)]">Avg Calories</p>
                  <p className="text-lg font-bold text-white">{r.averageCalories} kcal</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--theme-text-secondary)]">Adherence</p>
                  <p className="text-lg font-bold text-white">{r.adherencePercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--theme-text-secondary)]">Workouts</p>
                  <p className="text-lg font-bold text-white">{r.totalWorkouts} / {r.daysLogged} days</p>
                </div>
              </div>
              <p className="mt-4 rounded bg-[var(--theme-surface-soft)] p-3 text-sm text-[var(--theme-text)] italic">&ldquo;{r.summary}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
