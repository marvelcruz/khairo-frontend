export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Refund & Cancellation Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective: August 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Cancellation</h2>
            <p>You may request cancellation by contacting Khairo Diet Clinic support. Cancellation does not automatically refund payments already processed.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">2. Refunds</h2>
            <p>Refund eligibility depends on program terms and payment status. We may offer refunds for eligible cancellations at our discretion and in accordance with applicable law.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">3. Payment Disputes</h2>
            <p>If you believe there has been a billing error, contact Khairo Diet Clinic support before initiating a chargeback. We will investigate and respond within a reasonable timeframe.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">4. Contact</h2>
            <p>For refund or cancellation requests, contact Khairo Diet Clinic through the portal support page or WhatsApp.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
