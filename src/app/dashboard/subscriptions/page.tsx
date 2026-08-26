"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Search,
} from "lucide-react";

import {
  ProductsServicesHeader,
} from "@/components/products-services/ProductsServicesHeader";

import { api } from "@/lib/api";

import type {
  Subscription,
  SubscriptionListResponse,
  SubscriptionStatus,
} from "@/lib/products-services/subscriptions";

const STATUS_FILTERS: Array<
  "all" | SubscriptionStatus
> = [
  "all",
  "active",
  "grace_period",
  "paused",
  "pending",
  "expired",
  "cancelled",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function labelStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function offeringLabel(subscription: Subscription) {
  if (subscription.offering?.name) {
    return subscription.offering.name;
  }

  return subscription.program
    ? labelStatus(subscription.program)
    : "Unknown offering";
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<"all" | SubscriptionStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.get<SubscriptionListResponse>(
          "/subscriptions",
          {
            params: {
              status: "all",
              limit: 200,
            },
          }
        );

      setSubscriptions(
        response.subscriptions || []
      );
    } catch (err) {
      setSubscriptions([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load subscriptions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return subscriptions.filter(
      (subscription) => {
        if (
          status !== "all" &&
          subscription.status !== status
        ) {
          return false;
        }

        if (!term) return true;

        return [
          subscription.client?.fullName || "",
          subscription.client?.email || "",
          offeringLabel(subscription),
          subscription.program || "",
          subscription.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      }
    );
  }, [subscriptions, query, status]);

  const activeCount = subscriptions.filter(
    (subscription) =>
      subscription.status === "active" ||
      subscription.status === "grace_period"
  ).length;

  const autoRenewCount = subscriptions.filter(
    (subscription) =>
      subscription.autoRenew &&
      (
        subscription.status === "active" ||
        subscription.status === "grace_period"
      )
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <ProductsServicesHeader
        title="Subscriptions"
        description="Real customer subscription relationships created and maintained by KhairoDietClinic payment and activation workflows."
        badge="Connected"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="text-xs text-[var(--theme-text-muted)]">
            Total subscriptions
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {subscriptions.length}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="text-xs text-[var(--theme-text-muted)]">
            Active / grace period
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {activeCount}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
          <div className="text-xs text-[var(--theme-text-muted)]">
            Auto-renew enabled
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {autoRenewCount}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
            <Search className="h-4 w-4 text-[var(--theme-text-muted)]" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search customer or offering"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            />
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] px-4 text-sm text-[var(--theme-text-secondary)] hover:bg-neutral-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-semibold ${
                status === value
                  ? "bg-pink-500 text-white"
                  : "border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
              }`}
            >
              {labelStatus(value)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          Loading subscriptions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] p-10 text-center text-sm text-[var(--theme-text-muted)]">
          No subscriptions match the current filters.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filtered.map((subscription) => (
              <article
                key={subscription._id}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">
                      {subscription.client?.fullName ||
                        "Unknown client"}
                    </div>

                    <div className="mt-1 text-sm text-[var(--theme-text-muted)]">
                      {offeringLabel(subscription)}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-[var(--theme-border)] px-2 py-1 text-[11px] text-[var(--theme-text-secondary)]">
                    {labelStatus(
                      subscription.status
                    )}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--theme-border)] pt-3 text-sm">
                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">
                      Amount
                    </div>
                    <div className="mt-1 text-[var(--theme-text)]">
                      {formatMoney(
                        subscription.amount
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">
                      Renewal
                    </div>
                    <div className="mt-1 text-[var(--theme-text)]">
                      {formatDate(
                        subscription.currentPeriodEnd
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">
                      Auto-renew
                    </div>
                    <div className="mt-1 text-[var(--theme-text)]">
                      {subscription.autoRenew
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--theme-text-muted)]">
                      Last payment
                    </div>
                    <div className="mt-1 text-[var(--theme-text)]">
                      {formatDate(
                        subscription.lastPaymentAt
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--theme-border)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--theme-surface)] text-xs uppercase tracking-wide text-[var(--theme-text-muted)]">
                <tr>
                  <th className="px-4 py-3">
                    Customer
                  </th>
                  <th className="px-4 py-3">
                    Offering
                  </th>
                  <th className="px-4 py-3">
                    Amount
                  </th>
                  <th className="px-4 py-3">
                    Renewal
                  </th>
                  <th className="px-4 py-3">
                    Auto-renew
                  </th>
                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800">
                {filtered.map(
                  (subscription) => (
                    <tr key={subscription._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {subscription.client
                            ?.fullName ||
                            "Unknown client"}
                        </div>
                        <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
                          {subscription.client
                            ?.email || ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                        {offeringLabel(
                          subscription
                        )}
                      </td>

                      <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                        {formatMoney(
                          subscription.amount
                        )}
                      </td>

                      <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                        {formatDate(
                          subscription.currentPeriodEnd
                        )}
                      </td>

                      <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                        {subscription.autoRenew
                          ? "Yes"
                          : "No"}
                      </td>

                      <td className="px-4 py-4 text-[var(--theme-text-secondary)]">
                        {labelStatus(
                          subscription.status
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-xs leading-5 text-[var(--theme-text-muted)]">
        Subscription state remains controlled by the existing payment and activation workflows. This page does not create a second subscription-management authority.
      </div>
    </main>
  );
}
