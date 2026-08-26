"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { cmsNumber, cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const TESTIMONIALS = [
  {
    quote:
      "I finally stopped seeing food as something to earn. Down 9kg and I actually feel free.",
    name: "Aisha O.",
    tag: "Core Program · 12 weeks",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507152927179-bc4ebfef7103?w=100&q=80&auto=format",
  },
  {
    quote:
      "The group is everything. On the days I wanted to quit, they showed up for me. I've never had that in a fitness program before.",
    name: "Ngozi A.",
    tag: "Plus Program · 8 weeks",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1569925444984-9e2e5fc3d1fb?w=100&q=80&auto=format",
  },
  {
    quote:
      "Medically guided made all the difference — it felt safe, not extreme. I lost 7kg without starving myself once.",
    name: "Funke B.",
    tag: "VIP Program · 10 weeks",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=100&q=80&auto=format",
  },
  {
    quote:
      "The meal plans are actually delicious. I didn't feel like I was dieting at all, just eating better.",
    name: "Adaeze K.",
    tag: "Core Program · 10 weeks",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1603503363848-6952525df449?w=100&q=80&auto=format",
  },
];

export function TestimonialsSection() {
  const content = useWebsiteContent();
  const testimonials = TESTIMONIALS.map((testimonial, index) => ({
    ...testimonial,
    quote: cmsText(content, `testimonial-${index + 1}-quote`, testimonial.quote),
    name: cmsText(content, `testimonial-${index + 1}-name`, testimonial.name),
    tag: cmsText(content, `testimonial-${index + 1}-tag`, testimonial.tag),
    rating: cmsNumber(content, `testimonial-${index + 1}-rating`, testimonial.rating),
    avatar: cmsText(content, `testimonial-${index + 1}-avatar`, testimonial.avatar),
  }));
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, [paused, testimonials.length]);

  return (
    <section
      className="bg-charcoal py-16 sm:py-20 lg:py-32 relative overflow-hidden"
      aria-label="Customer testimonials"
    >
      <div className="absolute inset-0 halftone opacity-40 pointer-events-none" aria-hidden />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-14">
          <SectionHeader
            eyebrow={cmsText(content, "testimonials-eyebrow", "What They Say")}
            title={cmsText(content, "testimonials-title", "700+ women.<br/>One community.")}
          />
        </div>

        {/* Desktop: 3-up */}
        <div className="hidden lg:grid grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>

        {/* Mobile/tablet: single */}
        <div
          className="lg:hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <TestimonialCard testimonial={testimonials[current]} index={0} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div
            className="flex flex-wrap justify-center gap-2 mt-6"
            role="tablist"
            aria-label="Testimonial navigation"
          >
            {testimonials.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-2 bg-emerald-600" : "w-2 h-2 bg-white/20"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-ink-black border border-white/8 rounded-[1.5rem_1.5rem_1.5rem_0.25rem] p-7 flex flex-col gap-5"
    >
      {/* Stars */}
      <div className="flex flex-wrap items-center gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={15}
            className={
              i < testimonial.rating
                ? "text-gold-trust fill-gold-trust"
                : "text-white/20"
            }
            aria-hidden
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-pure-white/90 leading-relaxed text-[0.95rem] flex-1">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/8">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-charcoal shrink-0 relative">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-ui font-semibold text-sm text-pure-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-mist/70">{testimonial.tag}</p>
        </div>
      </div>
    </motion.div>
  );
}
