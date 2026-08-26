"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Users, UserPlus, X, MessageCircle } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";

type BuddyClient = {
  _id: string;
  fullName: string;
  phone?: string;
};

type BuddyPair = {
  _id: string;
  status: string;
  pairedAt: string;
  mentee: BuddyClient;
  mentor: BuddyClient;
};

type BuddyPairsResponse = {
  success: boolean;
  pairs: BuddyPair[];
};

type UnpairedClientsResponse = {
  success: boolean;
  clients?: BuddyClient[];
  mentees?: BuddyClient[];
  mentors?: BuddyClient[];
};

export default function BuddiesPage() {
  const [pairs, setPairs] = useState<BuddyPair[]>([]);
  const [unpaired, setUnpaired] = useState<BuddyClient[]>([]);
  const [mentors, setMentors] = useState<BuddyClient[]>([]);
  const [showPairModal, setShowPairModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [loading, setLoading] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    return Promise.all([
      api.get<BuddyPairsResponse>("/buddy/all").then((res) => res.success && setPairs(res.pairs)),
      api.get<UnpairedClientsResponse>("/buddy/unpaired").then((res) => {
        if (!res.success) return;
        setUnpaired(res.mentees || res.clients || []);
        setMentors(res.mentors || []);
      }),
    ]).finally(() => {
      if (!silent) setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") load(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const createPair = async () => {
    if (!selectedMentee || !selectedMentor) { alert("Select both mentee and mentor"); return; }
    setLoading(true);
    try {
      await api.post("/buddy/pair", { menteeId: selectedMentee, mentorId: selectedMentor });
      setShowPairModal(false);
      setSelectedMentee("");
      setSelectedMentor("");
      load();
    } catch (err) { alert(" " + (err instanceof Error ? err.message : "Failed")); }
    finally { setLoading(false); }
  };

  const updatePairStatus = async (pairId: string, status: string) => {
    try {
      await api.put(`/buddy/pair/${pairId}`, { status });
      load();
    } catch { alert("Failed"); }
  };

  const getWhatsAppLink = (client: BuddyClient) => {
    const phone = (client.phone || "").replace(/\D/g, "");
    const first = (client.fullName || "").split(" ")[0];
    const text = encodeURIComponent(`Hi ${first}!  Welcome to KhairoDietClinic! I'm your buddy and I'm here to help you get started.`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const tickerItems = (() => {
    const items: string[] = [];

    if (pairs.length === 0 && unpaired.length === 0) {
      items.push("no buddy pairs yet and no unpaired clients — hit New Pairing to match your first two when you have clients ready");
      items.push("pairing a new client with a graduate is one of the cheapest ways to keep them around and build community");
      return items;
    }

    const active = pairs.filter((p) => p.status === "active");
    const completed = pairs.filter((p) => p.status === "completed");
    const other = pairs.length - active.length - completed.length;

    if (pairs.length === 0) {
      items.push("no buddy pairs yet — hit New Pairing to match your first two when you have clients ready");
    } else {
      items.push(
        pairs.length + " buddy pair" + (pairs.length === 1 ? "" : "s") + " on the board" +
        (active.length > 0 ? " — " + active.length + " active" : "") +
        (completed.length > 0 ? " — " + completed.length + " completed" : "") +
        (other > 0 ? " — " + other + " in other states" : "")
      );
    }

    if (active.length > 0) {
      const oldest = active.reduce((a, b) => (daysSince(a.pairedAt) > daysSince(b.pairedAt) ? a : b));
      const newest = active.reduce((a, b) => (daysSince(a.pairedAt) < daysSince(b.pairedAt) ? a : b));
      
      if (daysSince(oldest.pairedAt) > 30) {
        items.push(
          oldest.mentee.fullName + " and " + oldest.mentor.fullName + " have been paired " + daysSince(oldest.pairedAt) + " days — check in on how the partnership is going"
        );
      }
      
      if (daysSince(newest.pairedAt) < 3) {
        items.push(
          newest.mentee.fullName + " and " + newest.mentor.fullName + " just got paired " + daysSince(newest.pairedAt) + " day" + (daysSince(newest.pairedAt) === 1 ? "" : "s") + " ago — make sure the mentor reaches out"
        );
      }
    }

    if (unpaired.length > 0) {
      items.push(
        unpaired.length + " client" + (unpaired.length === 1 ? "" : "s") + " still waiting for a buddy: " +
        nameList(unpaired.map((c) => c.fullName)) +
        " — worth pairing them soon so they don't drop off"
      );
    } else if (active.length > 0) {
      items.push("every client has a buddy — no one waiting to be paired right now");
    }

    if (completed.length > 0) {
      items.push(
        completed.length + " pair" + (completed.length === 1 ? "" : "s") + " successfully completed their buddy journey — nice work"
      );
    }

    return items;
  })();

  return (
    <div>
      <PageTicker items={tickerItems} />

      <div className="flex flex-wrap gap-3 items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex flex-wrap items-center gap-2"><Users size={24} /> Buddy System</h1>
          <p className="text-[var(--theme-text-secondary)] mt-1">Pair new clients with graduates for community & retention.</p>
        </div>
        <button onClick={() => setShowPairModal(true)} className="flex flex-wrap items-center gap-2 rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
          <UserPlus size={16} /> New Pairing
        </button>
      </div>

      {showPairModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-6">
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create Buddy Pair</h2>
              <button onClick={() => setShowPairModal(false)} className="text-[var(--theme-text-secondary)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-2">New Client (Mentee)</label>
                <select value={selectedMentee} onChange={(e) => setSelectedMentee(e.target.value)} className="w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]">
                  <option value="">Select mentee...</option>
                  {unpaired.filter((c) => c._id !== selectedMentor).map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-2">Graduate (Mentor)</label>
                <select value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)} className="w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]">
                  <option value="">Select mentor...</option>
                  {mentors.map((c) => <option key={c._id} value={c._id}>{c.fullName}</option>)}
                </select>
                <p className="mt-1.5 text-xs text-[var(--theme-text-secondary)]">Only reconciled clients whose program status is Completed are eligible as mentors.</p>
              </div>
              <button onClick={createPair} disabled={loading} className="w-full rounded-full bg-[#0d9488] py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {loading ? "Creating..." : "Create Pair"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pairs.length === 0 && <p className="text-[var(--theme-text-secondary)] text-center py-12">No buddy pairs yet. Create your first!</p>}
        {pairs.map((pair) => (
          <div key={pair._id} className={`rounded-xl border p-5 ${pair.status === "active" ? "border-green-500/30 bg-green-500/5" : "border-[var(--theme-border)] bg-[var(--theme-surface)]"}`}>
            <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Mentee (New)</p>
                    <p className="font-semibold text-white">{pair.mentee.fullName}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">{pair.mentee.phone}</p>
                  </div>
                  <div className="text-2xl text-[var(--theme-text-muted)]">←</div>
                  <div>
                    <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider">Mentor (Graduate)</p>
                    <p className="font-semibold text-white">{pair.mentor.fullName}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">{pair.mentor.phone}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {pair.status === "active" ? (
                  <>
                    <a href={getWhatsAppLink(pair.mentor)} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center gap-1 rounded-full border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/10">
                      <MessageCircle size={12} /> Message Mentor
                    </a>
                    <button onClick={() => updatePairStatus(pair._id, "completed")} className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs text-white hover:bg-[var(--theme-surface-hover)]">
                      Complete
                    </button>
                  </>
                ) : (
                  <span className={`rounded-full px-3 py-1 text-xs ${pair.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {pair.status}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)]">Paired {new Date(pair.pairedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
