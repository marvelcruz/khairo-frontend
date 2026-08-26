"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeUp } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  light = false,
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial={false}
      animate="show"
      className={cn(
        "max-w-3xl",
        centered && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <motion.p
          variants={fadeUp}
          className="font-ui font-semibold text-[11px] uppercase tracking-[0.12em] text-magenta mb-3 sm:text-[13px] sm:mb-4"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        variants={fadeUp}
        className={cn(
          "font-display text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.08] mb-4 sm:mb-6",
          light ? "text-ink-black" : "text-pure-white"
        )}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className={cn(
            "text-base sm:text-lg leading-relaxed",
            light ? "text-ink-black/70" : "text-mist"
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
