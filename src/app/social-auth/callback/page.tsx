"use client";

import { useEffect } from "react";

function safeTarget(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default function SocialAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = safeTarget(params.get("target"));

    // Older OAuth callbacks may still contain token/storage parameters in a
    // user's history. Never read or persist them; remove the query string before
    // navigating so browser history and copied URLs do not retain credentials.
    window.history.replaceState({}, "", "/social-auth/callback");
    window.location.replace(target);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white">
      Signing you in securely…
    </div>
  );
}
