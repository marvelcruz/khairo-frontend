"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, AuthProvider } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
    const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please try again.";

      setError(msg);

      if (err instanceof ApiError && err.code) setErrorCode(err.code);
      else if (msg.includes("No staff")) setErrorCode("NO_ACCOUNT");
      else if (msg.includes("deactivated")) setErrorCode("DEACTIVATED");
      else if (msg.includes("Incorrect")) setErrorCode("WRONG_PASSWORD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 py-8 sm:px-5">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0d9488] text-lg font-bold text-white">
            F
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            KHAIRO
          </span>
        </Link>

        <div className="rounded-sm border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-medium text-white">Staff sign in</h1>
          <p className="mt-1 text-sm text-white/60">KhairoDietClinic Admin Portal</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wide text-white/60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#0d9488] disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wide text-white/60"
                >
                  Password
                </label>
                <Link
                  href="/login/forgot-password"
                  className="text-xs font-medium text-[#0d9488] hover:text-teal-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#0d9488] disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-sm border border-red-500/20 bg-red-500/10 px-3 py-3"
              >
                <p className="text-sm font-medium text-red-400">{error}</p>
                {errorCode === "DEACTIVATED" ? (
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Contact a KhairoDietClinic administrator to reactivate your staff account.
                  </p>
                ) : (
                  <Link
                    href="/login/forgot-password"
                    className="mt-2 inline-flex text-xs font-semibold text-[#0d9488] hover:underline"
                  >
                    Request a secure reset link →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/40">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>

        <Link
          href="/"
          className="mt-3 block text-center text-sm text-white/60 hover:text-white"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
