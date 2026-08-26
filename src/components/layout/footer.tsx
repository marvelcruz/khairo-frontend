import Link from "next/link";
import { Instagram, Facebook, Phone } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/utils";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "The Program", href: "/program" },
  { label: "Results", href: "/results" },
  { label: "Science & The Lab", href: "/science" },
];

const PROGRAM_LINKS = [
  { label: "How It Works", href: "/program#how-it-works" },
  { label: "Pricing & Plans", href: "/pricing" },
  { label: "Apply Now", href: "/pricing#apply" },
  { label: "About Us", href: "/about" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-ink-black border-t border-white/8 relative overflow-hidden">
      {/* Halftone bg */}
      <div className="absolute inset-0 halftone opacity-40 pointer-events-none" aria-hidden />

      {/* Wordmark texture */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 font-display text-[clamp(80px,15vw,160px)] text-pure-white/[0.04] uppercase whitespace-nowrap pointer-events-none select-none leading-none"
        aria-hidden
      >
        Khairo Diet Clinic
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 pt-20 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="font-display text-3xl text-pure-white">FIT</span>
              <span className="font-display text-3xl text-magenta">LUNGE</span>
            </Link>
            <p className="text-mist text-sm leading-relaxed mb-6">
              A medically supervised weight-loss program built for women&apos;s
              biology. Movement is medicine.
            </p>
            {/* Social */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/khairo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-mist hover:text-magenta hover:bg-magenta/10 transition-all duration-200"
                aria-label="Khairo Diet Clinic on Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61573678627525"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-mist hover:text-magenta hover:bg-magenta/10 transition-all duration-200"
                aria-label="Khairo Diet Clinic on Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-mist hover:text-mint-signal hover:bg-mint-signal/10 transition-all duration-200"
                aria-label="Chat with Khairo Diet Clinic on WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-ui font-semibold text-xs uppercase tracking-widest text-mist mb-5">
              Explore
            </h3>
            <ul className="space-y-3">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-mist/80 hover:text-magenta transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Program */}
          <div>
            <h3 className="font-ui font-semibold text-xs uppercase tracking-widest text-mist mb-5">
              Program
            </h3>
            <ul className="space-y-3">
              {PROGRAM_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-mist/80 hover:text-magenta transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-ui font-semibold text-xs uppercase tracking-widest text-mist mb-5">
              Connect
            </h3>
            <ul className="space-y-3 mb-6">
              <li>
                <a
                  href="tel:+2349061382720"
                  className="flex flex-wrap items-center gap-2 text-sm text-mist/80 hover:text-pure-white transition-colors duration-200"
                >
                  <Phone size={14} className="text-magenta shrink-0" />
                  +234 906 138 2720
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center gap-2 text-sm text-mist/80 hover:text-mint-signal transition-colors duration-200"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-mint-signal shrink-0"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <p className="text-xs text-mist/60 mb-3 font-ui uppercase tracking-wider">
                Get wellness insights
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mist/50 text-center sm:text-left">
            © {new Date().getFullYear()} Khairo Diet Clinic. All rights reserved. Results
            may vary.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-mist/50 hover:text-mist transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
