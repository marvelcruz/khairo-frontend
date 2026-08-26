"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/utils";

interface SpeechBubbleProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
  pointDirection?: "bottom-left" | "bottom-right" | "top-left";
}

const pointClasses = {
  "bottom-left": "rounded-[1.5rem_1.5rem_1.5rem_0.25rem]",
  "bottom-right": "rounded-[1.5rem_1.5rem_0.25rem_1.5rem]",
  "top-left": "rounded-[0.25rem_1.5rem_1.5rem_1.5rem]",
};

export function SpeechBubble({
  children,
  className,
  dark = true,
  delay = 0,
  pointDirection = "bottom-left",
}: SpeechBubbleProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      className={cn(
        "p-6 md:p-8",
        pointClasses[pointDirection],
        dark
          ? "bg-charcoal border border-white/10"
          : "bg-pure-white text-ink-black shadow-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
