"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Check, Minus, Zap } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeUp, WHATSAPP_URL } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  billing: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Core",
    price: "₦35,000",
    billing: "per 8-week cycle",
    description: "Everything you need to start your transformation.",
    features: [
      { text: "Personalized meal plan", included: true },
      { text: "Private women's community", included: true },
      { text: "Weekly group check-ins", included: true },
      { text: "Biology-based nutrition guide", included: true },
      { text: "Weekly medical check-ins", included: false },
      { text: "1:1 coaching sessions", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
  },
  {
    name: "Plus",
    price: "₦55,000",
    billing: "per 12-week cycle",
    description: "The full program with medical oversight built in.",
    features: [
      { text: "Personalized meal plan", included: true },
      { text: "Private women's community", included: true },
      { text: "Weekly group check-ins", included: true },
      { text: "Biology-based nutrition guide", included: true },
      { text: "Weekly medical check-ins", included: true },
      { text: "Plan adjustments as you progress", included: true },
      { text: "1:1 coaching sessions", included: false },
    ],
    cta: "Apply for Plus",
    popular: true,
  },
  {
    name: "VIP",
    price: "₦85,000",
    billing: "per 12-week cycle",
    description: "White-glove support for the fastest, safest results.",
    features: [
      { text: "Personalized meal plan", included: true },
      { text: "Private women's community", included: true },
      { text: "Weekly group check-ins", included: true },
      { text: "Biology-based nutrition guide", included: true },
      { text: "Weekly medical check-ins", included: true },
      { text: "Plan adjustments as you progress", included: true },
      { text: "1:1 coaching sessions", included: true },
    ],
    cta: "Apply for VIP",
  },
];

interface LivePricingProgram {
  key: string;
  name: string;
  price: number;
  weeks: number;
  popular?: boolean;
}

interface LivePricingResponse {
  pricing?: {
    programs?: LivePricingProgram[];
  };
}

export function PricingSection() {
  const content = useWebsiteContent();
  const cmsPlans = PLANS.map((plan) => {
    const key = plan.name.toLowerCase();
    return {
      ...plan,
      description: cmsText(content, `pricing-${key}-description`, plan.description),
      cta: cmsText(content, `pricing-${key}-cta`, plan.cta),
    };
  });
  const [programs, setPrograms] = useState<LivePricingProgram[]>([]);

  useEffect(() => {
    api.get<LivePricingResponse>("/public/pricing").then((res) => {
      if (
        Array.isArray(res.pricing?.programs) &&
        res.pricing.programs.length
      ) {
        setPrograms(res.pricing.programs);
      }
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => "₦" + n.toLocaleString();
  const knownKeys = ["core", "plus", "vip"];
  const dynamicPlans = cmsPlans.map((p) => {
    const prog = programs.find((x) => x.key === p.name.toLowerCase() || x.name === p.name);
    if (!prog) return p;
    return { ...p, name: prog.name, price: fmt(prog.price), billing: `per ${prog.weeks}-week cycle` };
  }).concat(
    programs
      .filter((prog) => !knownKeys.includes(prog.key))
      .map((prog) => ({
        ...cmsPlans[0],
        name: prog.name,
        price: fmt(prog.price),
        billing: `per ${prog.weeks}-week cycle`,
        description: "Brand new program — ask us what's included!",
        features: [] as PlanFeature[],
        cta: "Apply Now",
        popular: !!prog.popular,
      }))
  );
  return (
    <section
      className="bg-ink-black py-16 sm:py-20 lg:py-32 relative overflow-hidden"
      id="pricing"
      aria-label="KhairoDietClinic pricing plans"
    >
      <div className="absolute inset-0 halftone opacity-40 pointer-events-none" aria-hidden />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-14">
          <SectionHeader
            eyebrow={cmsText(content, "pricing-eyebrow", "Simple Pricing")}
            title={cmsText(content, "pricing-title", "Your investment<br/>in yourself.")}
            subtitle={cmsText(content, "pricing-subtitle", "No hidden fees. No lock-ins. Pay per cycle, stop whenever you're ready.")}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial={false}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-5 items-start"
        >
          {dynamicPlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={cn(
                "relative rounded-[1.25rem] sm:rounded-[1.5rem] border p-5 sm:p-8 flex flex-col gap-4 sm:gap-6",
                plan.popular
                  ? "bg-charcoal border-emerald-600 md:-translate-y-4 shadow-[0_0_60px_rgba(236,0,140,0.2)]"
                  : "bg-charcoal/60 border-white/10"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-1.5 bg-gold-trust text-ink-black rounded-full px-4 py-1.5">
                  <Zap size={13} className="fill-ink-black" aria-hidden />
                  <span className="font-ui font-bold text-[11px] uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="font-ui font-bold text-xs uppercase tracking-widest text-mist mb-3">
                  {plan.name}
                </h3>
                <div className="flex flex-wrap items-end gap-2 mb-1">
                  <span className="font-display text-[2.3rem] sm:text-[2.8rem] text-pure-white leading-none">
                    {plan.price}
                  </span>
                </div>
                <p className="text-xs text-mist/70 mb-3">{plan.billing}</p>
                <p className="text-sm text-mist leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/8" aria-hidden />

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex flex-wrap items-center gap-3">
                    {f.included ? (
                      <Check
                        size={16}
                        className="text-mint-signal shrink-0"
                        aria-hidden
                      />
                    ) : (
                      <Minus
                        size={16}
                        className="text-mist/30 shrink-0"
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        f.included ? "text-pure-white/90" : "text-mist/40"
                      )}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "primary" : "secondary"}
                size="md"
                href={WHATSAPP_URL}
                external
                magnetic={plan.popular}
                className="w-full justify-center"
              >
                {plan.cta} →
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-mist/50 mt-8">
          {cmsText(content, "pricing-help-prefix", "Not sure which plan is right?")}{" "}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline underline-offset-2 hover:no-underline"
          >
            {cmsText(content, "pricing-help-link", "Chat with us on WhatsApp")}
          </a>{" "}
          {cmsText(content, "pricing-help-suffix", "— we'll guide you.")}
        </p>
      </div>
    </section>
  );
}
