import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Shield, Lightbulb, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { CTABand } from "@/components/sections/cta-band";
import { StatBand } from "@/components/sections/stat-band";
import { TestimonialsSection } from "@/components/sections/testimonials-section";

export const metadata: Metadata = {
  title: "About Our Mission",
  description:
    "The story behind KhairoDietClinic — a medically supervised weight-loss program built because women deserved better than programs that ignored their biology.",
};

const VALUES = [
  {
    icon: Shield,
    title: "Medically grounded",
    body: "Every recommendation we make is backed by science and reviewed by a health professional. No trends, no guesswork.",
  },
  {
    icon: Heart,
    title: "Anti-shame, always",
    body: "We believe your body is not your enemy. Our entire program is built on the premise that compassion produces better results than punishment.",
  },
  {
    icon: Lightbulb,
    title: "Biology-first",
    body: "Understanding how women's bodies actually work — hormones, hunger signals, metabolism — is how we create lasting change.",
  },
  {
    icon: Users,
    title: "Community-powered",
    body: "Accountability and belonging are as powerful as any meal plan. Our women-only community is built into the program, not optional.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] bg-ink-black flex items-end pb-14 pt-24 sm:pb-20 sm:pt-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1509099896299-af46ad97ff57?w=1600&q=80&auto=format"
            alt="KhairoDietClinic community of African women"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-black/40 via-ink-black/60 to-ink-black" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta mb-5">
            Our Mission
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,80px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6 max-w-3xl">
            Built for women,
            <br />
            by people who care
            <br />
            about women.
          </h1>
        </div>
      </section>

      {/* Origin story */}
      <section className="bg-off-white py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="font-ui text-xs uppercase tracking-widest text-magenta mb-4">
                How We Started
              </p>
              <h2 className="font-display text-[clamp(28px,4vw,48px)] text-ink-black leading-tight mb-6">
                Women were being failed by programs that weren&apos;t built for them.
              </h2>
              <p className="text-ink-black/75 leading-relaxed mb-5 text-[1.05rem]">
                KhairoDietClinic began with a simple observation: most weight-loss programs were built on research done primarily on men, then handed to women and called &ldquo;effective.&rdquo; But women&apos;s hormones, hunger cycles, and metabolism work differently. The results — and the shame when those programs didn&apos;t work — were predictable.
              </p>
              <p className="text-ink-black/75 leading-relaxed text-[1.05rem]">
                The program launched with a small cohort of women in Lagos. Within weeks, the community was growing — not from ads, but from word of mouth. Women who had &ldquo;failed every diet&rdquo; were reporting real change. The difference was biology, not willpower.
              </p>
            </div>
            <div>
              <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1603503363848-6952525df449?w=700&q=85&auto=format"
                  alt="KhairoDietClinic founder and coach Ada"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatBand />

      {/* Values */}
      <section className="bg-ink-black py-14 sm:py-20 lg:py-28 relative">
        <div className="absolute inset-0 halftone opacity-50" aria-hidden />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <SectionHeader eyebrow="Our Values" title="What we believe in." />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-charcoal border border-white/8 rounded-[1.5rem] p-7"
              >
                <div className="w-10 h-10 rounded-xl bg-magenta/10 border border-magenta/20 flex items-center justify-center mb-5">
                  <v.icon size={20} className="text-magenta" aria-hidden />
                </div>
                <h3 className="font-display text-lg text-pure-white mb-3">{v.title}</h3>
                <p className="text-sm text-mist leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community visual */}
      <section className="bg-charcoal py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[760px] mx-auto text-center mb-12">
            <p className="font-ui text-xs uppercase tracking-widest text-magenta mb-4">
              The Community
            </p>
            <h2 className="font-display text-[clamp(28px,4vw,48px)] text-pure-white leading-tight mb-4">
              700+ women who stopped fighting their bodies.
            </h2>
            <p className="text-mist leading-relaxed">
              The KhairoDietClinic community is one of the program&apos;s most powerful tools. It&apos;s private, women-only, and built into every plan.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=400&q=80&auto=format",
              "https://images.unsplash.com/photo-1631899560971-394ded28a80f?w=400&q=80&auto=format",
              "https://images.unsplash.com/photo-1758526214005-acd3ec7560e2?w=400&q=80&auto=format",
              "https://images.unsplash.com/photo-1758526214005-acd3ec7560e2?w=400&q=80&auto=format",
            ].map((src, i) => (
              <div key={i} className="relative rounded-[1.25rem] overflow-hidden aspect-square">
                <Image
                  src={src}
                  alt="KhairoDietClinic community member"
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <CTABand />
    </>
  );
}
