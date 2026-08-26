"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../../lib/api";

export default function StaffForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post<{ message: string }>("/auth/forgot-password", { email });
      setMessage(response.message || "If an account exists, a secure reset link will be sent shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 py-8 text-white">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 inline-flex text-sm text-white/60 hover:text-white">
          ← Back to sign in
        </Link>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Secure recovery</p>
          <h1 className="mt-2 text-2xl font-semibold">Reset your staff password</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Enter your staff email. If an active account exists, KhairoDietClinic will email a one-time reset link that expires in 30 minutes.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-white/60">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-black/50 px-3.5 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
              />
            </label>

            {message && (
              <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm leading-5 text-emerald-300">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
            )}

            <button
              disabled={loading}
              className="h-11 w-full rounded-full bg-[#0d9488] text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Sending…" : "Email secure reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
