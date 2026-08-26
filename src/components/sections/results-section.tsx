"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck, TrendingDown } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeUp } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const RESULTS = [
  {
    name: "Chiamaka O.",
    stat: "Lost 11kg",
    period: "in 14 weeks",
    before: "https://images.unsplash.com/photo-1569925444984-9e2e5fc3d1fb?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1507152927179-bc4ebfef7103?w=400&q=80&auto=format",
    quote: "I finally feel confident in my own skin.",
  },
  {
    name: "Ngozi A.",
    stat: "Lost 8kg",
    period: "in 10 weeks",
    before: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1631899477678-9d3c5aeded2d?w=400&q=80&auto=format",
    quote: "The accountability group kept me going.",
  },
  {
    name: "Funke B.",
    stat: "Lost 6kg",
    period: "in 8 weeks",
    before: "https://images.unsplash.com/photo-1575467678950-0c09aad418af?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1603503363848-6952525df449?w=400&q=80&auto=format",
    quote: "Medical guidance made it feel safe and real.",
  },
];

export function ResultsSection() {
  const content = useWebsiteContent();
  const results = RESULTS.map((result, index) => ({
    ...result,
    name: cmsText(content, `results-${index + 1}-name`, result.name),
    stat: cmsText(content, `results-${index + 1}-stat`, result.stat),
    period: cmsText(content, `results-${index + 1}-period`, result.period),
    before: cmsText(content, `results-${index + 1}-before`, result.before),
    after: cmsText(content, `results-${index + 1}-after`, result.after),
    quote: cmsText(content, `results-${index + 1}-quote`, result.quote),
  }));

  return (
    <section
      className="bg-off-white py-16 sm:py-20 lg:py-32 overflow-hidden"
      aria-label="KhairoDietClinic results and transformations"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-14">
          <SectionHeader
            eyebrow={cmsText(content, "results-eyebrow", "Real Results")}
            title={cmsText(content, "results-title", "Real women. Real, lasting change.")}
            subtitle={cmsText(content, "results-subtitle", "Every story here is from a real woman in the program. Individual results vary.")}
            light
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial={false}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {results.map((result) => (
            <motion.article
              key={result.name}
              variants={fadeUp}
              className="bg-pure-white rounded-[1.5rem] overflow-hidden shadow-sm border border-black/5 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Before/After images */}
              <div className="grid grid-cols-2 gap-0.5 relative aspect-[4/3]">
                <div className="relative overflow-hidden">
                  <Image
                    src={result.before}
                    alt={`${result.name} before KhairoDietClinic program`}
                    fill
                    className="object-cover grayscale"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Before
                  </span>
                </div>
                <div className="relative overflow-hidden">
                  <Image
                    src={result.after}
                    alt={`${result.name} after KhairoDietClinic program`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                  <span className="absolute bottom-2 right-2 bg-magenta text-white text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full">
                    After
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                  <div>
                    <p className="font-ui font-semibold text-sm text-ink-black">
                      {result.name}
                    </p>
                    <p className="text-xs text-ink-black/50">{result.period}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 bg-mint-signal/10 border border-mint-signal/20 rounded-full px-3 py-1">
                    <TrendingDown size={13} className="text-mint-signal" aria-hidden />
                    <span className="font-ui font-bold text-sm text-mint-signal">
                      {result.stat}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-ink-black/65 italic leading-relaxed border-t border-black/6 pt-3">
                  &ldquo;{result.quote}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <BadgeCheck size={14} className="text-magenta" aria-hidden />
                  <span className="text-xs text-magenta font-ui font-medium uppercase tracking-wide">
                    Verified result
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <div className="text-center">
          <Button variant="primary" size="lg" magnetic href="/results">
            {cmsText(content, "results-button-label", "See More Transformations →")}
          </Button>
          <p className="text-xs text-ink-black/40 mt-4">
            {cmsText(content, "results-disclaimer", "Individual results vary. Results shown are from real program participants.")}
          </p>
        </div>
      </div>
    </section>
  );
}
