"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { api } from "../../../../lib/api";

type StageInfo = { done: boolean; at?: string; by?: { name?: string } };
type ShippedInfo = StageInfo & { courier?: string; trackingNumber?: string };
type LineItem = { name?: string; quantity?: number; unitPrice?: number; currency?: string };

type Order = {
  _id: string;
  program?: string;
  offering?: { _id?: string; name?: string; type?: string; sku?: string } | null;
  lineItems?: LineItem[];
  totalAmount?: number;
  currency?: string;
  fulfillmentRequired?: boolean;
  currentStage: string;
  meterColor: "red" | "yellow" | "green";
  prepared: StageInfo;
  packed: StageInfo;
  shipped: ShippedInfo;
  delivered: StageInfo;
  deliveryAddress?: string;
  notes?: string;
  client: { _id: string; fullName: string; email: string; phone: string } | null;
  assignedStaff?: { _id: string; name: string } | null;
  createdAt: string;
};

const STAGES = [
  { key: "prepared", label: "Package Prepared", description: "Kit contents pulled and ready." },
  { key: "packed", label: "Packed", description: "Sealed and labeled, ready to ship." },
  { key: "shipped", label: "Shipped", description: "Dispatched with a courier." },
  { key: "delivered", label: "Delivered", description: "Confirmed received by the client." },
] as const;

const METER_STYLES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-green-500",
};

type FulfillmentStageInfo = {
  done?: boolean;
  at?: string;
  by?: { name?: string } | null;
  courier?: string;
  trackingNumber?: string;
};

type StageUpdateBody = {
  stage: string;
  done: boolean;
  courier?: string;
  trackingNumber?: string;
};

