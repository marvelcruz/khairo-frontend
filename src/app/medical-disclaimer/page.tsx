export default function MedicalDisclaimerPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Medical Disclaimer</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective: August 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-300">
          <p>
            Khairo Diet Clinic is not a medical provider. The information and services provided through the Khairo Diet Clinic platform, website, and portal are for general wellness and weight-management purposes only.
          </p>
          <p>
            No content on this platform should be interpreted as medical advice, diagnosis, or treatment. You should consult a qualified healthcare professional before beginning any weight-loss, nutrition, or exercise program.
          </p>
          <p>
            Where medical review is provided, it is performed by licensed clinicians. Medical review is intended to support program safety and does not replace your relationship with your own physician.
          </p>
          <p>
            If you have a medical emergency, contact your local emergency services immediately.
          </p>
        </div>
      </div>
    </main>
  );
}
