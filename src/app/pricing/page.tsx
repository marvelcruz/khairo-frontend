"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingSection } from "@/components/sections/pricing-section";
import { FAQSection } from "@/components/sections/faq-section";
import { WHATSAPP_URL } from "@/lib/utils";

const STEPS = ["Your Goal", "About You", "Contact"];

const GOALS = [
  "Lose weight sustainably",
  "Understand my body better",
  "Build healthy eating habits",
  "Medical weight management",
  "Postpartum weight loss",
  "Hormone-related weight gain",
];

export default function PricingPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Start saving immediately, but do not delay the WhatsApp handoff.
    const saveRequest = api
      .post("/public/applications", {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        goals: selected.join(", "),
        healthNotes: form.notes,
        programInterest: "not_sure",
      })
      .catch((err) => {
        console.error("Failed to save application to dashboard:", err);
      });

    const message = encodeURIComponent(
      `Hi Khairo Diet Clinic! I just filled out the application.\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nGoals: ${selected.join(", ")}\n\n${form.notes ? `Notes: ${form.notes}` : ""}`
    );

    const whatsappBaseUrl = WHATSAPP_URL.split("?")[0];
    window.open(
      `${whatsappBaseUrl}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );

    setSubmitted(true);
    await saveRequest;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink-black pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-40" aria-hidden />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-magenta/8 blur-[100px]"
          aria-hidden
        />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta mb-4">
            Simple Pricing
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,80px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6">
            Invest in the body
            <br />
            you deserve.
          </h1>
          <p className="text-mist text-lg max-w-lg mx-auto leading-relaxed">
            Pick the level of support that fits your life. All plans include medical supervision, meal plans, and community.
          </p>
        </div>
      </section>

      <PricingSection />

      {/* Application form */}
      <section className="bg-off-white py-14 sm:py-20 lg:py-28" id="apply">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="font-ui text-xs uppercase tracking-widest text-magenta mb-3">
              Ready to Start?
            </p>
            <h2 className="font-display text-[clamp(28px,4vw,48px)] text-ink-black leading-tight mb-3">
              Apply in 2 minutes.
            </h2>
            <p className="text-ink-black/60 leading-relaxed">
              No pressure, no judgment. We&apos;ll reach out via WhatsApp to complete your onboarding.
            </p>
          </div>

          {/* Progress bar */}
          {!submitted && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-2">
                {STEPS.map((s, i) => (
                  <span
                    key={s}
                    className={`font-ui text-xs uppercase tracking-wider ${
                      i <= step ? "text-magenta" : "text-ink-black/30"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="h-1 bg-ink-black/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-magenta rounded-full"
                  initial={false}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}

          <div className="bg-pure-white rounded-[1.25rem] sm:rounded-[1.5rem] border border-black/8 p-5 sm:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-mint-signal/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-mint-signal" />
                  </div>
                  <h3 className="font-display text-2xl text-ink-black mb-3">
                    Application received!
                  </h3>
                  <p className="text-ink-black/60 leading-relaxed">
                    We&apos;ll review your application and be in touch shortly.
                  </p>
                </motion.div>
              ) : step === 0 ? (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <h3 className="font-display text-xl text-ink-black mb-2">What&apos;s your main goal?</h3>
                  <p className="text-sm text-ink-black/50 mb-6">Select all that apply.</p>
                  <div className="grid grid-cols-1 gap-2.5 mb-6 min-[360px]:grid-cols-2 sm:gap-3 sm:mb-8">
                    {GOALS.map((goal) => (
                      <button
                        key={goal}
                        onClick={() =>
                          setSelected((s) =>
                            s.includes(goal) ? s.filter((g) => g !== goal) : [...s, goal]
                          )
                        }
                        className={`text-left p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
                          selected.includes(goal)
                            ? "border-magenta bg-magenta/5 text-magenta"
                            : "border-black/10 text-ink-black/70 hover:border-magenta/40"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(1)}
                    disabled={selected.length === 0}
                    className="w-full justify-center"
                  >
                    Continue <ArrowRight size={16} />
                  </Button>
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <h3 className="font-display text-xl text-ink-black mb-6">Tell us a bit about yourself.</h3>
                  <div className="space-y-4 mb-8">
                    {[
                      { label: "Full Name", key: "name", type: "text", placeholder: "Your name" },
                      { label: "WhatsApp Number", key: "phone", type: "tel", placeholder: "+234 906 138 2720" },
                      { label: "Email Address", key: "email", type: "email", placeholder: "you@email.com" },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block font-ui text-xs font-semibold uppercase tracking-wider text-ink-black/60 mb-1.5">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={form[field.key as keyof typeof form]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                          }
                          className="w-full border border-black/15 rounded-xl px-4 py-3 text-ink-black placeholder:text-ink-black/30 focus:outline-none focus:border-magenta transition-colors text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="ghost" size="md" onClick={() => setStep(0)} className="text-ink-black/60 hover:text-ink-black">
                      ← Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setStep(2)}
                      disabled={!form.name || !form.phone || !form.email}
                      className="flex-1 justify-center"
                    >
                      Continue <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  onSubmit={handleSubmit}
                >
                  <h3 className="font-display text-xl text-ink-black mb-2">Anything else we should know?</h3>
                  <p className="text-sm text-ink-black/50 mb-6">Medical conditions, previous diet history, questions — share anything helpful.</p>
                  <textarea
                    rows={4}
                    placeholder="Please share any relevant details (required)..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-black/15 rounded-xl px-4 py-3 text-ink-black placeholder:text-ink-black/30 focus:outline-none focus:border-magenta transition-colors text-sm resize-none mb-6"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-black/40 mb-6">
                    <ShieldCheck size={14} className="text-mint-signal shrink-0" />
                    Your information is private and never shared with third parties.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="ghost" size="md" onClick={() => setStep(1)} className="text-ink-black/60">
                      ← Back
                    </Button>
                    <Button variant="primary" size="md" type="submit" magnetic disabled={!form.notes.trim()} className="flex-1 justify-center">
                      Submit Application →
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <FAQSection />
    </>
  );
}
