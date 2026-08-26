"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/section-header";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const STEPS = [
  {
    number: "01",
    title: "Apply",
    body: "Tell us about your goals in a 2-minute application. No pressure, no judgment.",
    image:
      "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=800&q=85&auto=format",
    imageAlt: "Black woman smiling while using her phone to apply",
  },
  {
    number: "02",
    title: "Assessment",
    body: "A medically guided review of where you are and what your body needs.",
    image:
      "https://images.unsplash.com/photo-1758526214005-acd3ec7560e2?w=800&q=85&auto=format",
    imageAlt: "Two Black women in a wellness consultation",
  },
  {
    number: "03",
    title: "Your Plan + Your People",
    body: "Get your personalized meal plan and join the private support group the same week.",
    image:
      "https://images.unsplash.com/photo-1575467678950-0c09aad418af?w=800&q=85&auto=format",
    imageAlt: "Black woman preparing a healthy meal",
  },
  {
    number: "04",
    title: "Track & Transform",
    body: "Weekly check-ins, real adjustments, and a community cheering you on.",
    image:
      "https://images.unsplash.com/photo-1631899560971-394ded28a80f?w=800&q=85&auto=format",
    imageAlt: "Black woman running and tracking her progress",
  },
];

export function HowItWorksSection() {
  const content = useWebsiteContent();
  const steps = STEPS.map((step, index) => ({
    ...step,
    title: cmsText(content, `how-step-${index + 1}-title`, step.title),
    body: cmsText(content, `how-step-${index + 1}-body`, step.body),
    image: cmsText(content, `how-step-${index + 1}-image`, step.image),
    imageAlt: cmsText(content, `how-step-${index + 1}-image-alt`, step.imageAlt),
  }));

  return (
    <section
      className="bg-off-white py-16 sm:py-20 lg:py-32 overflow-hidden"
      aria-label="How KhairoDietClinic works"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-16">
          <SectionHeader
            eyebrow={cmsText(content, "how-eyebrow", "The Process")}
            title={cmsText(content, "how-title", "How it works")}
            subtitle={cmsText(content, "how-subtitle", "Four simple steps between you and a body that feels like home.")}
            light
          />
        </div>

        {/* Desktop: alternating layout */}
        <div className="hidden lg:block space-y-24">
          {steps.map((step, i) => (
            <StepRow key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          {/* Timeline line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-magenta via-magenta/50 to-transparent"
            aria-hidden
          />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="pl-16 relative"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Node */}
                <div
                  className="absolute left-0 top-0 w-10 h-10 rounded-full bg-magenta border-4 border-off-white flex items-center justify-center"
                  aria-hidden
                >
                  <span className="font-ui font-bold text-xs text-pure-white">
                    {i + 1}
                  </span>
                </div>

                <div className="rounded-[1.5rem] overflow-hidden aspect-video mb-4 relative">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 0"
                  />
                </div>

                <span className="font-display text-5xl text-magenta/20 leading-none block mb-2">
                  {step.number}
                </span>
                <h3 className="font-display text-2xl text-ink-black mb-2">
                  {step.title}
                </h3>
                <p className="text-ink-black/70 leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepRow({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      className={`grid grid-cols-2 gap-16 items-center ${isEven ? "" : ""}`}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image */}
      <div className={isEven ? "order-1" : "order-2"}>
        <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/3] glow-magenta">
          <Image
            src={step.image}
            alt={step.imageAlt}
            fill
            className="object-cover"
            sizes="50vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-tr from-ink-black/30 to-transparent"
            aria-hidden
          />
        </div>
      </div>

      {/* Content */}
      <div className={isEven ? "order-2" : "order-1"}>
        <span
          className="font-display text-[7rem] leading-none text-ink-black/10 block mb-2 select-none"
          aria-hidden
        >
          {step.number}
        </span>
        <h3 className="font-display text-[2rem] text-ink-black mb-4 -mt-6">
          {step.title}
        </h3>
        <p className="text-[1.1rem] text-ink-black/70 leading-relaxed max-w-sm">
          {step.body}
        </p>
        {/* Accent line */}
        <div
          className="w-12 h-1 bg-magenta rounded-full mt-6"
          aria-hidden
        />
      </div>
    </motion.div>
  );
}
