"use client";

import {
  useEffect,
  useMemo,
} from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Home,
  LogOut,
  MoreHorizontal,
  Newspaper,
  Sparkles,
} from "lucide-react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  ClientAuthProvider,
  useClientAuth,
} from "../../context/ClientAuthContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const PUBLIC_PATHS = [
  "/portal/login",
  "/portal/activate",
  "/portal/register",
  "/portal/forgot-password",
  "/portal/reset-password",
];

const FULL_NAV = [
  {
    href: "/portal",
    label: "Today",
    icon: Home,
  },
  {
    href: "/portal/newsletters",
    label: "News",
    icon: Newspaper,
  },
  {
    href: "/portal/what-you-get",
    label: "What You Get",
    icon: CheckCircle2,
  },
  {
    href: "/portal/log",
    label: "Progress",
    icon: Activity,
  },
  {
    href: "/portal/plan",
    label: "My Plan",
    icon: ClipboardList,
  },
  {
    href: "/portal/book",
    label: "Appointments",
    icon: CalendarDays,
  },
  {
    href: "/portal/more",
    label: "More",
    icon: MoreHorizontal,
  },
];

const PREVIEW_NAV = [
  {
    href: "/portal",
    label: "Explore",
    icon: Sparkles,
  },
  {
    href: "/portal/newsletters",
    label: "News",
    icon: Newspaper,
  },
  {
    href: "/portal/what-you-get",
    label: "What You Get",
    icon: CheckCircle2,
  },
  {
    href: "/portal/more",
    label: "More",
    icon: MoreHorizontal,
  },
];

function PortalShell({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const {
    client,
    loading,
    error,
    refresh,
    logout,
  } =
    useClientAuth();

  const publicPage =
    PUBLIC_PATHS.includes(
      pathname
    );

  const stage =
    client?.portalAccess
      ?.stage ||
    client?.accountStage ||
    "active";

  const preview =
    stage === "preview";

  const allowedPreviewPaths = useMemo(
    () => [
      "/portal",
      "/portal/more",
      "/portal/settings",
      "/portal/payments",
      "/portal/resources",
      "/portal/help",
      "/portal/what-you-get",
      "/portal/newsletters",
    ],
    []
  );

  useEffect(() => {
    if (
      !publicPage &&
      !loading &&
      !client &&
      !error
    ) {
      router.replace(
        "/portal/login"
      );

      return;
    }

    if (
      client &&
      preview &&
      !allowedPreviewPaths.some(
        (path) =>
          pathname === path ||
          pathname.startsWith(
            `${path}/`
          )
      )
    ) {
      router.replace(
        "/portal"
      );
    }
  }, [
    publicPage,
    loading,
    client,
    error,
    preview,
    pathname,
    router,
    allowedPreviewPaths,
  ]);

  if (publicPage) {
    return (
      <>
        {children}

        <div className="fixed bottom-4 right-4 z-[80]">
          <ThemeToggle className="bg-[var(--theme-surface)] shadow-lg" />
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[var(--theme-page)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0d9488] border-t-transparent" />
      </div>
    );
  }

  if (
    error &&
    !client
  ) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[var(--theme-page)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 text-center">
          <p className="text-sm font-semibold text-white">
            KhairoDietClinic is temporarily unable to connect
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Your session has been preserved. Please retry the connection.
          </p>

          <button
            type="button"
            onClick={() =>
              void refresh()
            }
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#0d9488] px-5 text-xs font-semibold text-white"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[var(--theme-page)] text-sm text-zinc-500">
        Redirecting…
      </div>
    );
  }

  const nav =
    preview
      ? PREVIEW_NAV
      : FULL_NAV;

  const active = (
    href: string
  ) =>
    href === "/portal"
      ? pathname ===
        "/portal"
      : pathname.startsWith(
          href
        );

  const handleLogout =
    async () => {
      await logout();

      router.push(
        "/portal/login"
      );
    };

  return (
    <div className="min-h-[100svh] bg-[var(--theme-page)] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-[var(--theme-border-soft)] bg-[var(--theme-surface)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/portal"
            className="flex items-center gap-2"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0d9488] text-sm font-bold">
              F
            </span>

            <span className="text-sm font-bold">
              FIT
              <span className="text-[#0d9488]">
                LUNGE
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(
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
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                      active(
                        item.href
                      )
                        ? "bg-[#0d9488] text-white"
                        : "text-zinc-500 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={16}
                    />
                    {
                      item.label
                    }
                  </Link>
                );
              }
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="h-9 w-9" />

            {preview && (
              <span className="hidden rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-1.5 text-[11px] font-semibold text-[#0d9488] sm:block">
                Preview Account
              </span>
            )}

            <span className="hidden text-xs text-zinc-500 sm:block">
              {
                client.fullName
              }
            </span>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-500 hover:text-white"
              aria-label="Log out"
            >
              <LogOut
                size={15}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8">
        {children}
      </main>

      <nav
        className={`fixed inset-x-2 bottom-2 z-50 grid rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-1.5 shadow-2xl backdrop-blur-xl md:hidden ${
          preview
            ? "grid-cols-3"
            : "grid-cols-3"
        }`}
      >
        {nav.map(
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
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium ${
                  active(
                    item.href
                  )
                    ? "bg-[#0d9488]/15 text-[#0d9488]"
                    : "text-zinc-500"
                }`}
              >
                <Icon
                  size={18}
                />

                <span>
                  {
                    item.label
                  }
                </span>
              </Link>
            );
          }
        )}
      </nav>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <ClientAuthProvider>
      <PortalShell>
        {children}
      </PortalShell>
    </ClientAuthProvider>
  );
}
