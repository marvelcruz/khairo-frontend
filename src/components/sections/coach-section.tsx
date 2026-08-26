"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award, Users, Heart } from "lucide-react";
import { staggerContainer, fadeUp } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const CREDENTIALS = [
  { label: "Medically trained", icon: Award },
  { label: "700+ clients", icon: Users },
  { label: "Women's health focus", icon: Heart },
];

export function CoachSection() {
  const content = useWebsiteContent();
  const credentials = CREDENTIALS.map((credential, index) => ({
    ...credential,
    label: cmsText(content, `coach-credential-${index + 1}`, credential.label),
  }));

  return (
    <section
      className="bg-off-white py-16 sm:py-20 lg:py-32 overflow-hidden"
      aria-label="Meet your KhairoDietClinic coach"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Portrait */}
          <motion.div
            className="lg:col-span-5"
            initial={false}
            whileInView={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/5] max-h-[560px] glow-magenta">
              <Image
                src={cmsText(content, "coach-image", "https://images.unsplash.com/photo-1603503363848-6952525df449?w=700&q=85&auto=format")}
                alt={cmsText(content, "coach-image-alt", "KhairoDietClinic Olajumoke Osunsanya, RDN, MPH — fitness and wellness expert")}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent"
                aria-hidden
              />
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            className="lg:col-span-7"
            variants={staggerContainer}
            initial={false}
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p
              variants={fadeUp}
              className="font-ui text-xs uppercase tracking-widest text-emerald-600 mb-4"
            >
              {cmsText(content, "coach-eyebrow", "Your Guide")}
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="font-display text-[clamp(32px,4vw,52px)] text-ink-black leading-tight mb-1"
            >
              {cmsText(content, "coach-name", "Olajumoke Osunsanya, RDN, MPH")}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="font-ui font-semibold text-sm text-gold-trust uppercase tracking-wider mb-6"
            >
              {cmsText(content, "coach-role", "Founder & Lead Dietitian")}
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-ink-black/75 leading-relaxed mb-5 text-[1.05rem]"
            >
              {cmsText(content, "coach-bio-1", "After years of watching women struggle with programs built for men's biology, Olajumoke Osunsanya, RDN, MPH created KhairoDietClinic with a single goal: a program that works with how women's bodies actually function. Hormones, hunger signals, metabolism — all of it factored in from day one.")}
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="text-ink-black/75 leading-relaxed mb-8 text-[1.05rem]"
            >
              {cmsText(content, "coach-bio-2", "More than 700 women have completed KhairoDietClinic under her medical guidance. The program isn't about perfection — it's about building a relationship with your body that lasts.")}
            </motion.p>

            {/* Credential chips */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {credentials.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 bg-ink-black/8 border border-ink-black/12 text-ink-black rounded-full px-4 py-2 text-sm font-ui font-medium"
                >
                  <Icon size={14} className="text-emerald-600" aria-hidden />
                  {label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
