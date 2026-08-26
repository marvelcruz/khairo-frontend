"use client";

import Link from "next/link";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ClientForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/client-auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not request a reset link.");
      setMessage(data.message || "If an account exists, a secure reset link will be sent shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100svh] place-items-center bg-[var(--theme-page)] px-4 py-8 text-white">
      <div className="w-full max-w-md">
        <Link href="/portal/login" className="mb-6 inline-flex text-sm text-zinc-500 hover:text-white">
          ← Back to sign in
        </Link>

        <section className="rounded-[24px] border border-white/10 bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Secure recovery</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Enter your KhairoDietClinic email. If an active client account exists, we will email a one-time reset link that expires in 30 minutes.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
              />
            </label>

            {message && (
              <p className="rounded-xl border border-emerald-600/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-300">{message}</p>
            )}
            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
            )}

            <button disabled={loading} className="h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold disabled:opacity-60">
              {loading ? "Sending…" : "Email secure reset link"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
