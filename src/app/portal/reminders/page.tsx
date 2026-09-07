"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Clock3, Play, Plus, Sparkles, Trash2, Volume2 } from "lucide-react";
import { useClientAuth } from "@/context/ClientAuthContext";

type CoachStyle = "encouraging" | "energetic" | "calm" | "firm" | "friendly" | "accountability";
type Reminder = {
  id: string;
  time: string;
  activity: string;
  message: string;
  enabled: boolean;
};

type VoiceOption = {
  name: string;
  displayName: string;
  gender: string;
  provider?: string;
};

const API = "/api/voice-coach";
const STORAGE_KEY = "khairo_voice_coach_shared_reminders";
const ACTIVITIES = [
  "10 sit-ups",
  "10 push-ups",
  "15-minute walk",
  "Drink a glass of water",
  "Stretch for 5 minutes",
  "Log today's progress",
];
const LOCALES = [
  ["en-NG", "Nigeria"],
  ["en-US", "United States"],
  ["en-GB", "United Kingdom"],
  ["en-CA", "Canada"],
] as const;
const STYLES: CoachStyle[] = ["encouraging", "energetic", "calm", "firm", "friendly", "accountability"];

function firstName(fullName?: string) {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

function authHeaders(json = false) {
  const token = typeof window !== "undefined" ? localStorage.getItem("khairo_client_token") : null;
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Voice-Tenant": "khairo",
  };
}

function fallbackMessage(name: string, activity: string, style: CoachStyle) {
  const copy: Record<CoachStyle, string> = {
    encouraging: `${name}, it’s time for ${activity.toLowerCase()}. One small win now is enough — let’s do it.`,
    energetic: `${name}, come on — it’s time for ${activity.toLowerCase()}. Let’s get this one done and keep the day moving.`,
    calm: `${name}, it’s time for ${activity.toLowerCase()}. Take it easy and just focus on showing up.`,
    firm: `${name}, it’s time for ${activity.toLowerCase()}. Let’s get it done now, then move on with the day.`,
    friendly: `Hey ${name}, quick one — it’s time for ${activity.toLowerCase()}. Let’s knock it out.`,
    accountability: `${name}, ${activity.toLowerCase()} is still on your plan today. Let’s finish it and tick it off.`,
  };
  return copy[style];
}

