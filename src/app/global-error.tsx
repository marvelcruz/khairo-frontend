"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Khairo root render error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <main className="grid min-h-screen place-items-center px-4 py-12">
          <section className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-center shadow-2xl">
            <p className="text-lg font-semibold">KhairoDietClinic needs to reload</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              A page-level problem stopped the app from rendering correctly. Your saved data remains on the server.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
              >
                Reload app
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