function orderLabel(order: Order) {
  return order.lineItems?.[0]?.name || order.offering?.name || order.program || "Subscription";
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [staffList, setStaffList] = useState<{ _id: string; name: string }[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ order: Order }>(`/orders/${id}`);
      setOrder(res.order);
      setCourier(res.order.shipped?.courier || "");
      setTrackingNumber(res.order.shipped?.trackingNumber || "");
      setDeliveryAddress(res.order.deliveryAddress || "");
      setNotes(res.order.notes || "");
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    api.get<{ users?: typeof staffList; staff?: typeof staffList }>("/auth/directory")
      .then((res) => setStaffList(res.users || res.staff || []))
      .catch(() => {});
  }, [fetchOrder]);

  const handleAssignStaff = async (staffId: string) => {
    setAssignSaving(true);
    try {
      const res = await api.patch<{ order: Order }>(`/orders/${id}`, { assignedStaff: staffId || null });
      setOrder(res.order);
    } finally {
      setAssignSaving(false);
    }
  };

  const handleToggle = async (stage: string, done: boolean) => {
    setToggling(stage);
    try {
      const body: StageUpdateBody = { stage, done };
      if (stage === "shipped" && done) {
        body.courier = courier;
        body.trackingNumber = trackingNumber;
      }
      const res = await api.patch<{ order: Order }>(`/orders/${id}/stage`, body);
      setOrder(res.order);
    } finally {
      setToggling(null);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    setDetailsSaved(false);
    try {
      const res = await api.patch<{ order: Order }>(`/orders/${id}`, { deliveryAddress, notes });
      setOrder(res.order);
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) return <p className="text-sm text-[var(--theme-text-secondary)]">Loading…</p>;
  if (!order) return <p className="text-sm text-[var(--theme-text-secondary)]">Order not found.</p>;

  const stageIndex = (key: string) => STAGES.findIndex((s) => s.key === key);
  const canToggle = (key: string) => {
    const idx = stageIndex(key);
    if (idx === 0) return true;
    const prevKey = STAGES[idx - 1].key;
    const stages = order as unknown as Record<string, FulfillmentStageInfo | undefined>;
    return Boolean(stages[prevKey]?.done);
  };

  return (
    <div>
      <button onClick={() => router.push("/dashboard/orders")} className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--theme-text-secondary)] hover:text-white">
        <ArrowLeft size={16} /> Back to orders
      </button>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">{order.client?.fullName || "Unknown client"}</h1>
          <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{orderLabel(order)}</p>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Order created {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2">
            <span className={`h-2.5 w-2.5 rounded-full ${METER_STYLES[order.meterColor]}`} />
            <span className="text-xs capitalize text-[var(--theme-text-secondary)]">{order.currentStage.replace("_", " ")}</span>
          </div>
          <select
            value={order.assignedStaff?._id || ""}
            onChange={(e) => handleAssignStaff(e.target.value)}
            disabled={assignSaving}
            className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">Unassigned</option>
            {(staffList || []).map((s) => (
              <option key={s._id} value={s._id}>{s.name || (s as typeof s & { fullName?: string }).fullName || "Staff member"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
        <p className="font-medium text-white">Order contents</p>
        <div className="mt-3 space-y-2">
          {(order.lineItems || []).length ? (
            order.lineItems?.map((item, index) => (
              <div key={`${item.name || "item"}-${index}`} className="flex items-center justify-between gap-4 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 py-3 text-sm">
                <div>
                  <p className="text-white">{item.name || "Subscription item"}</p>
                  <p className="mt-0.5 text-xs text-[var(--theme-text-secondary)]">Quantity {item.quantity || 1}</p>
                </div>
                {item.unitPrice !== undefined && (
                  <p className="text-sm font-medium text-white">{item.currency || order.currency || "NGN"} {Number(item.unitPrice).toLocaleString()}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--theme-text-secondary)]">{orderLabel(order)}</p>
          )}
        </div>
      </div>

      {order.fulfillmentRequired === false ? (
        <div className="mt-6 rounded-sm border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Order confirmed</p>
              <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">This subscription does not require a physical package, so there is no packing or shipping workflow.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <p className="font-medium text-white">Fulfillment pipeline</p>
            <div className="mt-4 space-y-3">
              {STAGES.map((s) => {
                const stages = order as unknown as Record<string, FulfillmentStageInfo | undefined>;
                const info = stages[s.key] || {};
                const enabled = canToggle(s.key);
                return (
                  <div key={s.key} className="flex flex-wrap items-start gap-3 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-4">
                    <button
                      onClick={() => enabled && handleToggle(s.key, !info.done)}
                      disabled={!enabled || toggling === s.key}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        info.done ? "border-green-500 bg-green-500" : "border-[var(--theme-border)]"
                      } ${!enabled ? "opacity-30" : "hover:border-[#0d9488]"}`}
                    >
                      {info.done && <Check size={14} className="text-black" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.label}</p>
                      <p className="text-xs text-[var(--theme-text-secondary)]">{s.description}</p>
                      {info.done && info.at && (
                        <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Marked {new Date(info.at).toLocaleString()}{info.by?.name ? ` by ${info.by.name}` : ""}</p>
                      )}

                      {s.key === "shipped" && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-[var(--theme-text-secondary)]">Dispatch rider name</label>
                            <input
                              placeholder="e.g. KENE"
                              value={courier}
                              onChange={(e) => setCourier(e.target.value)}
                              disabled={info.done}
                              className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[var(--theme-text-secondary)]">Dispatch rider phone</label>
                            <input
                              placeholder="e.g. 0807373888833"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              disabled={info.done}
                              className="w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488] disabled:opacity-50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-sm border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <p className="font-medium text-white">Delivery details</p>
            <textarea
              placeholder="Delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-sm border border-[var(--theme-border)] bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
            />
            <button
              onClick={handleSaveDetails}
              disabled={savingDetails}
              className="mt-3 rounded-full bg-[#0d9488] px-5 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {savingDetails ? "Saving…" : detailsSaved ? "Saved" : "Save details"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}