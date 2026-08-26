"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const STATS = [
  { value: 700, suffix: "+", label: "Women helped" },
  { value: 8.4, suffix: "kg", label: "Avg. loss in program" },
  { value: 12, suffix: "", label: "Week guided program" },
  { value: 94, suffix: "%", label: "Complete the program" },
];

export function StatBand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="bg-charcoal border-y border-white/8 py-10 sm:py-14 overflow-hidden relative"
      aria-label="Program statistics"
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-magenta/5 via-transparent to-blush/5 pointer-events-none"
        aria-hidden
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center text-center px-3 py-3 sm:px-6 sm:py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="relative mb-2">
                <span className="font-display text-[clamp(30px,9vw,64px)] text-pure-white leading-none">
                  {inView ? (
                    <AnimatedCounter
                      to={stat.value}
                      suffix={stat.suffix}
                      duration={1.6}
                    />
                  ) : (
                    `0${stat.suffix}`
                  )}
                </span>
                {/* Mint underline */}
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] bg-mint-signal rounded-full"
                  initial={{ width: 0 }}
                  animate={inView ? { width: 48 } : { width: 0 }}
                  transition={{ delay: i * 0.1 + 1.6, duration: 0.4 }}
                  aria-hidden
                />
              </div>
              <p className="font-ui text-[11px] sm:text-sm text-mist uppercase tracking-wider mt-2 sm:mt-3">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
