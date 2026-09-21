"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { homepageConfig } from "@/config/homepage";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <header className="fixed inset-x-0 top-0 z-[70] border-b border-white/10 bg-[#07110e]/85 text-[#f8f5ee] backdrop-blur-xl" style={{ "--nav-accent": homepageConfig.theme.accent } as React.CSSProperties}>
      <div className="border-b border-white/10"><div className="mx-auto flex h-8 max-w-[1440px] items-center justify-end gap-4 px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:px-8 lg:px-12"><Link href={homepageConfig.portals.client}>Client Login</Link><span className="h-3 w-px bg-white/15" /><Link href={homepageConfig.portals.staff}>Staff Login</Link></div></div>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${homepageConfig.brandName} home`}>{homepageConfig.logoSrc ? <img src={homepageConfig.logoSrc} alt={homepageConfig.brandName} className="max-h-10 w-auto max-w-[180px] object-contain" /> : <span className="truncate text-base font-semibold uppercase tracking-[0.16em] sm:text-lg">{homepageConfig.brandName}</span>}</Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">{homepageConfig.nav.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 hover:bg-white/5 hover:text-white">{item.label}</Link>)}</nav>
        <Link href={homepageConfig.primaryCta.href} className="hidden min-h-10 items-center rounded-full bg-[var(--nav-accent)] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1b160d] lg:inline-flex">{homepageConfig.primaryCta.label}</Link>
        <button type="button" className="grid h-10 min-w-16 place-items-center rounded-full border border-white/15 px-3 text-xs font-semibold uppercase tracking-[0.12em] lg:hidden" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="mobile-standard-nav">{open ? "Close" : "Menu"}</button>
      </div>
      {open ? <div id="mobile-standard-nav" className="border-t border-white/10 bg-[#07110e] px-5 pb-6 pt-4 lg:hidden"><nav className="mx-auto flex max-w-[1440px] flex-col">{homepageConfig.nav.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href} className="border-b border-white/10 py-4 text-xl font-semibold">{item.label}</Link>)}</nav><div className="mx-auto mt-5 grid max-w-[1440px] gap-2 sm:grid-cols-3"><Link href={homepageConfig.primaryCta.href} className="rounded-full bg-[var(--nav-accent)] px-5 py-3 text-center text-sm font-semibold text-[#1b160d]">{homepageConfig.primaryCta.label}</Link><Link href={homepageConfig.portals.client} className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold">Client Login</Link><Link href={homepageConfig.portals.staff} className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold">Staff Login</Link></div></div> : null}
    </header>
  );
}
