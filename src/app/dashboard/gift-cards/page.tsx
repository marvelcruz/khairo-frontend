"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";
import { Gift, Plus, Edit, Trash2 } from "lucide-react";

type GiftCard = {
  _id: string;
  code: string;
  amount: number;
  balance: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
};

export default function GiftCardsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GiftCard | null>(null);

  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ giftCards: GiftCard[] }>("/gift-cards");
      setGiftCards(data.giftCards || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load gift cards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  const resetForm = () => {
    setCode("");
    setAmount("");
    setExpiresAt("");
    setActive(true);
    setEditing(null);
  };

  const openEdit = (giftCard: GiftCard) => {
    setEditing(giftCard);
    setCode(giftCard.code);
    setAmount(String(giftCard.amount));
    setExpiresAt(giftCard.expiresAt ? giftCard.expiresAt.slice(0, 10) : "");
    setActive(giftCard.active);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !amount.trim()) {
      setError("Code and amount are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        code: code.trim().toUpperCase(),
        amount: Number(amount),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        active,
      };

      if (editing?._id) {
        await api.patch(`/gift-cards/${editing._id}`, body);
      } else {
        await api.post("/gift-cards", body);
      }

      setShowForm(false);
      resetForm();
      await load();
      setNotice(editing ? "Gift card updated." : "Gift card created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save gift card.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this gift card?")) return;
    try {
      await api.del(`/gift-cards/${id}`);
      await load();
      setNotice("Gift card deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete gift card.");
    }
  };

  if (!canManage) {
    return <div className="p-6 text-sm text-zinc-400">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Gift Cards</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Create and manage gift cards that can be redeemed at checkout.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-white">How to use gift cards</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>Click <strong>New Gift Card</strong>.</li>
          <li>Enter a unique code and amount.</li>
          <li>Set an optional expiry date.</li>
          <li>Save. You can share the code with a client.</li>
        </ol>
      </div>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-600/10 p-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <button
        type="button"
        onClick={() => { setShowForm(!showForm); resetForm(); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white"
      >
        <Plus size={15} />
        {showForm ? "Cancel" : "New Gift Card"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-zinc-900 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="GIFT100" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Amount</label>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Expiry date</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="h-10 rounded-full bg-[#0d9488] px-5 text-xs font-semibold text-white">
              {saving ? "Saving..." : "Save Gift Card"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : giftCards.length === 0 ? (
          <p className="text-sm text-zinc-400">No gift cards yet.</p>
        ) : giftCards.map((giftCard) => (
          <div key={giftCard._id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-[#0d9488]" />
                  <h3 className="font-semibold text-white">{giftCard.code}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${giftCard.active ? "bg-emerald-600/10 text-emerald-300" : "bg-zinc-700 text-zinc-400"}`}>
                    {giftCard.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Amount: ₦{giftCard.amount.toLocaleString()} · Balance: ₦{giftCard.balance.toLocaleString()}
                </p>
                {giftCard.expiresAt && (
                  <p className="mt-1 text-xs text-zinc-500">Expires: {new Date(giftCard.expiresAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(giftCard)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white">
                  <Edit size={13} className="mr-1 inline" /> Edit
                </button>
                <button onClick={() => handleDelete(giftCard._id)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                  <Trash2 size={13} className="mr-1 inline" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
