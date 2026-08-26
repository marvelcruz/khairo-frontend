"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeUp } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const TRUST_ITEMS = [
  { icon: CheckCircle, text: "700+ women helped" },
  { icon: CheckCircle, text: "Medically supervised" },
  { icon: CheckCircle, text: "Private women-only community" },
];

export function HeroSection() {
  const content = useWebsiteContent();
  const trustItems = TRUST_ITEMS.map((item, index) => ({
    ...item,
    text: cmsText(content, `hero-trust-${index + 1}`, item.text),
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const halftoneY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col bg-ink-black overflow-hidden"
      aria-label="Hero section"
    >
      {/* Halftone background with parallax */}
      <motion.div
        className="absolute inset-0 halftone pointer-events-none"
        style={{ y: halftoneY }}
        aria-hidden
      />

      {/* Magenta radial glow */}
      <div
        className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-magenta/10 blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDuration: "8s" }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col justify-center pt-24 pb-14 sm:pt-28 sm:pb-20 lg:pt-32">
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-6 items-center">
          {/* Left: copy */}
          <motion.div
            className="lg:col-span-7"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Eyebrow */}
            <motion.p
              variants={fadeUp}
              className="font-ui font-semibold text-[11px] sm:text-[13px] text-magenta uppercase tracking-[0.12em] mb-4 sm:mb-5 flex flex-wrap items-center gap-2 sm:gap-3"
            >
              <span className="w-8 h-px bg-magenta" aria-hidden />
              {cmsText(content, "hero-eyebrow", "Medically Supervised · Women Only")}
            </motion.p>

            {/* H1 */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-[clamp(34px,10.5vw,80px)] leading-[1.06] tracking-[-0.02em] text-pure-white mb-4 sm:mb-6"
            >
              {cmsText(content, "hero-heading-line1", "Movement is")}
              <br />
              {cmsText(content, "hero-heading-line2", "medicine —")}{" "}
              <em className="font-accent not-italic text-magenta">
                {cmsText(content, "hero-heading-emphasis", "not")}
              </em>
              <br />
              {cmsText(content, "hero-heading-line3", "a debt you pay")}
              <br />
              {cmsText(content, "hero-heading-line4", "for eating.")}
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-[1.1rem] text-mist leading-relaxed max-w-[520px] mb-7 sm:mb-10"
            >
              {cmsText(
                content,
                "hero-subheading",
                "A medically supervised weight-loss program built for women's biology — real meal plans, a private support community, and results that last. Over 700 women have already started."
              )}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-8 sm:mb-12"
            >
              <Button
                variant="primary"
                size="lg"
                magnetic
                href={cmsText(content, "hero-primary-link", "/pricing#apply")}
              >
                {cmsText(content, "hero-primary-label", "Start Your Journey")}{" "}
                <ArrowRight size={18} aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                href={cmsText(content, "hero-secondary-link", "/program")}
              >
                <Play size={16} aria-hidden />
                {cmsText(content, "hero-secondary-label", "See How It Works")}
              </Button>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:gap-x-6 sm:gap-y-3"
            >
              {trustItems.map((item) => (
                <span
                  key={item.text}
                  className="flex flex-wrap items-center gap-2 text-sm text-mist"
                >
                  <item.icon
                    size={15}
                    className="text-mint-signal shrink-0"
                    aria-hidden
                  />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: hero image */}
          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: imageY }}
          >
            <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/5] max-h-[620px] glow-magenta">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-black/60 via-transparent to-transparent z-10" aria-hidden />
              <Image
                src={cmsText(content, "hero-image", "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=900&q=85&auto=format")}
                alt={cmsText(content, "hero-image-alt", "Confident Black woman exercising in gym — KhairoDietClinic member")}
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
              />

              {/* Floating stat card */}
              <motion.div
                className="absolute bottom-6 left-6 z-20 bg-charcoal/90 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <p className="font-display text-3xl text-pure-white mb-0.5">
                  {cmsText(content, "hero-stat", "700+")}
                </p>
                <p className="text-xs text-mist font-ui uppercase tracking-wider">
                  {cmsText(content, "hero-stat-label", "Women transformed")}
                </p>
                <div className="mt-2 flex flex-wrap gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-gold-trust text-xs" aria-hidden>
                      
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-mist/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        aria-hidden
      >
        <span className="text-xs font-ui uppercase tracking-widest">Scroll</span>
        <motion.div
          className="w-px h-10 bg-gradient-to-b from-mist/50 to-transparent"
          animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
