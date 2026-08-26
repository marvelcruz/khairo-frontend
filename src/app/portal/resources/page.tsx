"use client";

import {
  BookOpen,
} from "lucide-react";

const RESOURCES = [
  {
    title:
      "Eating out without losing momentum",
    category:
      "Everyday life",
    body:
      "Choose the option that best matches your plan, keep portions intentional, prioritise protein and vegetables where appropriate, and return to your normal routine at the next meal rather than treating one meal as a setback.",
  },
  {
    title:
      "Travelling during your program",
    category: "Travel",
    body:
      "Plan the basics before you leave: meals you can reliably choose, water, movement, any Khairo Diet Clinic supplies you need, and how you will complete your normal check-in while away.",
  },
  {
    title:
      "When progress feels slow",
    category:
      "Progress",
    body:
      "Look beyond a single scale reading. Review consistency, measurements, progress photos, how clothes fit, energy and mobility. Use your weekly check-in to tell your coach what has changed.",
  },
  {
    title:
      "Getting the best progress photos",
    category:
      "Progress photos",
    body:
      "Use similar lighting, clothing, distance and camera position. Front, side and back views taken consistently every two weeks make visual changes easier to compare.",
  },
  {
    title:
      "Preparing for your weekly check-in",
    category:
      "Check-ins",
    body:
      "Use your official weekly weight and briefly note your wins, challenges and anything your coach should know. The purpose is to help your team support you, not to achieve a perfect week.",
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[#0d9488]">
          <BookOpen
            size={18}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.15em]">
            Resources
          </p>
        </div>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Khairo Diet Clinic help for real life
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Short, practical guidance for common situations during your program.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        {RESOURCES.map(
          (resource) => (
            <details
              key={
                resource.title
              }
              className="group rounded-2xl border border-white/10 bg-[var(--theme-surface)]"
            >
              <summary className="cursor-pointer list-none p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0d9488]">
                  {
                    resource.category
                  }
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {
                    resource.title
                  }
                </h2>

                <p className="mt-2 text-xs text-zinc-600">
                  Tap to read
                </p>
              </summary>

              <div className="border-t border-white/8 px-5 pb-6 pt-4 sm:px-6">
                <p className="text-sm leading-7 text-zinc-400">
                  {
                    resource.body
                  }
                </p>
              </div>
            </details>
          )
        )}
      </div>
    </div>
  );
}
