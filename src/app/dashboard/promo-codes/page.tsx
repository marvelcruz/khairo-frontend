"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";
import { Edit, Plus, Ticket, Trash2 } from "lucide-react";

type PromoCode = {
  _id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  currentUses: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
};

type PromoListResponse = {
  success: boolean;
  promoCodes: PromoCode[];
};

export default function PromoCodesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [maxUses, setMaxUses] = useState("0");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<PromoListResponse>("/promo-codes");
      setPromoCodes(data.promoCodes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load promo codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("10");
    setMaxUses("0");
    setActive(true);
    setExpiresAt("");
    setEditing(null);
  };

  const openEdit = (promoCode: PromoCode) => {
    setEditing(promoCode);
    setCode(promoCode.code);
    setDescription(promoCode.description || "");
    setDiscountType(promoCode.discountType);
    setDiscountValue(String(promoCode.discountValue));
    setMaxUses(String(promoCode.maxUses));
    setActive(promoCode.active);
    setExpiresAt(promoCode.expiresAt ? promoCode.expiresAt.slice(0, 10) : "");
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || !discountValue.trim()) {
      setError("Code and discount value are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: Math.max(0, Number(maxUses) || 0),
        active,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      if (editing?._id) {
        await api.patch(`/promo-codes/${editing._id}`, body);
      } else {
        await api.post("/promo-codes", body);
      }

      setShowForm(false);
      resetForm();
      await load();
      setNotice(editing ? "Promo code updated." : "Promo code created.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save promo code.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      await api.del(`/promo-codes/${id}`);
      await load();
      setNotice("Promo code deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete promo code.");
    }
  };

  if (!canManage) {
    return <div className="p-6 text-sm text-zinc-400">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Promo Codes</h1>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Create and manage discount codes for KhairoDietClinic.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-white">
          How to use promo codes
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>Click <strong>New Promo Code</strong>.</li>
          <li>Enter a code like <strong>SUMMER10</strong>.</li>
          <li>Choose <strong>Percentage</strong> or <strong>Fixed amount</strong>.</li>
          <li>Set the discount value, optional expiry, and max uses.</li>
          <li>Leave <strong>Active</strong> checked to enable the code.</li>
          <li>Save. Clients can now enter the code at checkout.</li>
        </ol>
        <p className="mt-3 text-xs text-zinc-500">
          Promo codes are managed separately from Growth Features. You can still create codes here even if the Promo Codes toggle is OFF; the toggle only controls whether clients see the promo field at checkout.
        </p>
      </div>

      {notice && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</div>}
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <button
        type="button"
        onClick={() => { setShowForm(!showForm); resetForm(); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white"
      >
        <Plus size={15} />
        {showForm ? "Cancel" : "New Promo Code"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-zinc-900 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER10" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional internal note" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Discount type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Discount value</label>
              <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400">Max uses (0 = unlimited)</label>
              <input type="number" min="0" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
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
              {saving ? "Saving..." : "Save Promo Code"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-sm text-zinc-400">No promo codes yet.</p>
        ) : promoCodes.map((promoCode) => (
          <div key={promoCode._id} className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket size={16} className="text-[#0d9488]" />
                  <h3 className="font-semibold text-white">{promoCode.code}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${promoCode.active ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700 text-zinc-400"}`}>
                    {promoCode.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {promoCode.discountType === "percentage"
                    ? `${promoCode.discountValue}% off`
                    : `₦${promoCode.discountValue} off`}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Used {promoCode.currentUses}{promoCode.maxUses > 0 ? ` / ${promoCode.maxUses}` : ""}
                  {promoCode.expiresAt ? ` · Expires ${new Date(promoCode.expiresAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(promoCode)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white">
                  <Edit size={13} className="mr-1 inline" /> Edit
                </button>
                <button onClick={() => handleDelete(promoCode._id)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
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
