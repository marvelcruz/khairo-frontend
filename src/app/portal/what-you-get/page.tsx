import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Secure Login & Account Access",
    items: [
      "Sign in with email and password",
      "Sign in with Google",
      "Sign in with Apple",
      "Secure account recovery and activation links",
      "Personal dashboard only you can access",
    ],
  },
  {
    icon: ClipboardList,
    title: "Your Program Overview",
    items: [
      "See your program name and plan",
      "Track your start date and program end date",
      "See how many weeks your program runs",
      "Know your current stage: preview, active, paused, or completed",
    ],
  },
  {
    icon: Activity,
    title: "Daily Tracking",
    items: [
      "Log your weight",
      "Track calories",
      "Track water intake",
      "Track daily steps",
      "Mark workouts as complete",
      "Mark meals as complete",
      "Complete exercises",
      "Add personal notes for the day",
    ],
  },
  {
    icon: Sparkles,
    title: "Meal Plans & Timetable",
    items: [
      "View your daily meal checklist",
      "Follow a weekly or full-cycle meal timetable",
      "See meal items for morning, afternoon, and evening",
      "View exercises for each program day",
    ],
  },
  {
    icon: HeartPulse,
    title: "Coaching & Check-Ins",
    items: [
      "See your coach assignments",
      "Complete onboarding steps after joining",
      "Receive Week 3 review prompts",
      "Get reminders and supportive messages",
      "Receive milestone recognition for consistency",
    ],
  },
  {
    icon: MessageCircle,
    title: "Communication",
    items: [
      "Receive messages from the Khairo Diet Clinic team",
      "Get helpful service emails",
      "Receive WhatsApp reminders where consent is given",
      "See important announcements in the portal",
    ],
  },
  {
    icon: WalletCards,
    title: "Payments & Subscriptions",
    items: [
      "View your program payment status",
      "Make payment securely through Paystack",
      "See your active subscription period",
      "Receive renewal reminders before your program renews",
    ],
  },
  {
    icon: CalendarDays,
    title: "Resources & Support",
    items: [
      "Access program documents",
      "Get help from the Khairo Diet Clinic team",
      "Contact support via WhatsApp",
      "Find answers to common questions",
    ],
  },
  {
    icon: Lock,
    title: "Privacy & Data Protection",
    items: [
      "Your personal and clinical data is protected",
      "Only authorized staff can see your information",
      "You control communication preferences",
      "Terms and Privacy Policy are available",
    ],
  },
];

export default function WhatYouGetPage() {
  return (
    <div className="mx-auto max-w-5xl pb-24 pt-2 md:pb-12">
      <header className="overflow-hidden rounded-[30px] border border-[#0d9488]/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0d9488]/10 p-6 sm:p-8 lg:p-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#0d9488]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
          <Sparkles size={14} />
          Inside Your Khairo Diet Clinic
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
          What you get as a Khairo Diet Clinic client
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          A simple overview of the tools, structure, and support available inside your Khairo Diet Clinic client portal.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="rounded-[24px] border border-white/10 bg-zinc-900/70 p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0d9488]/10 text-[#0d9488]">
                  <Icon size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white">
                    {feature.title}
                  </h2>

                  <ul className="mt-3 space-y-2">
                    {feature.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm leading-6 text-zinc-400"
                      >
                        <CheckCircle2
                          size={15}
                          className="mt-1 shrink-0 text-[#0d9488]"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/portal"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0d9488] px-6 text-sm font-semibold text-white hover:bg-[#0f766e]"
        >
          Back to portal
        </Link>
      </div>
    </div>
  );
}
