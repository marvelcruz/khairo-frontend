"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL, staggerContainer, fadeUp } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

export function CTABand() {
  const content = useWebsiteContent();

  return (
    <section
      className="relative py-16 sm:py-20 lg:py-32 overflow-hidden"
      aria-label="Call to action"
    >
      {/* Gradient bg */}
      <div
        className="absolute inset-0 gradient-magenta"
        aria-hidden
      />
      {/* Halftone overlay */}
      <div
        className="absolute inset-0 halftone-white opacity-60"
        aria-hidden
      />
      {/* Animated gradient shift */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blush/30 via-transparent to-magenta-deep/30"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />

      <motion.div
        className="relative max-w-[900px] mx-auto px-4 sm:px-6 text-center"
        variants={staggerContainer}
        initial={false}
        animate="show"
      >
        <motion.p
          variants={fadeUp}
          className="font-ui font-semibold text-[13px] uppercase tracking-[0.12em] text-pure-white/70 mb-5"
        >
          {cmsText(content, "cta-eyebrow", "Your Time is Now")}
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-display text-[clamp(36px,5.5vw,72px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6"
        >
          {cmsText(content, "cta-title-line1", "Your last “first day”")}
          <br />
          {cmsText(content, "cta-title-line2", "starts here.")}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-lg text-pure-white/80 leading-relaxed mb-10 max-w-[520px] mx-auto"
        >
          {cmsText(content, "cta-body", "At Khairo Diet Clinic, we move beyond generic diets. We listen to your story, understand your body, and craft a science-backed nutrition plan that fits your life and delivers lasting results.")}
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="white"
            size="lg"
            magnetic
            href={cmsText(content, "cta-primary-link", "/pricing#apply")}
            className="font-bold"
          >
            {cmsText(content, "cta-primary-label", "Start Your Journey")}{" "}
            <ArrowRight size={18} aria-hidden />
          </Button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 px-5 sm:gap-2.5 sm:h-14 sm:px-8 rounded-[9999px] border-2 border-pure-white/40 text-pure-white font-ui font-semibold text-xs sm:text-sm uppercase tracking-wider hover:bg-pure-white/10 transition-all duration-200"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {cmsText(content, "cta-whatsapp-label", "Chat on WhatsApp")}
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
