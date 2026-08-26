"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CircleHelp,
  CreditCard,
  FileText,
  MessageCircle,
  Settings,
} from "lucide-react";
import { api } from "../../../lib/api";

type Notice = {
  key: string;
  title: string;
  body: string;
  href: string;
  type: string;
};

const ITEMS = [
  {
    href:
      "/portal/messages",
    label: "Messages",
    description:
      "Questions and replies from your KhairoDietClinic team.",
    icon: MessageCircle,
  },
  {
    href:
      "/portal/resources",
    label:
      "Learn & Resources",
    description:
      "Simple guidance for everyday KhairoDietClinic situations.",
    icon: BookOpen,
  },
  {
    href:
      "/portal/documents",
    label:
      "Documents & Forms",
    description:
      "Program records, forms and documents shared with you.",
    icon: FileText,
  },
  {
    href:
      "/portal/payments",
    label:
      "Payments & Program",
    description:
      "See your program and payment history.",
    icon: CreditCard,
  },
  {
    href:
      "/portal/settings",
    label:
      "Profile & Reminders",
    description:
      "Update your details and choose how KhairoDietClinic reminds you.",
    icon: Settings,
  },
  {
    href:
      "/portal/help",
    label: "Help",
    description:
      "Tell us what you need help with.",
    icon: CircleHelp,
  },
];

export default function MorePage() {
  const [
    notices,
    setNotices,
  ] = useState<Notice[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const response =
          await api.get<{
            notifications:
              Notice[];
          }>(
            "/client-experience/notifications",
            true
          );

        setNotices(
          response.notifications ||
            []
        );
      } catch {
      }
    })();
  }, []);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          More
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
          Everything else you need
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Messages, resources, documents, payments and account settings are all here.
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bell
            size={17}
            className="text-[#0d9488]"
          />

          <h2 className="font-semibold text-white">
            For you
          </h2>
        </div>

        {!notices.length ? (
          <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
            <p className="text-sm text-zinc-400">
              You are all caught up.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {notices.map(
              (notice) => (
                <Link
                  key={
                    notice.key
                  }
                  href={
                    notice.href
                  }
                  className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 transition hover:border-[#0d9488]/30"
                >
                  <p className="font-semibold text-zinc-200">
                    {
                      notice.title
                    }
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    {
                      notice.body
                    }
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488]">
                    Open
                    <ArrowRight
                      size={12}
                    />
                  </span>
                </Link>
              )
            )}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ITEMS.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className="group rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 transition hover:border-[#0d9488]/30 hover:bg-[var(--theme-surface-hover)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0d9488]/10 text-[#0d9488]">
                  <Icon
                    size={19}
                  />
                </div>

                <p className="mt-5 font-semibold text-white">
                  {
                    item.label
                  }
                </p>

                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  {
                    item.description
                  }
                </p>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0d9488]">
                  Open
                  <ArrowRight
                    size={12}
                  />
                </span>
              </Link>
            );
          }
        )}
      </section>
    </div>
  );
}
