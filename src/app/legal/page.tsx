import type { Metadata } from "next";
import Link from "next/link";
import { Shield, FileText, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal & Privacy",
  description: "Khairo Diet Clinic Privacy Policy, Terms & Conditions, and Medical Disclaimer.",
};

export default function LegalPage() {
  return (
    <>
      <section className="relative bg-ink-black pt-24 pb-8 sm:pt-32 sm:pb-10 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-30" aria-hidden />
        <div className="relative max-w-[900px] mx-auto px-4 sm:px-6">
          <h1 className="font-display text-[clamp(36px,5vw,64px)] text-pure-white leading-tight mb-4">
            Legal & Privacy
          </h1>
          <p className="text-mist text-lg">Last updated: June 2026</p>
        </div>
      </section>

      <section className="bg-off-white py-12">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          {/* Nav */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { href: "#privacy", icon: Shield, label: "Privacy Policy" },
              { href: "#terms", icon: FileText, label: "Terms & Conditions" },
              { href: "#disclaimer", icon: AlertTriangle, label: "Medical Disclaimer" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 bg-pure-white border border-black/10 rounded-full px-5 py-2.5 font-ui text-sm font-medium text-ink-black hover:border-magenta hover:text-magenta transition-all"
              >
                <item.icon size={15} aria-hidden />
                {item.label}
              </a>
            ))}
          </div>

          <div className="space-y-16 text-ink-black/80 leading-relaxed">
            {/* Privacy Policy */}
            <div id="privacy">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Shield size={22} className="text-magenta" aria-hidden />
                <h2 className="font-display text-3xl text-ink-black">Privacy Policy</h2>
              </div>
              <div className="space-y-5 text-[0.95rem]">
                <p>Khairo Diet Clinic (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website or program services.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Information We Collect</h3>
                <p>We collect information you provide directly — including your name, phone number, email address, health history, and goals — when you apply or contact us. We also collect usage data automatically through standard web analytics.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">How We Use Your Information</h3>
                <p>Your information is used solely to deliver and improve the Khairo Diet Clinic program, communicate with you, and provide medical oversight. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Data Security</h3>
                <p>We implement industry-standard security measures to protect your data. All communications containing personal health information are handled privately via WhatsApp or direct message.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Your Rights</h3>
                <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at +234 906 138 2720.</p>
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Terms */}
            <div id="terms">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <FileText size={22} className="text-magenta" aria-hidden />
                <h2 className="font-display text-3xl text-ink-black">Terms & Conditions</h2>
              </div>
              <div className="space-y-5 text-[0.95rem]">
                <p>By accessing the Khairo Diet Clinic website or enrolling in any Khairo Diet Clinic program, you agree to these Terms & Conditions.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Program Eligibility</h3>
                <p>Khairo Diet Clinic programs are designed exclusively for adult women (18+). By enrolling, you confirm that you are a woman aged 18 or older.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Payment & Refunds</h3>
                <p>All program fees are due at the start of each cycle. Refunds may be considered on a case-by-case basis within the first 7 days of program commencement. Contact us directly to discuss.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Intellectual Property</h3>
                <p>All content, meal plans, and materials provided through Khairo Diet Clinic are proprietary. You may not reproduce, share, or distribute them without written consent.</p>
                <h3 className="font-ui font-bold text-sm uppercase tracking-wider text-ink-black mt-6 mb-2">Limitation of Liability</h3>
                <p>Khairo Diet Clinic provides wellness guidance and program support. We are not liable for outcomes that result from failure to follow program guidelines, underlying medical conditions not disclosed at enrollment, or individual variation in results.</p>
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Medical Disclaimer */}
            <div id="disclaimer">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <AlertTriangle size={22} className="text-magenta" aria-hidden />
                <h2 className="font-display text-3xl text-ink-black">Medical Disclaimer</h2>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-[1.5rem] p-6 mb-6">
                <p className="text-rose-800 text-sm leading-relaxed font-medium">
                  <strong>Important:</strong> The information and guidance provided through Khairo Diet Clinic programs is for general wellness purposes and should not be treated as a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </div>
              <div className="space-y-5 text-[0.95rem]">
                <p>While Khairo Diet Clinic programs are designed with medical guidance and oversight, every participant&apos;s health situation is unique. Always consult your personal physician or qualified healthcare provider before starting any weight-loss program, particularly if you have existing medical conditions, are pregnant or breastfeeding, or are taking prescription medications.</p>
                <p>Results shown on this website are from individual program participants and are not typical. Weight loss outcomes depend on many factors including adherence to the program, individual metabolism, underlying health conditions, and lifestyle factors outside the program.</p>
                <p>Claims of &ldquo;medically supervised&rdquo; refer to program oversight by a trained health professional. This does not constitute a doctor-patient relationship or replace the care of your personal physician.</p>
                <p>If you experience any adverse effects during the program — including but not limited to dizziness, unusual fatigue, chest pain, or extreme hunger — discontinue the program and seek medical attention immediately.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="text-xs text-ink-black/40">
              Questions about these policies?{" "}
              <Link href="/contact" className="text-magenta underline underline-offset-2 hover:no-underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
