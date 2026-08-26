"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Images,
  Lock,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  useClientAuth,
} from "../../context/ClientAuthContext";
import { api } from "../../lib/api";
import { OnboardingChecklist } from "../../components/portal/OnboardingChecklist";

const PROGRAMS = [
  {
    key: "core",
    name: "Core",
    weeks: 8,
    description:
      "A focused 8-week Khairo Diet Clinic journey.",
  },
  {
    key: "plus",
    name: "Plus",
    weeks: 12,
    description:
      "A longer 12-week journey with additional support.",
  },
  {
    key: "vip",
    name: "VIP",
    weeks: 12,
    description:
      "The most supported Khairo Diet Clinic journey.",
  },
];

function PreviewExperience() {
  const { client } = useClientAuth();

  const [
    starting,
    setStarting,
  ] =
    useState<string | null>(
      null
    );

  const [
    promoCode,
    setPromoCode,
  ] = useState("");

  const [
    giftCardCode,
    setGiftCardCode,
  ] = useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const subscribe = async (
    program: string
  ) => {
    setStarting(program);
    setError("");

    try {
      const response =
        await api.post<{
          authorizationUrl:
            string;
        }>(
          "/payments/initialize",
          {
            purpose:
              "new_subscription",
            program,
            promoCode:
              promoCode.trim() ||
              undefined,
            giftCardCode:
              giftCardCode.trim() ||
              undefined,
          },
          true
        );

      window.location.href =
        response.authorizationUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start payment."
      );

      setStarting(null);
    }
  };

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-8">
      {client.onboarding && (
        <section className="rounded-[24px] border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Welcome to Khairo Diet Clinic</h2>
          <p className="mt-1 text-sm text-zinc-400">Complete these first steps to get the most from your journey.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Profile complete", Boolean(client.fullName && client.phone && client.phone !== "0000000000"), "/portal/settings"],
              ["Log your first weight", Boolean(client.onboarding.loggedWeight), "/portal/log"],
              ["Book a call", Boolean(client.onboarding.bookedCall), "/portal/book"],
              ["Join the community", Boolean(client.onboarding.joinedGroup), "/portal/more"],
            ].map(([label, done, href]) => (
              <Link
                key={String(label)}
                href={String(href)}
                className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
                  done ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-black/20 text-white"
                }`}
              >
                <span>{label}</span>
                {done ? <CheckCircle2 size={16} className="text-emerald-400" /> : <span className="text-xs text-zinc-500">Start</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

<section className="overflow-hidden rounded-[30px] border border-[#0d9488]/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0d9488]/10 p-6 sm:p-8 lg:p-10">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#0d9488]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
            <Sparkles
              size={14}
            />
            Your Khairo Diet Clinic Preview
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
            See what your Khairo Diet Clinic journey could look like.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
            Explore the tools, structure and support available to subscribed Khairo Diet Clinic clients. Nothing here promises a particular result — it shows how the experience works.
          </p>
        </div>
      </section>

      <OnboardingChecklist />

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          Inside Khairo Diet Clinic
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          What unlocks when you subscribe
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon:
                ClipboardList,
              title:
                "Your Daily Plan",
              body:
                "See the meals, guidance and movement assigned for each program day.",
            },
            {
              icon:
                Activity,
              title:
                "Progress Tracking",
              body:
                "Track official weekly check-ins, measurements and professional consistency metrics.",
            },
            {
              icon: Images,
              title:
                "Photo Progress",
              body:
                "Add private bi-weekly photos and compare changes over time.",
            },
            {
              icon:
                MessageCircle,
              title:
                "Khairo Diet Clinic Support",
              body:
                "Keep appointments, guidance and support together in your portal.",
            },
          ].map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={
                    item.title
                  }
                  className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
                    <Icon
                      size={18}
                    />
                  </div>

                  <p className="mt-4 font-semibold">
                    {
                      item.title
                    }
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    {
                      item.body
                    }
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-xs text-zinc-600">
                    <Lock
                      size={12}
                    />
                    Unlocks with subscription
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          Choose when you are ready
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Start your Khairo Diet Clinic program
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Your program countdown begins only after your subscription/payment is confirmed.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 max-w-md">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Promo code
          </label>
          <input
            value={promoCode}
            onChange={(event) =>
              setPromoCode(
                event.target.value
              )
            }
            placeholder="Optional"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
          />
        </div>

        <div className="mt-4 max-w-md">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Gift card code
          </label>
          <input
            value={giftCardCode}
            onChange={(event) =>
              setGiftCardCode(
                event.target.value
              )
            }
            placeholder="Optional"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
          />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {PROGRAMS.map(
            (program) => (
              <div
                key={
                  program.key
                }
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xl font-semibold">
                  {
                    program.name
                  }
                </p>

                <p className="mt-1 text-xs font-medium text-[#0d9488]">
                  {
                    program.weeks
                  }{" "}
                  weeks
                </p>

                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {
                    program.description
                  }
                </p>

                <button
                  type="button"
                  disabled={
                    Boolean(
                      starting
                    )
                  }
                  onClick={() =>
                    void subscribe(
                      program.key
                    )
                  }
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0d9488] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {starting ===
                  program.key
                    ? "Opening payment..."
                    : `Choose ${program.name}`}
                  <ArrowRight
                    size={14}
                  />
                </button>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

function CompletedExperience() {
  const { client } =
    useClientAuth();

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-7">
      <section className="rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-zinc-900 to-emerald-500/5 p-6 sm:p-9">
        <CheckCircle2
          size={30}
          className="text-emerald-400"
        />

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
          Program Complete
        </p>

        <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-white">
          You completed your Khairo Diet Clinic journey.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
          Your progress history remains available so you can review how far you came.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/portal/log"
            className="rounded-full bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white"
          >
            View my progress
          </Link>

          <Link
            href="/portal/payments"
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300"
          >
            Continue with Khairo Diet Clinic
          </Link>
        </div>
      </section>
    </div>
  );
}

function ActiveToday() {
  const { client } =
    useClientAuth();

  if (!client) {
    return null;
  }

  const access =
    client.portalAccess;

  const firstName =
    client.fullName
      .trim()
      .split(/\s+/)[0];

  const program =
    client.program ===
    "not_sure"
      ? "Khairo Diet Clinic"
      : client.program
          .charAt(0)
          .toUpperCase() +
        client.program.slice(1);

  return (
    <div className="space-y-7">
      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0d9488]/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm text-zinc-500">
              Welcome back,
            </p>

            <h1 className="mt-1 text-4xl font-semibold tracking-tight">
              {firstName}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Here is where you are in your Khairo Diet Clinic journey today.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Program
              </p>

              <p className="mt-1 text-sm font-semibold">
                {program}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Week
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0d9488]">
                {access
                  ?.currentWeek ??
                  1}{" "}
                of{" "}
                {
                  client.cycleWeeks
                }
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                Program day
              </p>

              <p className="mt-1 text-sm font-semibold">
                {access
                  ?.programDay ??
                  1}{" "}
                of{" "}
                {access
                  ?.totalDays ??
                  client.cycleWeeks *
                    7}
              </p>
            </div>

            <div className="rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#0d9488]/70">
                Remaining
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0d9488]">
                {access
                  ?.daysRemaining ??
                  0}{" "}
                days
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          Today
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Your next steps
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link
            href="/portal/plan"
            className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 hover:border-[#0d9488]/30"
          >
            <ClipboardList
              className="text-[#0d9488]"
              size={19}
            />

            <p className="mt-4 font-semibold">
              Today&apos;s plan
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              See today&apos;s nutrition, movement and coach guidance.
            </p>
          </Link>

          <Link
            href="/portal/log"
            className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 hover:border-[#0d9488]/30"
          >
            <Activity
              className="text-[#0d9488]"
              size={19}
            />

            <p className="mt-4 font-semibold">
              Progress
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Track today and complete your official weekly progress update.
            </p>
          </Link>

          <Link
            href="/portal/book"
            className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 hover:border-[#0d9488]/30"
          >
            <CalendarDays
              className="text-[#0d9488]"
              size={19}
            />

            <p className="mt-4 font-semibold">
              Appointments
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              View upcoming appointments or request a preferred time.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function ClientPortalPage() {
  const { client } =
    useClientAuth();

  if (!client) {
    return null;
  }

  const stage =
    client.portalAccess
      ?.stage ||
    client.accountStage ||
    "active";

  if (stage === "preview") {
    return (
      <PreviewExperience />
    );
  }

  if (
    stage === "completed"
  ) {
    return (
      <CompletedExperience />
    );
  }

  if (stage === "paused") {
    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">
            Subscription Paused
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Your progress is still here.
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            Your previous Khairo Diet Clinic history remains available. Reactivate your subscription to resume new tracking, appointments and active-program features.
          </p>

          <Link
            href="/portal/payments"
            className="mt-5 inline-flex rounded-full bg-[#0d9488] px-5 py-3 text-sm font-semibold text-white"
          >
            Continue my program
          </Link>
        </section>
      </div>
    );
  }

  return <ActiveToday />;
}
