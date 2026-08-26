"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export function MobileStickyBar() {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setShow(v > 300);
  });

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      initial={{ y: 80 }}
      animate={{ y: show ? 0 : 80 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-ink-black/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 safe-area-pb sm:px-4 sm:py-3">
        <Link
          href="/pricing#apply"
          className="flex items-center justify-center w-full h-12 bg-emerald-600 rounded-full font-ui font-bold text-pure-white text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(236,0,140,0.4)] hover:bg-emerald-600-deep transition-colors"
        >
          Apply Now — Start Your Journey →
        </Link>
      </div>
    </motion.div>
  );
}
