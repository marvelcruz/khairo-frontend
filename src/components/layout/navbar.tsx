"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, LockKeyhole, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "The Program", href: "/program" },
  { label: "Results", href: "/results" },
  { label: "Science", href: "/science" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 40);
  });

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isMenuOpen
            ? "bg-ink-black py-3 border-b border-white/8"
            : isScrolled
            ? "bg-ink-black/90 backdrop-blur-xl border-b border-white/8 py-3"
            : "bg-transparent py-5"
        )}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-5 2xl:px-6 flex flex-nowrap items-center justify-between gap-4 h-12 sm:h-14">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group">
            <motion.span
              className="font-display text-2xl text-pure-white tracking-[-0.02em]"
              whileHover={{ color: "var(--color-magenta)" }}
              transition={{ duration: 0.2 }}
            >
              KHAIRO
            </motion.span>
            <span className="font-display text-2xl text-emerald-600 tracking-[-0.02em]">
              
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex flex-nowrap shrink-0 items-center gap-0" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative whitespace-nowrap px-2.5 2xl:px-3.5 py-2 font-ui text-[12px] 2xl:text-sm font-medium uppercase tracking-wider transition-colors duration-200 rounded-full",
                  pathname === link.href
                    ? "text-emerald-600"
                    : "text-mist hover:text-pure-white"
                )}
              >
                {pathname === link.href && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-emerald-600/10 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* CTA + login pill */}
          <div className="hidden xl:flex flex-nowrap shrink-0 items-center gap-2">
            <ThemeToggle />

            <div className="flex flex-nowrap items-center gap-2">
              <Link
                href="/portal/login"
                title="Client login"
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/40 bg-white/10 px-3 2xl:px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wide text-pure-white transition-colors hover:bg-white/20"
              >
                <User size={13} />
                Client Login
              </Link>
              <Link
                href="/login"
                title="Admin login"
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-600/70 bg-emerald-600/15 px-3 2xl:px-4 py-2 font-ui text-xs font-semibold uppercase tracking-wide text-emerald-600 transition-colors hover:bg-emerald-600/25"
              >
                <LockKeyhole size={13} />
                Admin Login
              </Link>
            </div>
            <Button
              variant="secondary"
              size="sm"
              href="/pricing"
              className="shrink-0 whitespace-nowrap"
            >
              Pricing
            </Button>
            <Button
              variant="primary"
              size="sm"
              magnetic
              href="/pricing#apply"
              className="shrink-0 whitespace-nowrap"
            >
              Apply Now →
            </Button>
          </div>

          {/* Mobile theme + menu controls */}
          <div className="flex items-center gap-1 xl:hidden">
            <ThemeToggle />

            <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden grid h-10 w-10 place-items-center rounded-full text-mist hover:bg-white/5 hover:text-pure-white transition-colors"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-ink-black overflow-y-auto pt-20 px-4 sm:px-6 pb-6 sm:pb-8 xl:hidden flex flex-col"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            <nav className="flex flex-col gap-2 flex-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "block py-3 font-display text-2xl sm:py-4 sm:text-3xl uppercase tracking-wider border-b border-white/8 transition-colors",
                      pathname === link.href ? "text-emerald-600" : "text-pure-white"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="flex flex-col gap-2.5 mt-6 sm:gap-3 sm:mt-8"
            >
              <Button variant="primary" size="lg" href="/pricing#apply" className="w-full">
                Apply Now →
              </Button>
              <Button variant="secondary" size="lg" href="/pricing" className="w-full">
                See Pricing
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-mist hover:text-pure-white"
                >
                  <LockKeyhole size={14} />
                  Admin Login
                </Link>
                <span className="text-white/20">•</span>
                <Link
                  href="/portal/login"
                  className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-mist hover:text-pure-white"
                >
                  <User size={14} />
                  Client login
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
