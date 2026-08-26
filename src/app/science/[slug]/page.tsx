import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { CTABand } from "@/components/sections/cta-band";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Article — ${slug.replace(/-/g, " ")}`,
    description: "Biology-first education from Khairo Diet Clinic.",
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      {/* Reading progress bar placeholder */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[60] bg-gradient-to-r from-magenta to-blush" style={{ width: "60%" }} aria-hidden />

      {/* Hero */}
      <section className="bg-ink-black pt-28 pb-0 relative overflow-hidden">
        <div className="absolute inset-0 halftone opacity-40" aria-hidden />
        <div className="relative max-w-[900px] mx-auto px-6">
          <Link
            href="/science"
            className="inline-flex items-center gap-2 text-mist hover:text-magenta transition-colors text-sm mb-8 font-ui"
          >
            <ArrowLeft size={15} aria-hidden />
            Back to The Lab
          </Link>
          <span className="inline-block bg-magenta text-pure-white text-xs font-ui font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
            Biology
          </span>
          <h1 className="font-display text-[clamp(32px,5vw,60px)] text-pure-white leading-[1.1] tracking-[-0.02em] mb-6">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-mist text-sm pb-8 border-b border-white/10">
            <span className="flex flex-wrap items-center gap-1.5">
              <Clock size={14} aria-hidden />
              6 min read
            </span>
            <span>·</span>
            <span>Khairo Diet Clinic Science</span>
          </div>
        </div>
      </section>

      {/* Featured image */}
      <div className="bg-ink-black pb-0">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="relative rounded-[1.5rem] overflow-hidden aspect-video -mt-0">
            <Image
              src="https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=1200&q=85&auto=format"
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Article body */}
      <section className="bg-off-white py-16">
        <div className="max-w-[720px] mx-auto px-6">
          <div className="prose prose-lg prose-slate max-w-none">
            {/* Speech bubble pull quote */}
            <div className="bg-charcoal rounded-[1.5rem_1.5rem_1.5rem_0.25rem] p-7 my-8 not-prose">
              <p className="font-display text-xl text-pure-white leading-relaxed">
                &ldquo;Understanding your biology is the single most powerful thing you can do before starting any weight-loss program.&rdquo;
              </p>
              <p className="text-mist text-sm mt-3">— Khairo Diet Clinic Medical Team</p>
            </div>

            <p className="text-ink-black/80 leading-relaxed text-[1.05rem] mb-5">
              The science of weight loss in women is far more nuanced than &ldquo;eat less, move more.&rdquo; Research published in the last decade has revealed several key biological mechanisms that explain why women lose weight differently than men — and why so many standard programs fail.
            </p>

            <p className="text-ink-black/80 leading-relaxed text-[1.05rem] mb-5">
              At Khairo Diet Clinic, every program recommendation is grounded in this evidence. We don&apos;t follow trends — we follow your biology.
            </p>

            <h2 className="font-display text-2xl text-ink-black mt-10 mb-4">
              The hormonal difference
            </h2>
            <p className="text-ink-black/80 leading-relaxed text-[1.05rem] mb-5">
              Estrogen, progesterone, and cortisol interact with hunger signals, energy storage, and metabolic rate in ways that make women&apos;s weight management fundamentally different from men&apos;s. Programs that ignore this are setting women up to fail — not because of lack of discipline, but because of biology.
            </p>

            <h2 className="font-display text-2xl text-ink-black mt-10 mb-4">
              What this means for your program
            </h2>
            <p className="text-ink-black/80 leading-relaxed text-[1.05rem] mb-5">
              At Khairo Diet Clinic, meal timing, food composition, and even the type of movement we recommend are calibrated to work with your hormonal cycle — not against it. This isn&apos;t about being gentle or lowering expectations. It&apos;s about being precise.
            </p>

            <div className="bg-rose-tint rounded-2xl p-6 my-8 not-prose">
              <p className="font-ui font-semibold text-magenta text-xs uppercase tracking-wider mb-2">Key Takeaway</p>
              <p className="text-ink-black/80 text-sm leading-relaxed">
                Weight loss that works for women must account for hormonal fluctuation, metabolic adaptation, and the psychological effects of restriction. Khairo Diet Clinic does all three.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-black/10">
            <p className="font-ui text-xs uppercase tracking-widest text-magenta mb-4">
              Ready to apply the science?
            </p>
            <h3 className="font-display text-2xl text-ink-black mb-4">
              Start the program that&apos;s built around this.
            </h3>
            <Link
              href="/pricing#apply"
              className="inline-flex items-center gap-2 bg-magenta text-pure-white rounded-full px-6 py-3 font-ui font-semibold text-sm uppercase tracking-wider hover:bg-magenta-deep transition-colors"
            >
              <BookOpen size={15} aria-hidden />
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
