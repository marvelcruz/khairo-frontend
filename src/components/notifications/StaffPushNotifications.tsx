"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0))
  );
}

export default function StaffPushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState("");

  const registerSubscription = useCallback(async () => {
    const registration = await navigator.serviceWorker.register("/sw.js");

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await api.post("/auth/push/subscribe", {
        subscription: existing.toJSON(),
      });
      return;
    }

    const { publicKey } = await api.get<{
      success: boolean;
      publicKey: string;
    }>("/auth/push/public-key");

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await api.post("/auth/push/subscribe", {
      subscription: subscription.toJSON(),
    });
  }, []);

  useEffect(() => {
    const available =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(available);

    if (!available) return;

    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      void registerSubscription().catch(() => {
        // Registration can be retried later without blocking the dashboard.
      });
    }
  }, [registerSubscription]);

  const enableNotifications = async () => {
    setEnabling(true);
    setError("");

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Notifications were not enabled.");
        return;
      }

      await registerSubscription();
    } catch {
      setError("Could not enable notifications.");
    } finally {
      setEnabling(false);
    }
  };

  if (!supported || permission === "granted") return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Bell className="mt-0.5 shrink-0 text-[#0d9488]" size={18} />
        <div>
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            Get instant Khairo Diet Clinic alerts
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--theme-text-secondary)]">
            Enable notifications so assigned leads can reach you immediately.
          </p>
          {error && (
            <p className="mt-1 text-xs text-amber-300">{error}</p>
          )}
        </div>
      </div>

      {permission === "default" && (
        <button
          type="button"
          onClick={() => void enableNotifications()}
          disabled={enabling}
          className="h-9 shrink-0 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white disabled:opacity-60"
        >
          {enabling ? "Enabling…" : "Enable notifications"}
        </button>
      )}

      {permission === "denied" && (
        <span className="shrink-0 text-xs text-[var(--theme-text-muted)]">
          Notifications are blocked in this browser.
        </span>
      )}
    </div>
  );
}
