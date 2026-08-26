"use client";

import { motion } from "framer-motion";
import {
  Stethoscope,
  UtensilsCrossed,
  Users,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { staggerContainer, fadeUp } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const PILLARS = [
  {
    icon: Stethoscope,
    title: "Medical Supervision",
    body: "Your program is overseen by a health professional, not generic advice off the internet.",
  },
  {
    icon: UtensilsCrossed,
    title: "Personalized Meal Plans",
    body: "Real food, built around your body, your goals, and your routine — no starvation, no fads.",
  },
  {
    icon: Users,
    title: "Accountability Group",
    body: "A private women-only community that keeps you consistent on the hard days.",
  },
  {
    icon: TrendingUp,
    title: "Proven Results",
    body: "Join 700+ women who've already changed their relationship with their bodies.",
  },
];

export function MethodSection() {
  const content = useWebsiteContent();
  const pillars = PILLARS.map((pillar, index) => ({
    ...pillar,
    title: cmsText(content, `method-pillar-${index + 1}-title`, pillar.title),
    body: cmsText(content, `method-pillar-${index + 1}-body`, pillar.body),
  }));

  return (
    <section
      className="bg-ink-black py-16 sm:py-20 lg:py-32 relative overflow-hidden"
      aria-label="The Khairo Diet Clinic Method"
    >
      {/* Halftone subtle */}
      <div className="absolute inset-0 halftone opacity-50 pointer-events-none" aria-hidden />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-14 lg:mb-16">
          <SectionHeader
            eyebrow={cmsText(content, "method-eyebrow", "The Khairo Diet Clinic Method")}
            title={cmsText(content, "method-title", "Four things working<br/>together. That's the difference.")}
            subtitle={cmsText(content, "method-subtitle", "This isn't a diet plan. It's a system built around your biology, your accountability, and your life.")}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial={false}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              variants={fadeUp}
              className="group relative bg-charcoal border border-white/8 rounded-[1.5rem] p-7 hover:-translate-y-2 transition-all duration-300 hover:border-magenta/30"
              style={{
                boxShadow: "0 0 0 0 rgba(236,0,140,0)",
              }}
              whileHover={{
                boxShadow: "0 0 40px 4px rgba(236,0,140,0.15)",
              }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-magenta/10 border border-magenta/20 flex items-center justify-center mb-5 group-hover:bg-magenta/20 transition-colors duration-300">
                <pillar.icon
                  size={22}
                  className="text-magenta"
                  aria-hidden
                />
              </div>

              {/* Number background */}
              <span
                className="absolute top-6 right-6 font-display text-6xl text-white/[0.04] leading-none select-none"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="font-display text-xl text-pure-white mb-3 leading-tight">
                {pillar.title}
              </h3>
              <p className="text-mist text-sm leading-relaxed">{pillar.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
