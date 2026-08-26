"use client";

import { ArrowRight } from "lucide-react";

export function NewsletterForm() {
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 bg-white/8 border border-white/12 rounded-full px-4 py-2 text-sm text-pure-white placeholder:text-mist/50 focus:outline-none focus:border-emerald-600 transition-colors"
        aria-label="Email for newsletter"
      />
      <button
        type="submit"
        className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center hover:bg-emerald-600-deep transition-colors shrink-0"
        aria-label="Subscribe"
      >
        <ArrowRight size={14} />
      </button>
    </form>
  );
}
