"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/utils";

export function ManifestoSection() {
  return (
    <section className="bg-off-white py-16 sm:py-20 lg:py-32 overflow-hidden" aria-label="Anti-shame manifesto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          variants={staggerContainer}
          initial={false}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-[760px] mx-auto text-center"
        >
          {/* Pull quote */}
          <motion.blockquote
            variants={fadeUp}
            className="font-display text-[clamp(28px,4vw,52px)] leading-[1.12] text-ink-black mb-10 tracking-[-0.02em]"
          >
            &ldquo;You don&apos;t need{" "}
            <motion.em
              className="font-accent not-italic text-emerald-600"
              initial={false}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              another
            </motion.em>{" "}
            punishing diet. You need a plan that works{" "}
            <strong className="text-emerald-600">with</strong> your body.&rdquo;
          </motion.blockquote>

          {/* Divider */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <div className="flex-1 h-px bg-ink-black/15" aria-hidden />
            <div className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden />
            <div className="flex-1 h-px bg-ink-black/15" aria-hidden />
          </motion.div>

          {/* 2-col body */}
          <motion.div
            variants={fadeUp}
            className="grid md:grid-cols-2 gap-8 text-left"
          >
            <p className="text-[1.1rem] text-ink-black/75 leading-relaxed">
              Most programs treat weight loss as restriction and willpower. We
              treat it as biology. Your hormones, your hunger signals, your
              metabolism — they&apos;re not the enemy.
            </p>
            <p className="text-[1.1rem] text-ink-black/75 leading-relaxed">
              With medical supervision and a plan built around how women&apos;s
              bodies actually work, change stops feeling like a fight and starts
              feeling sustainable.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
