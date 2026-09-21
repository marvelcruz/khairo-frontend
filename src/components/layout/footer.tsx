import Link from "next/link";
import { homepageConfig } from "@/config/homepage";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07110e] text-[#f8f5ee]" style={{ "--footer-accent": homepageConfig.theme.accent } as React.CSSProperties}>
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-12">
        <div><p className="text-base font-semibold uppercase tracking-[0.16em]">{homepageConfig.brandName}</p><p className="mt-4 max-w-sm text-sm leading-7 text-white/55">{homepageConfig.footer.description}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--footer-accent)]">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-white/65">{homepageConfig.nav.map((item) => <Link key={`${item.label}-${item.href}`} href={item.href}>{item.label}</Link>)}</div></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--footer-accent)]">Portals</p><div className="mt-4 flex flex-col gap-3 text-sm text-white/65"><Link href={homepageConfig.portals.client}>Client Login</Link><Link href={homepageConfig.portals.staff}>Staff Portal</Link></div></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--footer-accent)]">Contact</p><div className="mt-4 flex flex-col gap-3 text-sm text-white/65">{homepageConfig.footer.email ? <a href={`mailto:${homepageConfig.footer.email}`}>{homepageConfig.footer.email}</a> : null}{homepageConfig.footer.phone ? <a href={`tel:${homepageConfig.footer.phone}`}>{homepageConfig.footer.phone}</a> : null}{homepageConfig.footer.location ? <p>{homepageConfig.footer.location}</p> : null}{!homepageConfig.footer.email && !homepageConfig.footer.phone && !homepageConfig.footer.location ? <Link href="/contact">Contact the team</Link> : null}</div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-3 px-5 py-6 text-xs text-white/40 sm:flex-row sm:px-8 lg:px-12"><p>© {new Date().getFullYear()} {homepageConfig.brandName}. All rights reserved.</p><div className="flex flex-wrap gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/medical-disclaimer">Medical Disclaimer</Link></div></div></div>
    </footer>
  );
}
