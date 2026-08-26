"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import FormRenderer, { FormDefinition } from "@/components/forms/FormRenderer";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let active = true;

    api.get<{ form: FormDefinition }>(
      `/forms/public/${encodeURIComponent(slug)}`
    )
      .then((response) => {
        if (active) setForm(response.form);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "This form is unavailable."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main style={{ colorScheme: "dark", color: "#ffffff" }} className="min-h-screen bg-[#090a0b] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-xl">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#111214] p-8 text-sm text-white/70">
            <Loader2 size={18} className="animate-spin text-[#0d9488]" />
            Loading form…
          </div>
        ) : error || !form ? (
          <div className="rounded-3xl border border-white/10 bg-[#111214] p-7 sm:p-9">
            <h1 className="text-2xl font-semibold text-white">
              Form unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {error || "This form is not currently available."}
            </p>
          </div>
        ) : (
          <section
            data-testid="public-form"
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#111214] shadow-2xl shadow-black/40"
          >
            <header className="border-b border-white/10 bg-gradient-to-br from-white/[0.055] to-transparent p-6 sm:p-8 lg:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75">
                <ShieldCheck size={14} className="text-[#ff4db2]" />
                Secure Khairo Diet Clinic form
              </div>

              <h1 style={{ color: "#ffffff" }} className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                {form.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                {form.description ||
                  "Tell us a little about yourself and what you would like Khairo Diet Clinic to help you achieve. This should take about 2 minutes."}
              </p>

              <p className="mt-3 text-xs text-white/45">
                Fields marked * are required.
              </p>
            </header>

            <div className="bg-[#111214] p-5 text-white sm:p-8 lg:p-10">
              <FormRenderer form={form} mode="public" />
            </div>
          </section>
        )}

        <p className="mt-5 text-center text-xs text-white/40">
          Khairo Diet Clinic · Secure form submission
        </p>
      </div>
    </main>
  );
}
