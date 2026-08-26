"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const activityLabels: Record<string, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly active (1-3 days/week)",
  moderate: "Moderately active (3-5 days/week)",
  active: "Active (6-7 days/week)",
  veryActive: "Very active (physical job or intense training)",
};

export default function CalorieCalculatorPage() {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState(""); // in cm
  const [weight, setWeight] = useState(""); // in kg
  const [activity, setActivity] = useState("moderate");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (!ageNum || !heightNum || !weightNum) {
      alert("Please enter valid age, height and weight.");
      return;
    }

    let bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum;
    bmr += gender === "male" ? 5 : -161;

    const factor = activityFactors[activity as keyof typeof activityFactors] || 1.55;
    const tdee = Math.round(bmr * factor);

    setResult(tdee);
  };

  return (
    <main className="min-h-screen bg-[var(--theme-page)] px-4 py-6 text-white sm:px-6">
      <header className="mx-auto max-w-3xl">
        <Link href="/portal" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
          <ArrowLeft size={16} /> Back to portal
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Fitness &amp; Calorie Intake Calculator
        </h1>
        <p className="mt-2 text-zinc-400">
          Knowing your calorie need helps you estimate how much fuel your body needs daily. Use the calorie calculator to determine your calorie intake.
        </p>
      </header>

      <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-6 shadow-2xl sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488]"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Age (years)</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 35"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Height (cm)</span>
            <input
              type="number"
              inputMode="decimal"
              min="50"
              max="250"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 170"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Weight (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              min="20"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 70"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488]"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Activity level</span>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488]"
            >
              {Object.entries(activityLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={calculate}
          className="mt-8 h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
        >
          Calculate my Calorie Intake
        </button>

        {result !== null && (
          <div className="mt-8 rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-6 text-center">
            <p className="text-sm uppercase tracking-wider text-zinc-400">Estimated daily calories</p>
            <p className="mt-2 text-4xl font-bold text-white">{result} <span className="text-lg font-normal text-zinc-400">kcal/day</span></p>
            <p className="mt-3 text-sm text-zinc-400">
              This is an estimate based on the Mifflin‑St Jeor equation. Adjust based on your specific goals and medical advice.
            </p>
          </div>
        )}
      </section>

      <footer className="mx-auto mt-10 max-w-3xl text-center text-xs text-zinc-500">
        <p>Report any adverse drug reaction <Link href="/contact" className="text-[#0d9488] hover:underline">here</Link>.</p>
      </footer>
    </main>
  );
}
