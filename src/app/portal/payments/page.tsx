"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "../../../lib/api";
import { useClientAuth } from "../../../context/ClientAuthContext";

type Payment = {
  _id: string;
  receiptNumber: string;
  purpose: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
};

type Profile = {
  program: string;
  startDate: string;
  cycleWeeks: number;
  status: string;
};

type InitializeResponse = {
  success: boolean;
  authorizationUrl: string;
  reference: string;
};

export default function PaymentsPage() {
  const { client } = useClientAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [renewalError, setRenewalError] = useState("");

  useEffect(() => {
    void Promise.all([
      api.get<{ payments: Payment[] }>(
        "/client-experience/payments",
        true
      ),
      api.get<{ profile: Profile }>(
        "/client-experience/profile",
        true
      ),
    ])
      .then(([paymentResponse, profileResponse]) => {
        setPayments(paymentResponse.payments || []);
        setProfile(profileResponse.profile);
      })
      .catch(() => {});
  }, []);

  const renewalState = useMemo(() => {
    const stage = client?.portalAccess?.stage || client?.accountStage;
    const status = client?.status || profile?.status;
    const terminal = status === "completed" || status === "cancelled";
    const accessStopped = stage === "paused" || stage === "completed";
    const periodEnd = client?.portalAccess?.subscriptionPeriodEnd
      ? new Date(client.portalAccess.subscriptionPeriodEnd)
      : null;
    const daysUntilEnd = periodEnd
      ? Math.ceil((periodEnd.getTime() - Date.now()) / 86400000)
      : null;
    const dueSoon =
      daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 7;

    return {
      show: Boolean(client && stage !== "preview" && (terminal || accessStopped || dueSoon)),
      reactivation: terminal || stage === "completed",
      accessStopped,
      daysUntilEnd,
    };
  }, [client, profile]);

  async function beginRenewal() {
    if (!client || renewing) return;

    setRenewing(true);
    setRenewalError("");

    try {
      const response = await api.post<InitializeResponse>(
        "/payments/initialize",
        {
          purpose: "renewal",
          program: client.program,
          promoCode: promoCode.trim() || undefined,
          giftCardCode: giftCardCode.trim() || undefined,
        },
        true
      );

      if (!response.authorizationUrl) {
        throw new Error("The secure payment page could not be opened.");
      }

      window.location.assign(response.authorizationUrl);
    } catch (error) {
      setRenewalError(
        error instanceof Error
          ? error.message
          : "We could not start your renewal. Please contact KhairoDietClinic support."
      );
      setRenewing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Payments & Program
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          Your program
        </h1>
      </header>

      {profile && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
            <p className="text-xs text-zinc-500">Program</p>
            <p className="mt-2 text-xl font-semibold capitalize text-white">
              {profile.program}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
            <p className="text-xs text-zinc-500">Program length</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {profile.cycleWeeks} weeks
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5">
            <p className="text-xs text-zinc-500">Status</p>
            <p className="mt-2 text-xl font-semibold capitalize text-white">
              {profile.status}
            </p>
          </div>
        </section>
      )}

      {renewalState.show && (
        <section className="rounded-2xl border border-[#0d9488]/20 bg-[#0d9488]/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d9488]">
                <ShieldCheck size={14} />
                {renewalState.reactivation ? "Ready to return?" : "Renewal"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {renewalState.reactivation
                  ? "Start a new KhairoDietClinic journey"
                  : "Keep your KhairoDietClinic access active"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {renewalState.reactivation
                  ? "Your previous progress stays on your record. A new program cycle begins only after your renewal payment is verified."
                  : renewalState.daysUntilEnd !== null
                    ? `Your current paid period ${renewalState.accessStopped ? "has ended" : `ends in ${Math.max(0, renewalState.daysUntilEnd)} day${renewalState.daysUntilEnd === 1 ? "" : "s"}`}. Renewing early will not remove remaining paid days.`
                    : "Renew securely to continue your KhairoDietClinic access."}
              </p>
            </div>

            <div className="mt-4 max-w-md">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Promo code
              </label>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Optional"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
                />
              </div>
            </div>

            <div className="mt-4 max-w-md">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Gift card code
              </label>
              <input
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]"
              />
            </div>

            <button
              type="button"
              disabled={renewing}
              onClick={() => void beginRenewal()}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:bg-[#d90081] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {renewing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Opening payment…
                </>
              ) : (
                <>
                  {renewalState.reactivation ? "Reactivate securely" : "Renew securely"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          {renewalError && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {renewalError}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
        <h2 className="font-semibold text-white">Payment history</h2>

        {!payments.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6">
            <p className="text-sm text-zinc-500">
              No payment records are available in your portal yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="grid gap-2 rounded-xl border border-white/8 bg-black/20 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-300">
                    {payment.receiptNumber}
                  </p>
                  <p className="mt-1 text-xs capitalize text-zinc-600">
                    {payment.purpose.replace(/_/g, " ")}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs capitalize ${
                    payment.status === "success"
                      ? "bg-emerald-600/10 text-emerald-600"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {payment.status}
                </span>

                <p className="font-semibold text-white">
                  {payment.currency} {Number(payment.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
