"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Plus, Trash2 } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";

type Program = { key: string; name: string; price: string; weeks: string; popular: boolean };

type PricingProgramResponse = {
  key?: unknown;
  name?: unknown;
  price?: unknown;
  weeks?: unknown;
  popular?: unknown;
};

type PricingResponse = {
  pricing?: {
    programs?: PricingProgramResponse[];
  };
};

type ConsultationFeeResponse = {
  fee?: string | number | null;
};

export default function PricingPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [consultFee, setConsultFee] = useState("");
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeMsg, setFeeMsg] = useState("");
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const loadAll = (silent = false) => {
    if (!silent) { /* loading state managed by individual saves */ }
    return Promise.all([
      api.get<PricingResponse>("/public/pricing").then((res) => {
        const list = res?.pricing?.programs;
        if (Array.isArray(list) && list.length) {
          setPrograms(list.map((p) => ({
            key: String(p.key || ""),
            name: String(p.name || ""),
            price: String(p.price ?? ""),
            weeks: String(p.weeks ?? 12),
            popular: !!p.popular,
          })));
        } else {
          setPrograms([
            { key: "core", name: "Core", price: "35000", weeks: "8", popular: false },
            { key: "plus", name: "Plus", price: "55000", weeks: "12", popular: true },
            { key: "vip", name: "VIP", price: "85000", weeks: "12", popular: false },
          ]);
        }
      }).catch(() => {}),
      api.get<ConsultationFeeResponse>("/settings/consultation-fee")
        .then((res) => { if (res.fee != null) setConsultFee(String(res.fee)); })
        .catch(() => {}),
    ]);
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(() => loadAll(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") loadAll(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const update = (i: number, patch: Partial<Program>) => setPrograms((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => setPrograms((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setPrograms((prev) => [...prev, { key: "", name: "", price: "50000", weeks: "12", popular: false }]);

  const handleSave = async () => {
    if (!programs.length) { setMsg(" Keep at least one program."); return; }
    for (const p of programs) if (!p.name.trim()) { setMsg(" Every program needs a name."); return; }
    setSaving(true); setMsg("");
    try {
      await api.patch("/pricing", { programs: programs.map((p) => ({ key: p.key, name: p.name, price: Number(p.price) || 0, weeks: Number(p.weeks) || 12, popular: p.popular })) });
      setMsg(" Saved! New names & prices are live on the website and portal.");
      setTimeout(() => setMsg(""), 5000);
    } catch (err) { setMsg(" " + (err instanceof Error ? err.message : "Could not save.")); }
    finally { setSaving(false); }
  };

  const saveFee = async () => {
    const fee = Number(consultFee);
    if (!fee || fee <= 0) { setFeeMsg("Enter a valid fee."); return; }
    setFeeSaving(true); setFeeMsg("");
    try {
      await api.put("/settings/consultation-fee", { fee });
      setFeeMsg("Saved. New consultation fee is live.");
      setTimeout(() => setFeeMsg(""), 5000);
    } catch (err) { setFeeMsg(err instanceof Error ? err.message : "Could not save fee."); }
    finally { setFeeSaving(false); }
  };

  const inputClass = "w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-4 py-3 text-white text-sm font-semibold outline-none focus:border-[#0d9488]";



  const tickerItems = (() => {
    const items: string[] = [];

    if (programs.length === 0) {
      items.push("no programs configured yet — add at least one to start selling memberships");
      return items;
    }

    // Live catalog
    const catalogSummary = programs.map((p) => {
      const price = Number(p.price) || 0;
      return p.name + " ₦" + price.toLocaleString();
    });
    items.push(
      programs.length + " program" + (programs.length === 1 ? "" : "s") + " live right now: " + catalogSummary.join(", ")
    );

    // Most popular
    const popularOnes = programs.filter((p) => p.popular);
    if (popularOnes.length > 0) {
      items.push(
        popularOnes.map((p) => p.name).join(", ") + (popularOnes.length === 1 ? " is" : " are") +
        " marked most popular — it's your anchor tier that makes the others look like a deal"
      );
    } else {
      items.push("no program is marked as most popular — pick one to guide prospects");
    }

    // Consultation fee
    if (isAdmin && consultFee) {
      const fee = Number(consultFee) || 0;
      if (fee > 0) {
        items.push("consultation fee is ₦" + fee.toLocaleString() + " — the first touch before any program");
      }
    }

    // Unsaved changes detection
    if (saving) {
      items.push("saving your changes — they'll go live everywhere the moment the save completes");
    } else if (msg && msg.startsWith("")) {
      items.push("changes saved successfully — new prices are live on the website and portal");
    } else if (msg && msg.startsWith("")) {
      items.push("save failed — check the error and try again");
    }

    // Program count guidance
    if (programs.length < 2) {
      items.push("consider adding at least one more tier — a 3-tier structure (basic, popular, premium) converts best");
    } else if (programs.length > 4) {
      items.push(programs.length + " programs might be too many — 3-4 tiers usually converts best, too many paralyzes prospects");
    }

    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />

      <h1 className="text-2xl font-bold text-white mb-2">Manage Pricing & Programs</h1>
      <p className="text-sm text-[var(--theme-text-secondary)] mb-5 sm:mb-8">Rename programs, change prices, add new ones or remove old ones. Changes go live everywhere instantly.</p>

      <div className="grid gap-5 max-w-2xl">
        {isAdmin && (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
              <p className="text-sm font-semibold text-[var(--theme-text)]">Consultation Fee</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--theme-text-secondary)]">Fee (₦)</label>
                <input value={consultFee} inputMode="numeric" onChange={(e) => setConsultFee(e.target.value.replace(/[^0-9]/g, ""))} placeholder="15000" className={inputClass} />
              </div>
              <div className="flex items-end">
                <button onClick={saveFee} disabled={feeSaving} className="min-h-10 w-fit rounded-full bg-[#0d9488] px-4 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                  {feeSaving ? "Saving..." : "Save fee"}
                </button>
              </div>
            </div>
            {feeMsg && <p className={`mt-3 text-sm ${feeMsg.startsWith("Saved") ? "text-green-400" : "text-red-400"}`}>{feeMsg}</p>}
          </div>
        )}
        {programs.map((p, i) => (
          <div key={i} className={`rounded-xl border p-4 sm:p-5 ${p.popular ? "border-[#0d9488]/40" : "border-[var(--theme-border)]"} bg-[var(--theme-surface)]`}>
            <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
              <p className="text-sm font-semibold text-[var(--theme-text)]">Program {i + 1}</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-h-10 items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
                  <input type="checkbox" checked={p.popular} onChange={(e) => update(i, { popular: e.target.checked })} className="h-4 w-4 accent-[#0d9488]" />
                  Most popular
                </label>
                <button onClick={() => remove(i)} className="grid h-10 w-10 place-items-center rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10" title="Remove program">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--theme-text-secondary)]">Name</label>
                <input value={p.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="e.g. Core" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--theme-text-secondary)]">Price (₦)</label>
                <input value={p.price} inputMode="numeric" onChange={(e) => update(i, { price: e.target.value.replace(/[^0-9]/g, "") })} placeholder="35000" className={inputClass} />
              </div>
            </div>
          </div>
        ))}

        <button onClick={add} className="flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-sm font-medium text-white hover:bg-[var(--theme-surface-hover)]">
          <Plus size={15} /> Add program
        </button>

        {msg && <p className={`text-sm ${msg.startsWith("") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

        <button onClick={handleSave} disabled={saving} className="min-h-10 w-fit rounded-full bg-[#0d9488] px-4 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
