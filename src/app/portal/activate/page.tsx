"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ClientActivatePage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const requestActivation = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/client-auth/request-activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not request an activation link.");
      setMessage(data.message || "If an eligible client record exists, a secure activation link will be sent shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request an activation link.");
    } finally {
      setLoading(false);
    }
  };

  const activate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This activation link is missing its security token. Request a new link.");
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
      const response = await fetch(`${API}/client-auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not activate your account.");
      setActivated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate your account.");
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Secure activation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Activate your Khairo Diet Clinic account</h1>

          {activated ? (
            <div className="mt-6">
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-300">
                Your account is active. The activation link cannot be used again.
              </p>
              <Link href="/portal/login" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#0d9488] text-sm font-semibold">
                Sign in to Khairo Diet Clinic
              </Link>
            </div>
          ) : token ? (
            <>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                This secure link verified access to the email on your Khairo Diet Clinic record. Choose the password you will use to sign in.
              </p>

              <form onSubmit={activate} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-zinc-300">Create password</span>
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
                  {loading ? "Activating…" : "Activate account"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Already enrolled with Khairo Diet Clinic? Enter the email address on your client record. We will send a one-time activation link that expires in 24 hours.
              </p>

              <form onSubmit={requestActivation} className="mt-6 space-y-4">
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
                  <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-300">{message}</p>
                )}
                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
                )}

                <button disabled={loading} className="h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold disabled:opacity-60">
                  {loading ? "Sending…" : "Email secure activation link"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
