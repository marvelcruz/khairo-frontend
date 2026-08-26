"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ClientResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its security token. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/client-auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not reset your password.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100svh] place-items-center bg-[var(--theme-page)] px-4 py-8 text-white">
      <div className="w-full max-w-md">
        <section className="rounded-[24px] border border-white/10 bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Secure recovery</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a new password</h1>

          {success ? (
            <div className="mt-6">
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-300">
                Your password has been updated. This recovery link cannot be used again.
              </p>
              <Link href="/portal/login" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#0d9488] text-sm font-semibold">
                Sign in to Khairo Diet Clinic
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-300">New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-300">Confirm password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                />
              </label>

              {error && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-5 text-red-400">{error}</p>
              )}

              <button disabled={loading} className="h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold disabled:opacity-60">
                {loading ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}
        </section>

        {!success && (
          <Link href="/portal/forgot-password" className="mt-5 block text-center text-sm text-zinc-500 hover:text-white">
            Request a new link
          </Link>
        )}
      </div>
    </main>
  );
}
