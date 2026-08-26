"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useClientAuth,
} from "../../../context/ClientAuthContext";

function RegisterForm() {
  const router =
    useRouter();

  const { register } =
    useClientAuth();

  const [
    form,
    setForm,
  ] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    referralCode: "",
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submit = async (
    event:
      React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (
      form.password.length <
      8
    ) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (
      form.password !==
      form.confirm
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      await register(
        form.fullName,
        form.email,
        form.phone,
        form.password,
        form.referralCode
      );

      router.push(
        "/portal"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[var(--theme-page)] px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/portal/login"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft
            size={15}
          />
          Back to sign in
        </Link>

        <div className="mt-8 rounded-[26px] border border-white/10 bg-[var(--theme-surface)] p-5 shadow-2xl sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
            Free KhairoDietClinic Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            See what your KhairoDietClinic journey could look like.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Creating an account is free. Explore the client experience before choosing a program.
          </p>

          <div className="mt-5 space-y-2 rounded-2xl border border-white/8 bg-black/20 p-4">
            {[
              "Preview your future dashboard",
              "See how progress tracking works",
              "Explore KhairoDietClinic programs",
              "Subscribe only when you are ready",
            ].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-zinc-400"
                >
                  <CheckCircle2
                    size={15}
                    className="text-[#0d9488]"
                  />
                  {item}
                </div>
              )
            )}
          </div>

          <form
            onSubmit={submit}
            className="mt-6 space-y-4"
          >
            {[
              [
                "fullName",
                "Your name",
                "text",
                "Full name",
              ],
              [
                "email",
                "Email address",
                "email",
                "you@example.com",
              ],
              [
                "phone",
                "Phone number",
                "tel",
                "Your phone number",
              ],
            ].map(
              ([
                key,
                label,
                type,
                placeholder,
              ]) => (
                <label
                  key={key}
                  className="block"
                >
                  <span className="mb-1.5 block text-sm font-medium text-zinc-300">
                    {label}
                  </span>

                  <input
                    required
                    type={type}
                    value={
                      form[
                        key as
                          | "fullName"
                          | "email"
                          | "phone"
                      ]
                    }
                    placeholder={
                      placeholder
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]:
                          e.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none focus:border-[#0d9488]"
                  />
                </label>
              )
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">
                Referral code <span className="text-zinc-600">(optional)</span>
              </span>

              <input
                type="text"
                value={form.referralCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    referralCode: e.target.value,
                  })
                }
                placeholder="Enter a friend's code"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">
                Create a password
              </span>

              <div className="relative">
                <input
                  required
                  minLength={8}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.password
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password:
                        e.target.value,
                    })
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 pr-12 text-sm text-white outline-none focus:border-[#0d9488]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                >
                  {showPassword ? (
                    <EyeOff
                      size={17}
                    />
                  ) : (
                    <Eye
                      size={17}
                    />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">
                Confirm password
              </span>

              <input
                required
                type="password"
                value={
                  form.confirm
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirm:
                      e.target.value,
                  })
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="h-12 w-full rounded-full bg-[#0d9488] text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Creating your account..."
                : "Create my free account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-600">
            No payment is required to create your account.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <RegisterForm />
  );
}
