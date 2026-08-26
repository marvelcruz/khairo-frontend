"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

const FACTS = [
  {
    question: "Did you know that exercise produces a molecule that biologically quiets your hunger neurons?",
    caption:
      "It's called Lac-Phe. It explains why movement suppresses appetite in a way restriction never can. Movement is medicine — not a debt you pay for eating.",
    accent: "Lac-Phe",
  },
  {
    question: "Did you know muscle is metabolically active — it burns calories even while you sleep?",
    caption:
      "Building and maintaining lean muscle raises your resting metabolism, meaning your body becomes more efficient at burning energy 24/7. No gym required to start.",
    accent: "Lean Muscle",
  },
  {
    question: "Did you know sleep loss raises ghrelin, the hormone that makes you hungrier the next day?",
    caption:
      "Poor sleep is one of the most overlooked causes of weight gain in women. When you sleep better, your hunger hormones reset — making every other part of the plan easier.",
    accent: "Ghrelin",
  },
];

export function ScienceSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + FACTS.length) % FACTS.length);
  };

  return (
    <section
      className="bg-ink-black py-16 sm:py-20 lg:py-32 relative overflow-hidden"
      aria-label="Science facts from KhairoDietClinic"
    >
      {/* Heavy halftone */}
      <div className="absolute inset-0 halftone opacity-70 pointer-events-none" aria-hidden />

      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-emerald-600/8 blur-[120px] pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-14">
          <SectionHeader
            eyebrow="The Science"
            title="Biology-first. Always."
            subtitle="Understanding your body is the first step to working with it, not against it."
          />
        </div>

        {/* Speech bubble card carousel */}
        <div className="max-w-[720px] mx-auto">
          <div className="relative min-h-[280px] flex items-center">
            {/* Decorative "?" marks */}
            <span
              className="absolute -left-6 top-0 font-display text-[120px] text-emerald-600/[0.08] leading-none select-none pointer-events-none"
              aria-hidden
            >
              ?
            </span>
            <span
              className="absolute -left-2 bottom-4 font-display text-[60px] text-blush/[0.08] leading-none select-none pointer-events-none"
              aria-hidden
            >
              ?
            </span>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 60 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {/* Speech bubble */}
                <div className="bg-charcoal border border-emerald-600/20 rounded-[1.25rem_1.25rem_1.25rem_0.25rem] sm:rounded-[1.5rem_1.5rem_1.5rem_0.25rem] p-5 sm:p-8 md:p-10 mb-4 relative overflow-hidden">
                  {/* Glow bg */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-magenta/5 to-transparent pointer-events-none"
                    aria-hidden
                  />

                  <div className="flex flex-wrap items-start gap-4 mb-5 relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/15 border border-emerald-600/25 flex items-center justify-center shrink-0 mt-1">
                      <Lightbulb size={18} className="text-emerald-600" aria-hidden />
                    </div>
                    <p className="font-ui font-semibold text-xs uppercase tracking-widest text-emerald-600">
                      Did You Know?
                    </p>
                  </div>

                  <p className="font-display text-[clamp(20px,3vw,28px)] text-pure-white leading-[1.3] mb-4 relative">
                    {FACTS[current].question.replace(
                      FACTS[current].accent,
                      ""
                    ).split("——")[0]}
                    {FACTS[current].question.includes(FACTS[current].accent) && (
                      <strong className="text-emerald-600">{FACTS[current].accent}</strong>
                    )}
                  </p>

                  <p className="text-mist leading-relaxed text-sm md:text-base relative">
                    {FACTS[current].caption}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-3 items-center justify-between mt-4">
            {/* Dot nav */}
            <div className="flex items-center">
              <span className="text-xs tabular-nums text-mist/70 sm:hidden">
                {current + 1} / {FACTS.length}
              </span>
              <div className="hidden sm:flex flex-wrap items-center gap-2" role="tablist" aria-label="Fact navigation">
                {FACTS.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === current}
                    onClick={() => {
                      setDirection(i > current ? 1 : -1);
                      setCurrent(i);
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-6 h-2 bg-emerald-600"
                        : "w-2 h-2 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Go to fact ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Arrows */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-mist hover:text-pure-white hover:border-emerald-600 transition-all duration-200"
                aria-label="Previous fact"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-mist hover:text-pure-white hover:border-emerald-600 transition-all duration-200"
                aria-label="Next fact"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
