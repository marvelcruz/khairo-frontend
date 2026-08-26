"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Plus, Package, AlertTriangle, ClipboardCheck, History } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";

type Supplement = { _id: string; name: string; description?: string; price: number; costPerUnit: number; stock: number; reorderThreshold: number; unit: string };

const REMOVE_CATEGORIES = [
  { value: "sent_to_client", label: "Sent to client" },
  { value: "sold", label: "Sold (walk-in)" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "lost", label: "Lost" },
  { value: "other", label: "Other" },
];

const catChip = (cat: string) =>
  cat === "damaged" || cat === "expired" || cat === "lost" ? "bg-red-500/10 text-red-400"
  : cat === "sent_to_client" || cat === "sold" ? "bg-green-500/10 text-green-400"
  : cat === "restock" ? "bg-blue-500/10 text-blue-400"
  : "bg-amber-500/10 text-amber-400";

type SupplementClient = {
  _id: string;
  fullName: string;
};

type StocktakeItem = {
  supplement: string;
  name: string;
  expected: number;
  counted: number;
  discrepancy: number;
};

type Stocktake = {
  _id: string;
  createdAt: string;
  performedBy?: { name?: string } | null;
  items: StocktakeItem[];
};

type SupplementAdjustment = {
  _id?: string;
  createdAt: string;
  type?: string;
  category?: string;
  quantity?: number;
  delta?: number;
  reason?: string;
  client?: { fullName?: string } | null;
  performedBy?: { name?: string } | null;
  adjustedBy?: { name?: string } | null;
  stockBefore?: number;
  stockAfter?: number;
};
export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [clients, setClients] = useState<SupplementClient[]>([]);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplement | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [stock, setStock] = useState("");
  const [reorderThreshold, setReorderThreshold] = useState("");
  const [unit, setUnit] = useState("units");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "set">("remove");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustCategory, setAdjustCategory] = useState("sent_to_client");
  const [adjustClientId, setAdjustClientId] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<SupplementAdjustment[]>([]);
  const [checkOpen, setCheckOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [checkNotes, setCheckNotes] = useState("");
  const [checkSaving, setCheckSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const refresh = async (silent = false) => {
    try {
      const [s, st] = await Promise.all([
        api.get<{ supplements?: Supplement[] }>("/supplements"),
        api.get<{ stocktakes?: Stocktake[] }>("/supplements/stocktakes"),
      ]);
      setSupplements(s.supplements || []);
      setStocktakes(st.stocktakes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load supplements");
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    refresh();
    api.get<{ clients?: SupplementClient[] }>("/clients?reconciled=true&limit=100").then((r) => setClients(r.clients || [])).catch(() => {});
    const t = setInterval(() => refresh(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") refresh(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const lastCheck = stocktakes[0];
  const daysSince = lastCheck ? Math.floor((Date.now() - new Date(lastCheck.createdAt).getTime()) / 86400000) : null;
  const overdue = !lastCheck || (daysSince !== null && daysSince >= 3);
  const lowStock = supplements.filter((s) => s.stock <= s.reorderThreshold);

  const tickerItems = (() => {
    if (loading) return ["Reading the shelf…"];
    const items: string[] = [];

    if (supplements.length === 0) {
      items.push("no supplements in the system yet — add your first product to start tracking every unit");
      return items;
    }

    const saleValue = supplements.reduce((sum, s) => sum + s.stock * s.price, 0);
    const costValue = supplements.reduce((sum, s) => sum + s.stock * s.costPerUnit, 0);

    items.push(
      supplements.length + " product" + (supplements.length === 1 ? "" : "s") + " on the shelf: " +
      supplements.slice(0, 4).map((s) => s.name + " (" + s.stock + " " + s.unit + ")").join(", ") +
      (supplements.length > 4 ? " and " + (supplements.length - 4) + " more" : "")
    );

    items.push(
      "stock value: ₦" + saleValue.toLocaleString() + " at sale price — ₦" + costValue.toLocaleString() + " of your own money tied up on the shelf"
    );

    const outOfStock = supplements.filter((s) => s.stock === 0);
    if (outOfStock.length > 0) {
      items.push(
        outOfStock.length + " product" + (outOfStock.length === 1 ? "" : "s") + " completely out of stock: " +
        outOfStock.map((s) => s.name).join(", ") + " — restock before clients go without"
      );
    } else if (lowStock.length > 0) {
      items.push(
        lowStock.length + " product" + (lowStock.length === 1 ? "" : "s") + " running low: " +
        lowStock.map((s) => s.name + " (" + s.stock + " left, reorder at " + s.reorderThreshold + ")").join(", ") +
        " — restock soon"
      );
    } else {
      items.push("every product is above its reorder point — the shelf is healthy");
    }

    if (!lastCheck) {
      items.push("no inventory check yet — run your first physical count so shrinkage can never hide");
    } else if (overdue) {
      items.push(
        "last inventory check was " + daysSince + " day" + (daysSince === 1 ? "" : "s") + " ago — target is 3× per week, run a physical count today"
      );
    } else {
      const shorts = (lastCheck.items || []).filter((i) => i.discrepancy !== 0);
      items.push(
        "last inventory check was " + (daysSince === 0 ? "today" : daysSince + " day" + (daysSince === 1 ? "" : "s") + " ago") +
        " by " + ((lastCheck.performedBy && lastCheck.performedBy.name) || "someone") +
        (shorts.length > 0
          ? " — " + shorts.length + " discrepanc" + (shorts.length === 1 ? "y found" : "ies found") + ", worth investigating where those units went"
          : " — everything matched, no shrinkage")
      );
    }

    return items;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) { alert("Name and price required"); return; }
    setSaving(true);
    try {
      const data = { name, description, price: Number(price), costPerUnit: Number(costPerUnit) || 0, stock: Number(stock) || 0, reorderThreshold: Number(reorderThreshold) || 10, unit };
      if (editing) await api.patch(`/supplements/${editing._id}`, data);
      else await api.post("/supplements", data);
      setShowForm(false); setEditing(null); setName(""); setDescription(""); setPrice(""); setCostPerUnit(""); setStock(""); setReorderThreshold(""); setUnit("units");
      refresh();
    } catch { alert("Could not save supplement."); }
    finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    if (!adjustQty) { alert("Quantity required"); return; }
    if (adjustType === "remove" && ["sent_to_client", "sold"].includes(adjustCategory) && !adjustClientId) { alert("Select which client this was sent to."); return; }
    setAdjusting(true);
    try {
      await api.post(`/supplements/${adjustingId}/adjust`, {
        type: adjustType, quantity: Number(adjustQty), reason: adjustReason,
        category: adjustType === "add" ? "restock" : adjustType === "set" ? "correction" : adjustCategory,
        clientId: adjustClientId || undefined,
      });
      setAdjustingId(null); setAdjustQty(""); setAdjustReason(""); setAdjustClientId("");
      refresh();
    } catch (e) { alert(e instanceof Error ? e.message : "Could not adjust stock."); }
    finally { setAdjusting(false); }
  };

  const openLedger = async (id: string) => {
    if (ledgerId === id) { setLedgerId(null); return; }
    setLedgerId(id);
    try {
      const r = await api.get<{ adjustments?: SupplementAdjustment[] }>(`/supplements/${id}/adjustments`);
      setLedger(r.adjustments || []);
    } catch { setLedger([]); }
  };

  const startCheck = () => {
    const c: Record<string, string> = {};
    supplements.forEach((s) => { c[s._id] = String(s.stock); });
    setCounts(c); setCheckOpen(true);
  };

  const submitCheck = async () => {
    setCheckSaving(true);
    try {
      await api.post("/supplements/stocktake", { items: supplements.map((s) => ({ supplementId: s._id, counted: Number(counts[s._id] ?? s.stock) })), notes: checkNotes });
      setCheckOpen(false); setCheckNotes("");
      refresh();
    } catch { alert("Could not save inventory check."); }
    finally { setCheckSaving(false); }
  };

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Supplements</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Every unit accounted for: who received it, or why it left stock.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={startCheck} className="flex flex-wrap items-center gap-1.5 rounded-full border border-amber-500/40 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10"><ClipboardCheck size={14} /> Inventory check</button>
          <button onClick={() => setShowForm(!showForm)} className="flex flex-wrap items-center gap-1.5 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"><Plus size={14} /> {showForm ? "Cancel" : "Add supplement"}</button>
        </div>
      </div>

      {overdue && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <p className="text-sm text-amber-400">{lastCheck ? `Inventory check overdue — last check was ${daysSince} day${daysSince === 1 ? "" : "s"} ago. Target: 3× per week.` : "No inventory check yet. Run your first physical count."}</p>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="mt-4 rounded-sm border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">Low stock ({lowStock.length}) — admin has been emailed</p>
          <div className="mt-1 space-y-0.5">
            {lowStock.map((s) => <p key={s._id} className="text-xs text-[var(--theme-text-secondary)]">{s.name}: {s.stock} {s.unit} left (reorder at {s.reorderThreshold})</p>)}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Name</p>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Description (optional)</p>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Selling price (₦)</p>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Cost per unit (₦)</p>
              <input value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} type="number" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Starting stock</p>
              <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Reorder at</p>
              <input value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} type="number" className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--theme-text-secondary)]">Unit</p>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="rounded-full bg-[#0d9488] px-5 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Saving…" : editing ? "Update" : "Create"}</button>
        </form>
      )}

      {checkOpen && (
        <div className="mt-4 rounded-sm border border-amber-500/30 bg-[var(--theme-surface)] p-5">
          <p className="font-medium text-white">Physical count</p>
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Count what&apos;s actually on the shelf. Differences are auto-corrected and recorded as shortages/surplus with your name signed.</p>
          <div className="mt-4 space-y-2">
            {supplements.map((s) => (
              <div key={s._id} className="flex flex-wrap gap-3 items-center justify-between rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-2">
                <p className="text-sm text-white">{s.name} <span className="text-xs text-[var(--theme-text-secondary)]">(system: {s.stock})</span></p>
                <input type="number" value={counts[s._id] ?? ""} onChange={(e) => setCounts({ ...counts, [s._id]: e.target.value })} className={`w-24 rounded-sm border px-2 py-1 text-sm text-white outline-none ${Number(counts[s._id]) !== s.stock ? "border-amber-500 bg-amber-500/10" : "border-[var(--theme-border)] bg-black/50"}`} />
              </div>
            ))}
          </div>
          <input value={checkNotes} onChange={(e) => setCheckNotes(e.target.value)} placeholder="Notes (optional)" className="mt-3 w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={submitCheck} disabled={checkSaving} className="rounded-full bg-amber-500 px-5 py-2 text-xs font-medium text-black hover:bg-amber-400 disabled:opacity-50">{checkSaving ? "Saving…" : "Save check"}</button>
            <button onClick={() => setCheckOpen(false)} className="rounded-full border border-[var(--theme-border)] px-5 py-2 text-xs text-white hover:bg-[var(--theme-surface-hover)]">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-[var(--theme-text-secondary)]">Loading…</p> : error ? (
          <p className="text-sm text-red-400">Could not load supplements — {error}. Check your connection or refresh.</p>
        ) : supplements.length === 0 ? (
          <p className="text-sm text-[var(--theme-text-secondary)]">No supplements yet. Add your first one.</p>
        ) : supplements.map((s) => (
          <div key={s._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Package size={16} className="text-[#0d9488]" />
                <div>
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-xs text-[var(--theme-text-secondary)]">₦{s.price.toLocaleString()} · cost ₦{s.costPerUnit.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.stock <= s.reorderThreshold ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>{s.stock} {s.unit}</span>
                <button onClick={() => openLedger(s._id)} className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs text-white hover:bg-[var(--theme-surface-hover)]"><History size={12} /> Ledger</button>
                <button onClick={() => { setAdjustingId(s._id); setLedgerId(null); }} className="rounded-full bg-[#0d9488] px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Adjust</button>
              </div>
            </div>

            {adjustingId === s._id && (
              <div className="mt-3 space-y-2 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                <div className="flex flex-wrap gap-1 rounded-full border border-[var(--theme-border)] p-1 w-fit">
                  {(["remove", "add", "set"] as const).map((t) => (
                    <button key={t} onClick={() => setAdjustType(t)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${adjustType === t ? "bg-[#0d9488] text-white" : "text-[var(--theme-text-secondary)]"}`}>{t === "remove" ? "Out" : t === "add" ? "In" : "Set"}</button>
                  ))}
                </div>
                {adjustType === "remove" && (
                  <>
                    <select value={adjustCategory} onChange={(e) => setAdjustCategory(e.target.value)} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none">
                      {REMOVE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {["sent_to_client", "sold"].includes(adjustCategory) && (
                      <select value={adjustClientId} onChange={(e) => setAdjustClientId(e.target.value)} className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none">
                        <option value="">Which client?</option>
                        {clients.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}
                      </select>
                    )}
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Qty" className="w-24 rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
                  <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Note (optional)" className="flex-1 rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleAdjust} disabled={adjusting} className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{adjusting ? "…" : "Confirm"}</button>
                  <button onClick={() => setAdjustingId(null)} className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-xs text-white hover:bg-[var(--theme-surface-hover)]">Cancel</button>
                </div>
              </div>
            )}

            {ledgerId === s._id && (
              <div className="mt-3 space-y-1.5 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                {ledger.length === 0 ? <p className="text-xs text-[var(--theme-text-secondary)]">No movements yet.</p> : ledger.map((a) => (
                  <div key={a._id} className="flex flex-wrap gap-3 items-center justify-between text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${catChip(a.category || "correction")}`}>{(a.category || "correction").replace("_", " ")}</span>
                      <span className="text-[var(--theme-text-secondary)]">{a.client ? `→ ${a.client.fullName}` : a.reason || ""}</span>
                    </div>
                    <span className="text-[var(--theme-text-secondary)]">{a.type === "add" ? "+" : a.type === "remove" ? "−" : "="}{a.quantity} · {a.adjustedBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {stocktakes.length > 0 && (
        <div className="mt-8 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
          <p className="font-medium text-white">Inventory check history</p>
          <div className="mt-3 space-y-2">
            {stocktakes.slice(0, 7).map((st) => {
              const shorts = st.items.filter((i) => i.discrepancy !== 0);
              return (
                <div key={st._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                  <div className="flex flex-wrap gap-3 items-center justify-between text-xs">
                    <p className="text-white">{st.performedBy?.name} · {new Date(st.createdAt).toLocaleString()}</p>
                    <span className={shorts.length ? "text-amber-400" : "text-green-400"}>{shorts.length ? `${shorts.length} discrepancies` : "all matched"}</span>
                  </div>
                  {shorts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {shorts.map((i) => <p key={i.supplement} className="text-xs text-[var(--theme-text-secondary)]">{i.name}: expected {i.expected}, counted {i.counted} ({i.discrepancy > 0 ? "+" : ""}{i.discrepancy})</p>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
