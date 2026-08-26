import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight, BookOpen, FlaskConical } from "lucide-react";
import { CTABand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Science & The Lab",
  description:
    "Biology-first education from KhairoDietClinic — understand Lac-Phe, hunger hormones, women's metabolism, and why restriction backfires.",
};

const ARTICLES = [
  {
    slug: "lac-phe-appetite",
    category: "Hormones",
    title: "What is Lac-Phe and why does it change everything about weight loss?",
    excerpt:
      "The molecule that exercise produces to suppress appetite — and why it means 'movement is medicine, not punishment.'",
    image: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=800&q=80&auto=format",
    readTime: "5 min read",
    featured: true,
  },
  {
    slug: "hormones-womens-weight",
    category: "Biology",
    title: "How hormones control women's weight — and what you can actually do about it",
    excerpt:
      "Estrogen, cortisol, insulin, leptin — the four hormonal players that most diets completely ignore.",
    image: "https://images.unsplash.com/photo-1507152927179-bc4ebfef7103?w=800&q=80&auto=format",
    readTime: "7 min read",
    featured: true,
  },
  {
    slug: "why-restriction-backfires",
    category: "Nutrition",
    title: "Why calorie restriction backfires — the metabolic adaptation effect",
    excerpt:
      "Your body adapts to less food by burning less. Here's the science of why restriction stalls weight loss, and what works instead.",
    image: "https://images.unsplash.com/photo-1575467678950-0c09aad418af?w=800&q=80&auto=format",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "sleep-hunger",
    category: "Lifestyle",
    title: "How one bad night of sleep makes you eat 300+ more calories the next day",
    excerpt:
      "Ghrelin, leptin, and the hormonal cascade that poor sleep triggers in your hunger system.",
    image: "https://images.unsplash.com/photo-1569925444984-9e2e5fc3d1fb?w=800&q=80&auto=format",
    readTime: "4 min read",
    featured: false,
  },
  {
    slug: "muscle-metabolism",
    category: "Biology",
    title: "Muscle is metabolically active — here's what that actually means for fat loss",
    excerpt:
      "Why building lean muscle is the most sustainable weight-management strategy for women.",
    image: "https://images.unsplash.com/photo-1603503363848-6952525df449?w=800&q=80&auto=format",
    readTime: "5 min read",
    featured: false,
  },
  {
    slug: "perimenopause-weight",
    category: "Women's Health",
    title: "Weight gain in your 30s and 40s isn't laziness — it's perimenopause",
    excerpt:
      "The hormonal shifts that begin years before menopause and why they change where and how your body stores fat.",
    image: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=800&q=80&auto=format",
    readTime: "8 min read",
    featured: false,
  },
];

const CATEGORIES = ["All", "Hormones", "Biology", "Nutrition", "Lifestyle", "Women's Health"];

export default function SciencePage() {
  const [featured1, featured2, ...rest] = ARTICLES;

  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink-black pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-60" aria-hidden />
        <div
          className="absolute top-1/2 right-1/4 w-[500px] h-[400px] rounded-full bg-magenta/8 blur-[100px]"
          aria-hidden
        />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <FlaskConical size={20} className="text-magenta" aria-hidden />
            <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta">
              Science & The Lab
            </p>
          </div>
          <h1 className="font-display text-[clamp(40px,6vw,80px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6 max-w-3xl">
            Understand your body.
            <br />
            Change your life.
          </h1>
          <p className="text-mist text-lg max-w-lg leading-relaxed">
            Biology-first education on how women&apos;s bodies work — hormones, hunger, metabolism, and the science behind sustainable change.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <section className="bg-charcoal border-b border-white/8 py-4">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((c, i) => (
              <button
                key={c}
                className={`flex-none rounded-full px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  i === 0
                    ? "bg-magenta text-pure-white"
                    : "bg-white/8 text-mist hover:bg-white/15"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured articles */}
      <section className="bg-off-white py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-6 mb-12">
            {/* Large featured */}
            <Link href={`/science/${featured1.slug}`} className="lg:col-span-3 group block">
              <div className="relative rounded-[1.5rem] overflow-hidden aspect-video mb-5">
                <Image
                  src={featured1.image}
                  alt={featured1.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-black/70 to-transparent" aria-hidden />
                <span className="absolute top-4 left-4 bg-magenta text-pure-white text-[11px] font-ui font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {featured1.category}
                </span>
              </div>
              <h2 className="font-display text-2xl text-ink-black leading-tight mb-2 group-hover:text-magenta transition-colors">
                {featured1.title}
              </h2>
              <p className="text-ink-black/60 leading-relaxed text-sm mb-3">{featured1.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-mist">
                <Clock size={12} aria-hidden />
                {featured1.readTime}
              </span>
            </Link>

            {/* Second featured */}
            <Link href={`/science/${featured2.slug}`} className="lg:col-span-2 group block">
              <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/3] mb-4">
                <Image
                  src={featured2.image}
                  alt={featured2.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <span className="absolute top-4 left-4 bg-ink-black/60 text-pure-white text-[11px] font-ui font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {featured2.category}
                </span>
              </div>
              <h2 className="font-display text-xl text-ink-black leading-tight mb-2 group-hover:text-magenta transition-colors">
                {featured2.title}
              </h2>
              <p className="text-ink-black/60 text-sm leading-relaxed mb-3 line-clamp-2">{featured2.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-mist">
                <Clock size={12} aria-hidden />
                {featured2.readTime}
              </span>
            </Link>
          </div>

          {/* Article grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rest.map((article) => (
              <Link key={article.slug} href={`/science/${article.slug}`} className="group block">
                <div className="relative rounded-[1.25rem] overflow-hidden aspect-video mb-4">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="25vw"
                  />
                  <span className="absolute top-3 left-3 bg-ink-black/60 text-pure-white text-[10px] font-ui font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
                <h3 className="font-display text-base text-ink-black leading-snug mb-2 group-hover:text-magenta transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-mist">
                  <Clock size={11} aria-hidden />
                  {article.readTime}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to program */}
      <section className="bg-charcoal py-14">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 text-center">
          <BookOpen size={28} className="text-magenta mx-auto mb-4" aria-hidden />
          <h2 className="font-display text-2xl text-pure-white mb-3">
            Science is just the beginning.
          </h2>
          <p className="text-mist leading-relaxed mb-6">
            Understanding your biology is powerful. Having a medical team apply it to your specific body? That&apos;s what KhairoDietClinic is.
          </p>
          <Link
            href="/pricing#apply"
            className="inline-flex items-center gap-2 bg-magenta text-pure-white rounded-full px-6 py-3 font-ui font-semibold text-sm uppercase tracking-wider hover:bg-magenta-deep transition-colors"
          >
            Start the Program <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <CTABand />
    </>
  );
}
