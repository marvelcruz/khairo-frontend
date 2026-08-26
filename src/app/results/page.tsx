import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, TrendingDown, Star } from "lucide-react";
import { CTABand } from "@/components/sections/cta-band";
import { StatBand } from "@/components/sections/stat-band";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Real stories, real transformations. See how 700+ women have changed their lives with Khairo Diet Clinic's medically supervised weight-loss program.",
};

const STORIES = [
  {
    name: "Chiamaka O.",
    location: "Lagos",
    stat: "–11kg",
    weeks: "14 weeks",
    program: "Plus Program",
    stars: 5,
    story:
      "I had tried every diet imaginable. Keto, intermittent fasting, juice cleanses — I did them all and kept ending up back where I started, or worse. Khairo Diet Clinic was different because it explained the why. Understanding Lac-Phe and how my hunger hormones actually work changed everything. I stopped fighting my body and started working with it.",
    before: "https://images.unsplash.com/photo-1569925444984-9e2e5fc3d1fb?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=400&q=80&auto=format",
  },
  {
    name: "Ngozi A.",
    location: "Abuja",
    stat: "–8kg",
    weeks: "10 weeks",
    program: "Core Program",
    stars: 5,
    story:
      "The group changed everything for me. I'm not someone who usually does well with accountability — I thought I'd find it annoying. But these women became my people. On the days I wanted to give up, they showed up for me. That's what made the difference.",
    before: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1631899477678-9d3c5aeded2d?w=400&q=80&auto=format",
  },
  {
    name: "Funke B.",
    location: "Port Harcourt",
    stat: "–6kg",
    weeks: "8 weeks",
    program: "VIP Program",
    stars: 4,
    story:
      "As someone with a thyroid condition, I was always told weight loss would be harder for me. The medical supervision meant my plan was built around my specific health needs — not a template. It finally felt safe, not extreme.",
    before: "https://images.unsplash.com/photo-1575467678950-0c09aad418af?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1631899477678-9d3c5aeded2d?w=400&q=80&auto=format",
  },
  {
    name: "Adaeze K.",
    location: "Enugu",
    stat: "–9kg",
    weeks: "12 weeks",
    program: "Plus Program",
    stars: 5,
    story:
      "I didn't believe it was possible to enjoy what I was eating while losing weight. The meal plan used real Nigerian food — not the bland, foreign 'diet food' I was dreading. My family ate the same meals. Nobody noticed I was 'on a program.'",
    before: "https://images.unsplash.com/photo-1507152927179-bc4ebfef7103?w=400&q=80&auto=format",
    after: "https://images.unsplash.com/photo-1603503363848-6952525df449?w=400&q=80&auto=format",
  },
];

export default function ResultsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[55vh] bg-ink-black flex items-end pb-12 pt-24 sm:pb-16 sm:pt-32 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-60" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-black" aria-hidden />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta mb-4">
            Success Stories
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,80px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6">
            Real women.
            <br />
            Real, lasting change.
          </h1>
          <p className="text-mist text-lg max-w-xl leading-relaxed">
            Every story here is from a real woman in the Khairo Diet Clinic program.
            Individual results vary.
          </p>
        </div>
      </section>

      <StatBand />

      {/* Story cards */}
      <section className="bg-off-white py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
          {STORIES.map((story, i) => (
            <article
              key={story.name}
              className={`grid lg:grid-cols-2 gap-10 items-center ${
                i % 2 !== 0 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              {/* Images */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-[1.5rem] overflow-hidden aspect-[3/4]">
                  <Image
                    src={story.before}
                    alt={`${story.name} before`}
                    fill
                    className="object-cover grayscale"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-ui uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Before
                  </span>
                </div>
                <div className="relative rounded-[1.5rem] overflow-hidden aspect-[3/4]">
                  <Image
                    src={story.after}
                    alt={`${story.name} after`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute bottom-3 right-3 bg-magenta text-white text-[11px] font-ui uppercase tracking-wider px-2.5 py-1 rounded-full">
                    After
                  </span>
                </div>
              </div>

              {/* Story text */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="bg-mint-signal/10 border border-mint-signal/20 rounded-full px-4 py-1.5 flex flex-wrap items-center gap-2">
                    <TrendingDown size={15} className="text-mint-signal" aria-hidden />
                    <span className="font-ui font-bold text-lg text-mint-signal">{story.stat}</span>
                  </div>
                  <span className="text-sm text-ink-black/50">{story.weeks}</span>
                </div>

                <h2 className="font-display text-3xl text-ink-black mb-1">{story.name}</h2>
                <p className="text-sm text-ink-black/50 mb-2">{story.location} · {story.program}</p>

                <div className="flex flex-wrap items-center gap-0.5 mb-5" aria-label={`${story.stars} stars`}>
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={15}
                      className={j < story.stars ? "text-gold-trust fill-gold-trust" : "text-black/15"}
                      aria-hidden
                    />
                  ))}
                </div>

                <blockquote className="text-ink-black/75 leading-relaxed text-[1.05rem] border-l-4 border-magenta pl-5 mb-5">
                  &ldquo;{story.story}&rdquo;
                </blockquote>

                <div className="flex flex-wrap items-center gap-2">
                  <BadgeCheck size={16} className="text-magenta" aria-hidden />
                  <span className="text-xs text-magenta font-ui font-medium uppercase tracking-wide">
                    Verified Khairo Diet Clinic participant
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-ink-black/40 mt-12 max-w-md mx-auto px-4 sm:px-6">
          Individual results vary. All stories above are from real Khairo Diet Clinic participants. Results shown are not typical and depend on adherence, individual biology, and lifestyle factors.
        </p>
      </section>

      <CTABand />
    </>
  );
}
