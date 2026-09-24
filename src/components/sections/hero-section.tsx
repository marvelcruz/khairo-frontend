"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const SCENES = [
  {
    eyebrow: "It starts with being heard",
    title: "Your body. Your story. Your plan.",
    copy: "Personal guidance built around your health, your culture and your real life.",
  },
  {
    eyebrow: "Food that still feels like home",
    title: "Eat well. Live fully.",
    copy: "Science-backed nutrition without punishing rules or giving up the foods you love.",
  },
  {
    eyebrow: "Women supporting women",
    title: "Progress feels better together.",
    copy: "Expert accountability and a private community that keeps you moving forward.",
  },
] as const;

const TRUST_ITEMS = ["700+ women helped", "Medically supervised", "Women-only community"];

export function HeroSection() {
  const content = useWebsiteContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scene, setScene] = useState(0);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateScene = () => setScene(Math.min(2, Math.floor(video.currentTime / 5.33)));
    const resumeWhenVisible = () => {
      if (!document.hidden) tryPlay();
    };

    video.addEventListener("timeupdate", updateScene);
    video.addEventListener("canplay", tryPlay);
    window.addEventListener("pageshow", tryPlay);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    tryPlay();

    return () => {
      video.removeEventListener("timeupdate", updateScene);
      video.removeEventListener("canplay", tryPlay);
      window.removeEventListener("pageshow", tryPlay);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, [tryPlay]);

  const active = SCENES[scene];

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#06100e] text-white" aria-label="Khairo introduction">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        poster="/media/khairo-journey-poster.webp"
        aria-hidden="true"
      >
        <source src="/media/khairo-journey-mobile.mp4" media="(max-width: 767px)" type="video/mp4" />
        <source src="/media/khairo-journey.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,10,8,.88)_0%,rgba(2,10,8,.58)_43%,rgba(2,10,8,.12)_72%,rgba(2,10,8,.35)_100%)] max-md:bg-[linear-gradient(180deg,rgba(2,10,8,.48)_0%,rgba(2,10,8,.20)_36%,rgba(2,10,8,.86)_77%,rgba(2,10,8,.96)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,transparent_0%,rgba(2,10,8,.08)_45%,rgba(2,10,8,.55)_100%)]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col justify-end px-5 pb-24 pt-28 sm:px-8 md:justify-center md:px-12 md:pb-24 lg:px-16">
        <div className="max-w-[680px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-4 flex items-center gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.22em] text-[#6ee7c7] sm:text-xs">
                <span className="h-px w-9 bg-[#6ee7c7]" aria-hidden="true" />
                {active.eyebrow}
              </p>
              <h1 className="max-w-[660px] font-display text-[clamp(3.1rem,8vw,6.8rem)] leading-[.9] tracking-[-.035em] !text-white [text-wrap:balance]">
                {active.title}
              </h1>
              <p className="mt-5 max-w-[540px] text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
                {active.copy}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="primary" size="lg" magnetic href={cmsText(content, "hero-primary-link", "/pricing#apply")}>
              {cmsText(content, "hero-primary-label", "Start Your Journey")} <ArrowRight size={18} aria-hidden />
            </Button>
            <Button variant="secondary" size="lg" href={cmsText(content, "hero-secondary-link", "/program")}>
              Explore the Khairo method
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/72 sm:text-sm">
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#6ee7c7]" aria-hidden="true" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-7 left-5 right-5 flex items-center gap-3 sm:left-8 sm:right-8 md:left-12 md:right-12 lg:left-16 lg:right-16" aria-label={`Story scene ${scene + 1} of 3`}>
          <span className="font-ui text-[10px] font-bold tracking-[.2em] text-white/55">0{scene + 1}</span>
          <div className="flex max-w-[260px] flex-1 gap-1.5">
            {SCENES.map((item, index) => (
              <span key={item.title} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
                <motion.span
                  className="block h-full origin-left bg-[#6ee7c7]"
                  initial={false}
                  animate={{ scaleX: index < scene ? 1 : index === scene ? 1 : 0 }}
                  transition={index === scene ? { duration: 5.1, ease: "linear" } : { duration: 0.2 }}
                />
              </span>
            ))}
          </div>
          <span className="font-ui text-[10px] font-bold uppercase tracking-[.18em] text-white/55">The Khairo journey</span>
        </div>
      </div>
    </section>
  );
}
