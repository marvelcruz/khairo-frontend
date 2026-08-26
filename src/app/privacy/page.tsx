export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective: August 2026</p>

        <div className="mt-8 space-y-10 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Who We Are</h2>
            <p>
              KhairoDietClinic provides a weight-loss program and client portal. This policy explains how we collect, use, share, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Program interest and goals</li>
              <li>Consultation and appointment details</li>
              <li>Payment and subscription status</li>
              <li>Daily tracking data such as weight, calories, water, steps, meals, and workouts</li>
              <li>Progress photos you upload</li>
              <li>Messages you send through the portal</li>
              <li>Information provided through forms, WhatsApp, or other communication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Clinical and Health Information</h2>
            <p>
              Medical review information is collected where applicable and is accessible only to authorized clinical staff. Clinical data is used solely to support program safety and service delivery. It is not used for marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and manage your program</li>
              <li>Book consultations and appointments</li>
              <li>Process payments and subscriptions</li>
              <li>Send service-related messages, reminders, and notifications</li>
              <li>Improve portal functionality and client support</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Communication and Consent</h2>
            <p>
              We send essential service communications to support your program. Marketing communications, including WhatsApp marketing, are sent only where you have provided consent. You may withdraw marketing consent at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Sharing</h2>
            <p>
              We do not sell personal information. We may share information with trusted service providers who help us deliver KhairoDietClinic, including payment processors, email providers, hosting services, and clinical platforms where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Data Retention</h2>
            <p>
              We retain personal, financial, and clinical information only as long as needed for business, legal, and regulatory purposes. Archived records are protected and only deleted when legally appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data where legally permitted</li>
              <li>Withdraw marketing consent</li>
              <li>Ask questions about how your data is used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">9. Security</h2>
            <p>
              KhairoDietClinic uses role-based access controls, secure session tokens, HTTPS, and protected storage. However, no online system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">10. Contact</h2>
            <p>
              For privacy requests or questions, contact the KhairoDietClinic team through WhatsApp or the contact page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
