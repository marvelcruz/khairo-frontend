"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function StaffResetPasswordPage() {
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
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 py-8 text-white">
      <div className="w-full max-w-sm">
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Secure recovery</p>
          <h1 className="mt-2 text-2xl font-semibold">Choose a new password</h1>

          {success ? (
            <div className="mt-6">
              <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-300">
                Your password has been updated. This recovery link cannot be used again.
              </p>
              <Link href="/login" className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#0d9488] text-sm font-semibold">
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-white/60">New password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-black/50 px-3.5 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-white/60">Confirm password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  disabled={loading}
                  className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-black/50 px-3.5 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm leading-5 text-red-400">{error}</p>
              )}

              <button disabled={loading} className="h-11 w-full rounded-full bg-[#0d9488] text-sm font-semibold disabled:opacity-60">
                {loading ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}
        </section>

        {!success && (
          <Link href="/login/forgot-password" className="mt-5 block text-center text-sm text-white/55 hover:text-white">
            Request a new link
          </Link>
        )}
      </div>
    </main>
  );
}