export default function VoiceCoachPage() {
  const { client } = useClientAuth();
  const name = firstName(client?.fullName);
  const [locale, setLocale] = useState("en-NG");
  const [gender, setGender] = useState("female");
  const [style, setStyle] = useState<CoachStyle>("energetic");
  const [voiceName, setVoiceName] = useState("");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [provider, setProvider] = useState("device");
  const [time, setTime] = useState("19:00");
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [message, setMessage] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [working, setWorking] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const firedRef = useRef<Record<string, boolean>>({});

  const accentLabel = useMemo(() => LOCALES.find(([value]) => value === locale)?.[1] || locale, [locale]);
  const previewText = message.trim() || fallbackMessage(name, activity, style);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setReminders(JSON.parse(saved));
    } catch {}
    if (typeof Notification === "undefined") setNotificationPermission("unsupported");
    else setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API}/voices?locale=${encodeURIComponent(locale)}&gender=${encodeURIComponent(gender)}`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        const data = await response.json();
        if (cancelled || !response.ok) return;
        const list = Array.isArray(data.voices) ? data.voices : [];
        setVoices(list);
        setProvider(data.provider || "device");
        if (list.length) setVoiceName(list[0].name);
        else setVoiceName("");
      } catch {
        if (!cancelled) {
          setVoices([]);
          setProvider("device");
          setVoiceName("");
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [locale, gender]);

  const speakWithDevice = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const playVoice = async (text: string) => {
    setWorking(true);
    try {
      const response = await fetch(`${API}/speech`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          text,
          locale,
          languageCode: "en",
          languageName: "English",
          accentLabel,
          voiceName,
          voiceGender: gender,
          coachStyle: style,
          intensity: 3,
        }),
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("audio")) throw new Error("Neural audio unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      speakWithDevice(text);
    } finally {
      setWorking(false);
    }
  };

  const compose = async () => {
    setWorking(true);
    try {
      const response = await fetch(`${API}/compose`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          activity,
          locale,
          languageCode: "en",
          languageName: "English",
          accentLabel,
          voiceGender: gender,
          coachStyle: style,
          intensity: 3,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.text) throw new Error("AI composer unavailable");
      setMessage(String(data.text));
    } catch {
      setMessage(fallbackMessage(name, activity, style));
    } finally {
      setWorking(false);
    }
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return setNotificationPermission("unsupported");
    setNotificationPermission(await Notification.requestPermission());
  };

  const fireReminder = (reminder: Reminder) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Khairo Voice Coach", { body: reminder.message, tag: `khairo-${reminder.id}` });
    }
    void playVoice(reminder.message);
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const day = now.toISOString().slice(0, 10);
      reminders.forEach((reminder) => {
        const key = `${reminder.id}:${day}:${current}`;
        if (!reminder.enabled || reminder.time !== current || firedRef.current[key]) return;
        firedRef.current[key] = true;
        fireReminder(reminder);
      });
    };
    check();
    const timer = window.setInterval(check, 10_000);
    return () => window.clearInterval(timer);
  }, [reminders]);

  const addReminder = () => {
    setReminders((current) => [...current, {
      id: crypto.randomUUID(),
      time,
      activity,
      message: previewText,
      enabled: true,
    }]);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-[#0d9488]/20 bg-gradient-to-br from-[#0d9488]/15 via-[var(--theme-surface)] to-[var(--theme-surface)] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-1.5 text-xs font-semibold text-[#0d9488]"><Sparkles size={14} /> Shared Voice Coach</div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Khairo, powered by the shared coach engine.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">This uses the same AI, regional voice catalogue and speech backend as FitLunge, while keeping Khairo authentication and branding separate.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-xs text-zinc-400">
            <div>Speech provider: <strong className="text-white">{provider}</strong></div>
            <div className="mt-1">Accent: <strong className="text-white">{accentLabel}</strong></div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Coach voice</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-400"><span>Country / accent</span><select value={locale} onChange={(e) => setLocale(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white">{LOCALES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="space-y-2 text-sm text-zinc-400"><span>Voice</span><select value={gender} onChange={(e) => setGender(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white"><option value="female">Female</option><option value="male">Male</option></select></label>
          </div>
          <label className="mt-4 block space-y-2 text-sm text-zinc-400"><span>Coach style</span><select value={style} onChange={(e) => setStyle(e.target.value as CoachStyle)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white">{STYLES.map((item) => <option key={item} value={item}>{item[0].toUpperCase()+item.slice(1)}</option>)}</select></label>
          {voices.length > 0 && <label className="mt-4 block space-y-2 text-sm text-zinc-400"><span>Available neural voice</span><select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white">{voices.map((voice) => <option key={voice.name} value={voice.name}>{voice.displayName} · {voice.gender}</option>)}</select></label>}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Create reminder</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-400"><span className="flex items-center gap-2"><Clock3 size={15}/> Time</span><input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/10 px-3 text-white"/></label>
            <label className="space-y-2 text-sm text-zinc-400"><span>Activity</span><select value={activity} onChange={(e)=>setActivity(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white">{ACTIVITIES.map((item)=><option key={item}>{item}</option>)}</select></label>
          </div>
          <button type="button" disabled={working} onClick={()=>void compose()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Sparkles size={14}/> {working ? "Working…" : "Write it like my coach"}</button>
          <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} placeholder={fallbackMessage(name, activity, style)} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white outline-none"/>
          <div className="mt-4 rounded-2xl border border-[#0d9488]/15 bg-[#0d9488]/5 p-4"><p className="text-sm leading-6 text-zinc-300">{previewText}</p><button type="button" disabled={working} onClick={()=>void playVoice(previewText)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white"><Play size={14}/> Hear coach</button></div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={addReminder} className="inline-flex items-center gap-2 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white"><Plus size={14}/> Add reminder</button>{notificationPermission !== "granted" && notificationPermission !== "unsupported" && <button type="button" onClick={()=>void requestNotifications()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white"><BellRing size={14}/> Enable notifications</button>}</div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">Daily reminders</h2>
        <div className="mt-4 space-y-3">{reminders.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">No reminders yet.</div> : reminders.map((reminder)=><div key={reminder.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-lg font-bold text-white">{reminder.time}</div><div className="mt-1 text-sm text-zinc-300">{reminder.activity}</div><div className="mt-2 text-xs leading-5 text-zinc-600">{reminder.message}</div></div><button type="button" onClick={()=>setReminders((current)=>current.filter((item)=>item.id!==reminder.id))} className="rounded-full p-2 text-zinc-600 hover:text-red-400"><Trash2 size={15}/></button></div><button type="button" onClick={()=>fireReminder(reminder)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white"><Volume2 size={13}/> Test now</button></div>)}</div>
      </section>
    </div>
  );
}
