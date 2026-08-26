"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { cmsText, useWebsiteContent } from "@/components/website/WebsiteContentProvider";

const FAQS = [
  {
    q: "Is this safe — is it really medically supervised?",
    a: "Yes. Every KhairoDietClinic program is overseen by a trained health professional who reviews your intake form, monitors your progress, and can adjust your plan based on how your body responds. It's not a generic diet — it's a guided health journey.",
  },
  {
    q: "Do I have to exercise a lot?",
    a: "No. Movement helps (remember Lac-Phe — the molecule that naturally quiets hunger neurons), but the program is built around sustainable habits, not punishment. We'll recommend movement that fits your life, not a brutal gym schedule.",
  },
  {
    q: "Is it only for women?",
    a: "Yes — the program and community are designed exclusively for women. This creates a safe, judgment-free space where members can be honest about their bodies, their struggles, and their progress.",
  },
  {
    q: "How do I get started?",
    a: "Apply in about 2 minutes using the form on this page or by messaging us on WhatsApp. We'll guide you through a short onboarding, assign your plan, and add you to the private support group — usually within the same week.",
  },
  {
    q: "What if I've tried every diet and failed before?",
    a: "That's exactly who this is for. Most programs fail women because they're built around restriction, not biology. KhairoDietClinic addresses the hormonal and metabolic reasons weight loss stalls — so this time, it's different.",
  },
  {
    q: "What do I actually get in the meal plan?",
    a: "A realistic, personalized eating plan built around your food preferences, budget, and goals. Real Nigerian foods, practical portions, and no starvation. Plans are adjusted as your body changes.",
  },
];

export function FAQSection() {
  const content = useWebsiteContent();
  const faqs = FAQS.map((faq, index) => ({
    q: cmsText(content, `faq-${index + 1}-q`, faq.q),
    a: cmsText(content, `faq-${index + 1}-a`, faq.a),
  }));
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      className="bg-off-white py-16 sm:py-20 lg:py-32 overflow-hidden"
      aria-label="Frequently asked questions"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-14">
          <SectionHeader
            eyebrow={cmsText(content, "faq-eyebrow", "Questions")}
            title={cmsText(content, "faq-title", "Everything you're wondering.")}
            subtitle={cmsText(content, "faq-subtitle", "Can't find what you're looking for? Chat with us on WhatsApp.")}
            light
          />
        </div>

        <div className="max-w-[760px] mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div
                className={`rounded-[1.5rem] overflow-hidden border transition-all duration-300 ${
                  open === i
                    ? "border-magenta/30 bg-pure-white shadow-sm"
                    : "border-black/8 bg-pure-white/60"
                }`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 text-left"
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span
                    className={`font-ui font-semibold text-[0.95rem] transition-colors duration-200 ${
                      open === i ? "text-magenta" : "text-ink-black"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 w-7 h-7 rounded-full bg-magenta/10 flex items-center justify-center text-magenta"
                    aria-hidden
                  >
                    <Plus size={14} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        <div className="h-px bg-black/6 mb-4" aria-hidden />
                        {/* Speech bubble answer */}
                        <div className="bg-off-white rounded-[1rem_1rem_1rem_0.25rem] p-5">
                          <p className="text-ink-black/75 leading-relaxed text-sm">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
