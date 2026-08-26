"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Newspaper,
  Gift,
  Settings,
  Ticket,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAuth, AuthProvider } from "../../context/AuthContext";
import {
  accessProfileLabel,
  canAccessRoute,
} from "../../lib/accessControl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import StaffPushNotifications from "@/components/notifications/StaffPushNotifications";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title: string; links: NavLink[]; collapsible?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Daily work",
    links: [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/dashboard/action-centre", label: "What Needs Attention", icon: Activity },
      { href: "/dashboard/crm", label: "Leads & Customers", icon: Users },
      { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/billing", label: "Payments", icon: CreditCard },
      { href: "/dashboard/subscription-lifecycle", label: "Subscription Lifecycle", icon: RefreshCw },
      { href: "/dashboard/social-media", label: "Marketing", icon: BarChart3 },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/revenue-growth", label: "Revenue Growth", icon: TrendingUp },
      { href: "/dashboard/newsletters", label: "Newsletters", icon: Newspaper },
      { href: "/dashboard/promo-codes", label: "Promo Codes", icon: Ticket },
      { href: "/dashboard/gift-cards", label: "Gift Cards", icon: Gift },
      { href: "/dashboard/setup", label: "Setup", icon: Settings },
    ],
  },
  {
    title: "Advanced settings",
    collapsible: true,
    links: [
      { href: "/dashboard/products-services", label: "Products & Services", icon: Boxes },
      { href: "/dashboard/coaching", label: "Coaching", icon: Users },
      { href: "/dashboard/week-3-review", label: "Week 3 Reviews", icon: Activity },
      { href: "/dashboard/clients/lifecycle", label: "Client Status", icon: Activity },
      { href: "/dashboard/orders", label: "Orders", icon: Boxes },
      { href: "/dashboard/broadcast", label: "Send a Message", icon: MessageSquare },
      { href: "/dashboard/accounts", label: "Staff Access", icon: Users },
      { href: "/dashboard/business-configuration", label: "KhairoDietClinic Settings", icon: Settings },
      { href: "/dashboard/workflows", label: "Automations", icon: Settings },
      { href: "/dashboard/custom-fields", label: "Extra Fields", icon: Settings },
      { href: "/dashboard/forms", label: "Forms", icon: Settings },
      { href: "/dashboard/website-content", label: "Website", icon: Settings },
      { href: "/dashboard/templates", label: "Message Templates", icon: MessageSquare },
      { href: "/dashboard/audit", label: "Activity History", icon: Activity },
      { href: "/dashboard/launch-readiness", label: "System Check", icon: Activity },
    ],
  },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, error, refresh, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && !error) router.replace("/login");
  }, [loading, user, error, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const isAllowed = canAccessRoute(user, pathname);
  useEffect(() => {
    if (!loading && user && !isAllowed && pathname !== "/dashboard") router.push("/dashboard");
  }, [loading, user, isAllowed, pathname, router]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        links: group.links.filter((link) => canAccessRoute(user, link.href)),
      })).filter((group) => group.links.length),
    [user]
  );

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[var(--theme-page)] text-sm text-[var(--theme-text-secondary)]">Loading…</div>;
  }

  if (error && !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--theme-page)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 text-center">
          <p className="text-sm font-semibold text-white">We can’t connect right now</p>
          <p className="mt-2 text-sm leading-6 text-[var(--theme-text-secondary)]">Your session is safe. Please try again.</p>
          <button type="button" onClick={() => void refresh()} className="mt-5 h-10 rounded-full bg-[#0d9488] px-5 text-xs font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  const initials = (user.name || "A").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  const nav = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-[var(--theme-border)] px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0d9488] text-sm font-bold text-white">F</span>
          <span className="text-base font-semibold tracking-tight text-white">FITLUNGE</span>
        </Link>
        <button type="button" onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--theme-border)] text-white lg:hidden" aria-label="Close menu"><X size={18} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {visibleGroups.map((group) => {
          const isAdvanced = group.title === "Advanced settings";
          const showLinks = !isAdvanced || advancedOpen;
          return (
            <div key={group.title} className="mb-3">
              {isAdvanced ? (
                <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">
                  Advanced settings <ChevronDown size={14} className={advancedOpen ? "rotate-180" : ""} />
                </button>
              ) : null}
              {showLinks && (
                <div className="space-y-0.5">
                  {group.links.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive(href) ? "bg-[#0d9488]/10 text-[#0d9488]" : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-white"}`}>
                      <Icon size={18} className="shrink-0" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--theme-border)] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--theme-surface-soft)] text-xs font-semibold text-white">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-[var(--theme-text-secondary)]">{accessProfileLabel(user)}</p>
          </div>
          <ThemeToggle className="h-10 w-10" />
          <button type="button" onClick={async () => { await logout(); router.push("/"); }} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-secondary)]" aria-label="Log out"><LogOut size={16} /></button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-page)]">
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-page)] px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#0d9488] text-sm font-bold text-white">F</span><span className="font-semibold text-white">FITLUNGE</span></Link>
        <button type="button" onClick={() => setDrawerOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--theme-border)] text-white" aria-label="Open menu"><Menu size={18} /></button>
      </header>

      {drawerOpen && <button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setDrawerOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-72 flex-col border-r border-[var(--theme-border)] bg-[var(--theme-page)] transition-transform lg:w-64 lg:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {nav}
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1800px] px-3 py-4 min-[360px]:px-4 sm:px-5 sm:py-6 md:px-8 lg:px-10 lg:py-8">
          <StaffPushNotifications />
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><DashboardShell>{children}</DashboardShell></AuthProvider>;
}
