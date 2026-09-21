"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroVideo } from "@/components/home/hero-video";
import { HomeSmoothScroll } from "@/components/home/home-smooth-scroll";
import { homepageConfig } from "@/config/homepage";

export function StandardHomepage() {
  const [selectedGoal, setSelectedGoal] = useState(0);
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  useEffect(() => {
    if (openCategory === null) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenCategory(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCategory]);

  const goal = homepageConfig.discovery.goals[selectedGoal];
  const category = openCategory === null ? null : homepageConfig.categories[openCategory];

  return (
    <main
      style={{
        "--home-bg": homepageConfig.theme.background,
        "--home-surface": homepageConfig.theme.surface,
        "--home-text": homepageConfig.theme.text,
        "--home-muted": homepageConfig.theme.muted,
        "--home-accent": homepageConfig.theme.accent,
        "--home-accent-text": homepageConfig.theme.accentText,
      } as React.CSSProperties}
      className="bg-[var(--home-bg)] text-[var(--home-text)]"
    >
      <HomeSmoothScroll />

      <section className="relative min-h-[100dvh] overflow-hidden">
        <div className="sticky top-0 h-[100dvh] min-h-[620px]">
          <HeroVideo video={homepageConfig.hero.video} />
          <div className="relative z-10 mx-auto flex h-full max-w-[1440px] items-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:items-center lg:px-12 lg:pb-0">
            <div className="max-w-3xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--home-accent)]">{homepageConfig.hero.eyebrow}</p>
              <h1 className="max-w-4xl text-balance text-[clamp(3rem,8vw,7.75rem)] font-semibold leading-[0.9] tracking-[-0.055em]">{homepageConfig.hero.headline}</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--home-muted)] sm:text-lg sm:leading-8">{homepageConfig.hero.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={homepageConfig.primaryCta.href} className="inline-flex min-h-12 items-center rounded-full bg-[var(--home-accent)] px-6 text-sm font-semibold text-[var(--home-accent-text)]">{homepageConfig.primaryCta.label}</Link>
                <Link href={homepageConfig.hero.secondaryHref} className="inline-flex min-h-12 items-center rounded-full border border-white/25 bg-black/10 px-6 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/10">{homepageConfig.hero.secondaryLabel}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--home-accent)]">{homepageConfig.discovery.eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{homepageConfig.discovery.title}</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--home-muted)] sm:text-base">{homepageConfig.discovery.description}</p>
          </div>
          <div>
            <div className="grid gap-2 sm:grid-cols-2">
              {homepageConfig.discovery.goals.map((item, index) => (
                <button key={item.label} type="button" onClick={() => setSelectedGoal(index)} aria-pressed={selectedGoal === index} className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all ${selectedGoal === index ? "border-[var(--home-accent)] bg-[var(--home-accent)] text-[var(--home-accent-text)]" : "border-white/10 bg-white/[0.035] hover:border-white/25"}`}>{item.label}</button>
              ))}
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-[var(--home-surface)] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--home-accent)]">Recommended next step</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{goal.label}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--home-muted)] sm:text-base">{goal.description}</p>
              <Link href={goal.href} className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">View this pathway</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--home-accent)]">SERVICES</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Explore without losing your place.</h2></div>
            <p className="max-w-md text-sm leading-7 text-[var(--home-muted)]">Open a quick view for each category, then continue browsing the homepage when you are ready.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {homepageConfig.categories.map((item, index) => (
              <button key={item.title} type="button" onClick={() => setOpenCategory(index)} className="min-h-64 rounded-[2rem] border border-white/10 bg-[var(--home-surface)] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/25 sm:p-9">
                <div className="flex h-full flex-col justify-between gap-10"><p className="text-xs font-semibold tracking-[0.24em] text-[var(--home-accent)]">{item.eyebrow}</p><div><h3 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{item.title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[var(--home-muted)] sm:text-base">{item.description}</p><span className="mt-6 inline-flex text-sm font-semibold">Quick view</span></div></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[var(--home-surface)] py-20 sm:py-24">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--home-accent)]">READY WHEN YOU ARE</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Make the next step simple.</h2></div>
          <Link href={homepageConfig.primaryCta.href} className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[var(--home-accent)] px-7 text-sm font-semibold text-[var(--home-accent-text)]">{homepageConfig.primaryCta.label}</Link>
        </div>
      </section>

      {category ? (
        <div className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setOpenCategory(null)}>
          <aside role="dialog" aria-modal="true" aria-label={category.title} className="absolute bottom-0 right-0 top-0 w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[var(--home-surface)] p-6 shadow-2xl sm:p-10">
            <div className="flex items-start justify-between gap-6"><div><p className="text-xs font-semibold tracking-[0.24em] text-[var(--home-accent)]">{category.eyebrow}</p><h3 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{category.title}</h3></div><button type="button" onClick={() => setOpenCategory(null)} className="min-h-11 rounded-full border border-white/15 px-4 text-sm hover:bg-white/10" aria-label="Close quick view">Close</button></div>
            <p className="mt-8 text-base leading-8 text-[var(--home-muted)]">{category.description}</p>
            <Link href={category.href} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[var(--home-accent)] px-6 text-sm font-semibold text-[var(--home-accent-text)]">Explore {category.title}</Link>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
