"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { Calendar, MapPin, Users } from "lucide-react";

type TrialEvent = {
  _id: string;
  title: string;
  date: string;
  location?: string;
  capacity: number;
  isActive: boolean;
  registrations: unknown[];
};

type TrialsResponse = {
  success: boolean;
  events: TrialEvent[];
};

type RegistrationResponse = {
  success: boolean;
  message?: string;
};

export default function TrialRegistrationPage() {
  const params = useParams();
  const [event, setEvent] = useState<TrialEvent | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      api.get<TrialsResponse>("/trials").then((res) => {
        if (res.success) {
          const ev = res.events.find((e) => e._id === params.id);
          if (ev) setEvent(ev);
        }
        setLoading(false);
      });
    }
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post<RegistrationResponse>(`/trials/${params.id}/register`, form);
      if (res.success) setSubmitted(true);
      else setError(res.message || "Failed");
    } catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/60">Loading...</div>;
  if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Event not found.</div>;

  const isFull = event.registrations.length >= event.capacity;
  const spotsLeft = event.capacity - event.registrations.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black py-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border border-[#0d9488]/30 bg-neutral-900/80 backdrop-blur p-8 shadow-2xl">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70 mt-4">
                  <span className="flex flex-wrap items-center gap-1.5"><Calendar size={14} /> {new Date(event.date).toLocaleString()}</span>
                  {event.location && <span className="flex flex-wrap items-center gap-1.5"><MapPin size={14} /> {event.location}</span>}
                  <span className="flex flex-wrap items-center gap-1.5"><Users size={14} /> {spotsLeft} spots left</span>
                </div>
                <p className="text-white/60 mt-4 text-sm">Experience Khairo Diet Clinic risk-free. Meet your coach, see the plan, and decide if we&apos;re right for you.</p>
              </div>

              {isFull ? (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-6 text-center">
                  <p className="text-red-400 font-semibold">This event is full!</p>
                  <p className="text-white/60 text-sm mt-2">Join our waitlist for the next one.</p>
                </div>
              ) : !event.isActive ? (
                <div className="rounded-lg bg-white/5 border border-white/10 p-6 text-center">
                  <p className="text-white/70 font-semibold">Registration closed</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your full name" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#0d9488]" />
                  <input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="Your email" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#0d9488]" />
                  <input required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="WhatsApp number" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#0d9488]" />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" className="w-full rounded-full bg-[#0d9488] py-3.5 font-semibold text-white hover:bg-teal-700">
                    Reserve My Spot
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">You&apos;re in!</h2>
              <p className="text-white/70 mb-6">We&apos;ve sent details to {form.email}. See you at the trial!</p>
              <a href="/pricing" className="inline-block rounded-full bg-[#0d9488] px-6 py-3 text-sm font-medium text-white hover:bg-teal-700">View Khairo Diet Clinic programs</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
