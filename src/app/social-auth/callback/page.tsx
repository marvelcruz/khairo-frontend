"use client";

import { useEffect } from "react";

export default function SocialAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const storage = params.get("storage") || "";
    const target = params.get("target") || "/";

    if (!token || !storage) {
      window.location.href = "/login";
      return;
    }

    localStorage.setItem(storage, token);
    window.location.href = target;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white">
      Signing you in securely…
    </div>
  );
}
