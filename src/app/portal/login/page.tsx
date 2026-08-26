"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useClientAuth } from "../../../context/ClientAuthContext";
import { ApiError } from "../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ClientLoginPage() {
  const { login } = useClientAuth();
  const router = useRouter();
    const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      await login(email, password);
      router.push("/portal");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in. Please try again.";
      setError(message);
      if (err instanceof ApiError && err.code) setErrorCode(err.code);
      else if (message.includes("No account")) setErrorCode("NO_ACCOUNT");
      else if (message.includes("activated")) setErrorCode("NOT_ACTIVATED");
      else if (message.includes("Incorrect")) setErrorCode("WRONG_PASSWORD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[var(--theme-page)] px-4 py-6 text-white sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#0d9488]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[110px]" />

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0d9488] font-bold">F</span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">KHAIRO<span className="text-[#0d9488]"></span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white">
            <ArrowLeft size={15} /> Back
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_430px]">
          <section className="hidden lg:block">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
              <Sparkles size={14} /> Your KhairoDietClinic
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              Your plan, progress and support in one place.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-500">
              Sign in securely to continue your KhairoDietClinic journey.
            </p>
            <div className="mt-8 flex items-start gap-3 text-sm text-zinc-400">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#0d9488]" />
              <p>Account recovery and first-time activation now use one-time links sent to the email on your KhairoDietClinic account.</p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[430px] rounded-[24px] border border-white/10 bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">Client sign in</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Sign in to continue your KhairoDietClinic journey.</p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-300">Email address</span>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/35 pl-11 pr-4 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between gap-4 text-sm font-medium text-zinc-300">
                  Password
                  <Link href="/portal/forgot-password" className="text-xs font-medium text-[#0d9488] hover:text-teal-500">
                    Forgot password?
                  </Link>
                </span>
                <div className="relative">
                  <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/35 pl-11 pr-12 text-sm outline-none focus:border-[#0d9488] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-400">{error}</p>
                  {errorCode === "WRONG_PASSWORD" && (
                    <Link href="/portal/forgot-password" className="mt-2 inline-flex text-xs font-semibold text-[#0d9488] hover:underline">
                      Request a secure reset link →
                    </Link>
                  )}
                  {(errorCode === "NOT_ACTIVATED" || errorCode === "NO_ACCOUNT") && (
                    <Link href="/portal/activate" className="mt-2 inline-flex text-xs font-semibold text-[#0d9488] hover:underline">
                      Request a secure activation link →
                    </Link>
                  )}
                </div>
              )}

              <button disabled={loading} className="h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold shadow-[0_10px_35px_rgba(236,0,140,0.18)] disabled:opacity-60">
                {loading ? "Signing in…" : "Sign in to KhairoDietClinic"}
              </button>
            </form>

            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/8"></div>
                </div>
                <div className="relative flex justify-center text-xs text-zinc-500">
                  <span className="bg-[var(--theme-surface)] px-3">or continue with</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <a href={`${API_BASE}/client-auth/google`} className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-sm font-semibold text-white hover:bg-white/5">
                  Google
                </a>
                <a href={`${API_BASE}/client-auth/apple`} className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-sm font-semibold text-white hover:bg-white/5">
                  Apple
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/8 pt-5 sm:grid-cols-2">
              <Link href="/portal/activate" className="flex min-h-11 items-center justify-center rounded-full border border-[#0d9488]/35 bg-[#0d9488]/5 px-4 text-center text-sm font-semibold text-[#0d9488]">
                Already enrolled? Activate
              </Link>
              <Link href="/portal/register" className="flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-center text-sm font-semibold text-zinc-300 hover:text-white">
                Create free account
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white">Terms</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
