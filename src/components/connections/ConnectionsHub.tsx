"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, Plug, Unplug } from "lucide-react";
import { api } from "@/lib/api";

type Provider = {
  provider: string;
  label: string;
  configured: boolean;
  connection: null | {
    status: "connected" | "needs_selection" | "error" | "disconnected";
    displayName: string;
    externalAccountId: string;
    lastError?: string;
    availableAccounts?: { id: string; name: string }[];
  };
};

type ProviderResponse = { success: boolean; providers: Provider[] };

type Props = {
  providers?: string[];
  title?: string;
  description?: string;
  onChanged?: () => void;
};

export default function ConnectionsHub({
  providers: filter,
  title = "Khairo Diet Clinic Connections",
  description = "Connect the Gmail and social accounts Khairo Diet Clinic uses. Sign in directly with each provider.",
  onChanged,
}: Props) {
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<ProviderResponse>("/social/connections");
      setItems(response.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Khairo Diet Clinic connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter?.length ? items.filter((item) => filter.includes(item.provider)) : items),
    [filter, items]
  );

  const connect = async (provider: string) => {
    setBusy(provider);
    setError("");
    try {
      const response = await api.get<{ success: boolean; authorizationUrl: string }>(
        `/social/connections/${provider}/start`
      );
      window.location.assign(response.authorizationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sign-in.");
      setBusy("");
    }
  };

  const disconnect = async (provider: string) => {
    setBusy(provider);
    setError("");
    try {
      await api.del(`/social/connections/${provider}`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect this account.");
    } finally {
      setBusy("");
    }
  };

  const choose = async (provider: string, externalAccountId: string) => {
    if (!externalAccountId) return;
    setBusy(provider);
    setError("");
    try {
      await api.post(`/social/connections/${provider}/select`, { externalAccountId });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that account.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--theme-text-secondary)]">{description}</p>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[var(--theme-text-secondary)]">
          <Loader2 size={16} className="animate-spin" /> Loading connections…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((item) => {
            const connected = item.connection?.status === "connected";
            const needsChoice = item.connection?.status === "needs_selection";
            const isBusy = busy === item.provider;

            return (
              <div key={item.provider} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">
                      {connected
                        ? item.connection?.displayName || "Connected"
                        : needsChoice
                          ? "Choose the Khairo Diet Clinic account to use"
                          : item.configured
                            ? "Ready to connect"
                            : "Not available yet"}
                    </p>
                  </div>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={13} /> Connected
                    </span>
                  ) : null}
                </div>

                {needsChoice && (
                  <select
                    className="mt-4 h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"
                    defaultValue=""
                    onChange={(event) => void choose(item.provider, event.target.value)}
                  >
                    <option value="">Choose account…</option>
                    {(item.connection?.availableAccounts || []).map((account) => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                )}

                {item.connection?.lastError ? (
                  <p className="mt-3 text-xs text-amber-200">{item.connection.lastError}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {connected ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy || !item.configured}
                        onClick={() => void connect(item.provider)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {isBusy ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
                        Reconnect
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void disconnect(item.provider)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-red-500/20 px-4 text-sm font-semibold text-red-200 disabled:opacity-40"
                      >
                        <Unplug size={15} /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy || !item.configured}
                      onClick={() => void connect(item.provider)}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
                      Connect {item.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
