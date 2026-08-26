import type { Metadata } from "next";
import { Check, X, Clock, Users, ShieldCheck, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { CTABand } from "@/components/sections/cta-band";
import { PricingSection } from "@/components/sections/pricing-section";

export const metadata: Metadata = {
  title: "The Program",
  description:
    "Everything included in the Khairo Diet Clinic weight-loss program — meal plans, medical oversight, community, and a week-by-week guide to your transformation.",
};

const WEEKS = [
  { week: "Weeks 1–2", title: "Foundation & Assessment", body: "Medical intake, baseline measurements, meal plan assignment, and community onboarding." },
  { week: "Weeks 3–4", title: "Metabolic Reset", body: "First dietary adjustments, establishing eating rhythms, understanding your hunger cues and hormones." },
  { week: "Weeks 5–6", title: "Momentum Phase", body: "Mid-program check-in, plan refinements, first measurable results, community accountability deepens." },
  { week: "Weeks 7–8", title: "Optimization", body: "Fine-tuning based on your body's response — adjustments to portions, timing, and movement recommendations." },
  { week: "Weeks 9–10", title: "Advanced Adaptation", body: "Addressing plateaus proactively, advanced nutrition strategies, emotional relationship with food work." },
  { week: "Weeks 11–12", title: "Sustain & Graduate", body: "Building the habits that outlast the program. Exit strategy, maintenance plan, and community graduation." },
];

const INCLUSIONS = [
  { item: "Personalized meal plan", khairo: true, typical: false },
  { item: "Medical oversight", khairo: true, typical: false },
  { item: "Women-only community", khairo: true, typical: false },
  { item: "Sustainable approach", khairo: true, typical: false },
  { item: "Biology-based guidance", khairo: true, typical: false },
  { item: "Weekly check-ins", khairo: true, typical: false },
  { item: "Real food — no shakes", khairo: true, typical: false },
];

const FOR_WHO = [
  "You've tried diets that worked temporarily but never stuck",
  "You want to understand why your body holds weight — not just fight it",
  "You're ready for medical-grade guidance without a hospital setting",
  "You want a community of women who genuinely get it",
  "You value evidence over trends",
];

const NOT_FOR = [
  "You want a quick fix or magic pill",
  "You're not willing to commit to 8–12 weeks",
  "You're looking for extreme calorie restriction",
  "You prefer working alone without community",
];

export default function ProgramPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] bg-ink-black flex items-end pb-12 pt-24 sm:pb-16 sm:pt-32 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-60" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-black/80" aria-hidden />
        <div
          className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-magenta/10 blur-[100px] pointer-events-none"
          aria-hidden
        />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta mb-4">
            The Khairo Diet Clinic Program
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,80px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6 max-w-3xl">
            A program built for how your body actually works.
          </h1>
          <p className="text-mist text-lg max-w-xl leading-relaxed">
            12 weeks. Medical supervision. Real food. A community that has your back.
          </p>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-charcoal py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <SectionHeader
              eyebrow="What's Included"
              title="Every plan comes with the essentials."
              centered={false}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: ShieldCheck, title: "Medical Supervision", body: "A health professional oversees your progress and adjusts your plan." },
              { icon: Clock, title: "Personalized Meal Plan", body: "Real food built around your preferences, budget, and goals." },
              { icon: Users, title: "Private Community", body: "A women-only group for accountability, motivation, and support." },
              { icon: TrendingUp, title: "Weekly Check-ins", body: "Regular reviews to track progress and make real-time adjustments." },
            ].map((item) => (
              <div key={item.title} className="bg-ink-black/50 border border-white/8 rounded-[1.5rem] p-6">
                <div className="w-10 h-10 rounded-xl bg-magenta/10 border border-magenta/20 flex items-center justify-center mb-4">
                  <item.icon size={20} className="text-magenta" aria-hidden />
                </div>
                <h3 className="font-display text-lg text-pure-white mb-2">{item.title}</h3>
                <p className="text-sm text-mist leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Week-by-week */}
      <section className="bg-ink-black py-14 sm:py-20 lg:py-28 relative">
        <div className="absolute inset-0 halftone opacity-40" aria-hidden />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <SectionHeader eyebrow="The Journey" title="12 weeks. Step by step." />
          </div>
          <div className="relative max-w-[760px] mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-magenta via-magenta/30 to-transparent" aria-hidden />
            <div className="space-y-8">
              {WEEKS.map((w, i) => (
                <div key={w.week} className="pl-16 relative">
                  <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-magenta border-4 border-ink-black flex items-center justify-center" aria-hidden>
                    <span className="font-ui font-bold text-xs text-pure-white">{i + 1}</span>
                  </div>
                  <p className="font-ui text-xs uppercase tracking-widest text-magenta mb-1">{w.week}</p>
                  <h3 className="font-display text-xl text-pure-white mb-2">{w.title}</h3>
                  <p className="text-mist text-sm leading-relaxed">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-off-white py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <SectionHeader eyebrow="The Difference" title="Khairo Diet Clinic vs. the typical diet." light />
          </div>
          <div className="max-w-[600px] mx-auto">
            <div className="rounded-[1.5rem] overflow-hidden border border-black/8">
              <div className="grid grid-cols-3 bg-ink-black text-pure-white">
                <div className="p-4 font-ui font-bold text-sm uppercase tracking-wider col-span-1">Feature</div>
                <div className="p-4 font-ui font-bold text-sm uppercase tracking-wider text-center text-magenta">Khairo Diet Clinic</div>
                <div className="p-4 font-ui font-bold text-sm uppercase tracking-wider text-center text-mist">Typical Diet</div>
              </div>
              {INCLUSIONS.map((row, i) => (
                <div key={row.item} className={`grid grid-cols-3 border-t border-black/8 ${i % 2 === 0 ? "bg-pure-white" : "bg-off-white"}`}>
                  <div className="p-4 text-sm text-ink-black/80">{row.item}</div>
                  <div className="p-4 flex items-center justify-center">
                    <Check size={18} className="text-mint-signal" aria-label="Included in Khairo Diet Clinic" />
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <X size={18} className="text-rose-400" aria-label="Not in typical diet" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-charcoal py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <p className="font-ui text-xs uppercase tracking-widest text-mint-signal mb-4">This is for you if…</p>
              <ul className="space-y-3">
                {FOR_WHO.map((item) => (
                  <li key={item} className="flex flex-wrap items-start gap-3">
                    <Check size={18} className="text-mint-signal mt-0.5 shrink-0" aria-hidden />
                    <span className="text-mist text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-ui text-xs uppercase tracking-widest text-rose-400 mb-4">This might not be for you if…</p>
              <ul className="space-y-3">
                {NOT_FOR.map((item) => (
                  <li key={item} className="flex flex-wrap items-start gap-3">
                    <X size={18} className="text-rose-400 mt-0.5 shrink-0" aria-hidden />
                    <span className="text-mist/60 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />
      <CTABand />
    </>
  );
}
