"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  Gift,
  HeartHandshake,
  PackagePlus,
  RefreshCw,
  Repeat,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";

type GrowthSettings = {
  promoCodesEnabled: boolean;
  abandonedPaymentRecoveryEnabled: boolean;
  abandonedRecoveryDelayHours: number;
  abandonedRecoveryEmailEnabled: boolean;
  referralProgramEnabled: boolean;
  referralRewardType: "percentage" | "fixed";
  referralRewardValue: number;
  winBackEnabled: boolean;
  winBackThresholdDays: number;
  winBackOfferType: "percentage" | "fixed";
  winBackOfferValue: number;
  oneClickRenewalEnabled: boolean;
  giftCardsEnabled: boolean;
  upsellsEnabled: boolean;
};

type BusinessSettings = {
  growth: GrowthSettings;
};

type SettingsResponse = {
  success: boolean;
  settings: BusinessSettings;
};

const FEATURES = [
  {
    key: "promoCodesEnabled",
    title: "Promo Codes",
    description:
      "Create discount codes clients can enter at checkout.",
    icon: BadgePercent,
    manageHref: "/dashboard/promo-codes",
  },
  {
    key: "abandonedPaymentRecoveryEnabled",
    title: "Abandoned Payment Recovery",
    description:
      "Follow up automatically when a client leaves a payment incomplete.",
    icon: RefreshCw,
    manageHref: "/dashboard/business-configuration",
  },
  {
    key: "referralProgramEnabled",
    title: "Referral Program",
    description:
      "Give every client a referral code they can share.",
    icon: HeartHandshake,
    manageHref: "/dashboard/business-configuration",
  },
  {
    key: "winBackEnabled",
    title: "Win-back Offers",
    description:
      "Send a special offer automatically to inactive or expired clients.",
    icon: RotateCcw,
    manageHref: "/dashboard/business-configuration",
  },
  {
    key: "oneClickRenewalEnabled",
    title: "One-Click Renewal",
    description:
      "Let clients renew their program quickly from the portal.",
    icon: Repeat,
    manageHref: "/dashboard/business-configuration",
  },
  {
    key: "giftCardsEnabled",
    title: "Gift Cards",
    description:
      "Create and manage gift cards clients can redeem at checkout.",
    icon: Gift,
    manageHref: "/dashboard/gift-cards",
  },
  {
    key: "upsellsEnabled",
    title: "Upsells & Add-ons",
    description:
      "Offer extra coaching, supplements, or add-on services to clients.",
    icon: PackagePlus,
    manageHref: "/dashboard/products-services",
  },
] as const;

export default function RevenueGrowthPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<SettingsResponse>("/settings/business");
      setSettings(response.settings);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load revenue growth settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleFeature = async (key: keyof GrowthSettings) => {
    if (!settings || !canManage || savingKey) return;

    const current = settings.growth[key];
    if (typeof current !== "boolean") return;

    const nextGrowth = {
      ...settings.growth,
      [key]: !current,
    };

    setSavingKey(key);
    setError("");
    setNotice("");

    try {
      const response = await api.put<SettingsResponse>("/settings/business", {
        growth: nextGrowth,
      });

      setSettings(response.settings);
      setNotice("Revenue growth settings saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update revenue growth settings."
      );
    } finally {
      setSavingKey(null);
    }
  };

  if (!canManage) {
    return <div className="p-6 text-sm text-zinc-400">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
          <TrendingUp size={14} />
          Revenue Growth
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Revenue Growth Features
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)]">
          Turn revenue-generating features on or off without touching code.
          Manage detailed settings from their linked pages.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-white">
          How to use this page
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Each card below is a revenue feature. Switch it <strong>ON</strong> to make it active.
          Use the <strong>Manage</strong> link on a card to edit its detailed settings.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-400">
          <li>• <strong>Promo Codes</strong> — create discount codes clients can enter at checkout.</li>
          <li>• <strong>Abandoned Payment Recovery</strong> — automatically follow up with clients who leave a payment incomplete.</li>
          <li>• <strong>Referral Program</strong> — give each client a referral code they can share.</li>
          <li>• <strong>Win-back Offers</strong> — automatically send a special offer to inactive or expired clients.</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Changes take effect immediately after saving. You can turn any feature OFF at any time.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {loading || !settings ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-zinc-400">
          <RefreshCw size={16} className="animate-spin" />
          Loading revenue growth settings…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const enabled = Boolean(settings.growth[feature.key]);
            const saving = savingKey === feature.key;

            return (
              <div
                key={feature.key}
                className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0d9488]/10 text-[#0d9488]">
                    <Icon size={20} />
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={saving || !canManage}
                    onClick={() => void toggleFeature(feature.key)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      enabled ? "bg-[#0d9488]/80" : "bg-zinc-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <h2 className="mt-5 text-lg font-semibold text-white">
                  {feature.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {feature.description}
                </p>

                <Link
                  href={feature.manageHref}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#ff9bd5]"
                >
                  Manage
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
