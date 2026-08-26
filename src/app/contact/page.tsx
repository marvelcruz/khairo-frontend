"use client";

import { useState } from "react";
import { Phone, Instagram, Facebook, MessageCircle, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/lib/utils";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      await api.post("/public/contact", form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send your message. Please try WhatsApp instead.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink-black pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 halftone opacity-40" aria-hidden />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-magenta mb-4">
            Get In Touch
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,72px)] text-pure-white leading-[1.06] tracking-[-0.02em] mb-6">
            We&apos;re here for you.
          </h1>
          <p className="text-mist text-lg max-w-lg leading-relaxed">
            Questions, concerns, or ready to apply? Reach us however feels right.
          </p>
        </div>
      </section>

      <section className="bg-off-white py-14 sm:py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14">
            {/* Left: contact methods */}
            <div>
              <h2 className="font-display text-3xl text-ink-black mb-8">
                The fastest ways to reach us.
              </h2>

              {/* WhatsApp — primary */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-wrap items-center gap-5 bg-magenta rounded-[1.5rem] p-6 mb-4 group hover:bg-magenta-deep transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-pure-white/20 flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="font-ui font-bold text-pure-white uppercase tracking-wider text-sm">WhatsApp (Fastest)</p>
                  <p className="text-pure-white/70 text-sm">+234 906 138 2720 — usually replies within the hour</p>
                </div>
              </a>

              {/* Other methods */}
              <div className="space-y-3">
                <a
                  href="tel:+2349061382720"
                  className="flex flex-wrap items-center gap-4 bg-pure-white border border-black/8 rounded-[1.25rem] p-5 hover:border-magenta/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-magenta/10 flex items-center justify-center">
                    <Phone size={18} className="text-magenta" aria-hidden />
                  </div>
                  <div>
                    <p className="font-ui font-semibold text-sm text-ink-black">Call Us</p>
                    <p className="text-xs text-ink-black/50">+234 906 138 2720</p>
                  </div>
                </a>

                <a
                  href="https://www.instagram.com/khairo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center gap-4 bg-pure-white border border-black/8 rounded-[1.25rem] p-5 hover:border-magenta/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-magenta/10 flex items-center justify-center">
                    <Instagram size={18} className="text-magenta" aria-hidden />
                  </div>
                  <div>
                    <p className="font-ui font-semibold text-sm text-ink-black">Instagram</p>
                    <p className="text-xs text-ink-black/50">@khairo</p>
                  </div>
                </a>

                <a
                  href="https://www.facebook.com/profile.php?id=61573678627525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center gap-4 bg-pure-white border border-black/8 rounded-[1.25rem] p-5 hover:border-magenta/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-magenta/10 flex items-center justify-center">
                    <Facebook size={18} className="text-magenta" aria-hidden />
                  </div>
                  <div>
                    <p className="font-ui font-semibold text-sm text-ink-black">Facebook</p>
                    <p className="text-xs text-ink-black/50">KhairoDietClinic</p>
                  </div>
                </a>
              </div>

              <p className="text-xs text-ink-black/40 mt-6">
                KhairoDietClinic operates fully online. We do not have a physical office — all support is delivered remotely via WhatsApp and our private community.
              </p>
            </div>

            {/* Right: contact form */}
            <div>
              <h2 className="font-display text-3xl text-ink-black mb-6">
                Send us a message.
              </h2>

              {sent ? (
                <div className="bg-pure-white border border-black/8 rounded-[1.5rem] p-10 text-center">
                  <CheckCircle size={40} className="text-mint-signal mx-auto mb-4" />
                  <h3 className="font-display text-2xl text-ink-black mb-2">Message sent!</h3>
                  <p className="text-ink-black/60">We&apos;ll get back to you as soon as possible. For a faster response, WhatsApp us directly.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-pure-white border border-black/8 rounded-[1.5rem] p-8 space-y-5"
                >
                  {[
                    { label: "Your Name", key: "name", type: "text", placeholder: "Ada Okonkwo", required: true },
                    { label: "Email Address", key: "email", type: "email", placeholder: "ada@email.com", required: true },
                    { label: "Phone (optional)", key: "phone", type: "tel", placeholder: "+234 800 000 0000", required: false },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block font-ui text-xs font-semibold uppercase tracking-wider text-ink-black/50 mb-1.5">
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        required={f.required}
                        className="w-full border border-black/12 rounded-xl px-4 py-3 text-ink-black placeholder:text-ink-black/30 text-sm focus:outline-none focus:border-magenta transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block font-ui text-xs font-semibold uppercase tracking-wider text-ink-black/50 mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Your question or message..."
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      required
                      className="w-full border border-black/12 rounded-xl px-4 py-3 text-ink-black placeholder:text-ink-black/30 text-sm focus:outline-none focus:border-magenta transition-colors resize-none"
                    />
                  </div>
                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <Button variant="primary" size="md" type="submit" className="w-full justify-center" disabled={sending}>
                    <Send size={16} aria-hidden />
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              )}

              {/* FAQ shortcut */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-black/50">
                <MessageCircle size={15} className="text-magenta shrink-0" />
                <span>
                  Looking for quick answers?{" "}
                  <a href="/program#faq" className="text-magenta underline underline-offset-2 hover:no-underline">
                    Check our FAQ
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
