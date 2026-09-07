"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Clock3, Play, Plus, Trash2, Volume2 } from "lucide-react";
import { useClientAuth } from "@/context/ClientAuthContext";

type Reminder = {
  id: string;
  time: string;
  activity: string;
  message: string;
  enabled: boolean;
};

const STORAGE_KEY = "khairo_voice_coach_reminders";

const ACTIVITIES = [
  "10 sit-ups",
  "10 push-ups",
  "15-minute walk",
  "Drink a glass of water",
  "Stretch for 5 minutes",
  "Log today's progress",
];

function formatSpokenTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function firstName(fullName?: string) {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

export default function VoiceCoachPage() {
  const { client } = useClientAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [time, setTime] = useState("19:00");
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [customMessage, setCustomMessage] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const firedRef = useRef<Record<string, string>>({});

  const name = firstName(client?.fullName);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setReminders(JSON.parse(raw));
    } catch {
      // Ignore malformed local prototype data.
    }

    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const generatedMessage = useMemo(() => {
    const now = new Date();
    return `Hey ${name}, it's ${formatSpokenTime(now)}. Time for ${activity.toLowerCase()}. You've got this.`;
  }, [activity, name]);

  const speak = (message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const showNotification = (message: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification("Khairo AI Voice Coach", {
      body: message,
      tag: "khairo-voice-coach",
      renotify: true,
    });
  };

  const fireReminder = (reminder: Reminder) => {
    const now = new Date();
    const spoken = reminder.message.replace("{time}", formatSpokenTime(now));
    showNotification(spoken);
    speak(spoken);
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

      reminders.forEach((reminder) => {
        const fireKey = `${reminder.id}:${dayKey}:${currentTime}`;
        if (!reminder.enabled || reminder.time !== currentTime || firedRef.current[fireKey]) return;
        firedRef.current[fireKey] = fireKey;
        fireReminder(reminder);
      });
    };

    check();
    const interval = window.setInterval(check, 10_000);
    return () => window.clearInterval(interval);
  }, [reminders]);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const addReminder = () => {
    const message = (customMessage.trim() || `Hey ${name}, it's {time}. Time for ${activity.toLowerCase()}. You've got this.`);
    setReminders((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        time,
        activity,
        message,
        enabled: true,
      },
    ]);
    setCustomMessage("");
  };

  const toggleReminder = (id: string) => {
    setReminders((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const removeReminder = (id: string) => {
    setReminders((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[#0d9488]/20 bg-gradient-to-br from-[#0d9488]/15 via-[var(--theme-surface)] to-[var(--theme-surface)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-1.5 text-xs font-semibold text-[#0d9488]">
              <Volume2 size={14} />
              AI Voice Coach prototype
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Your coach can remind you out loud.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Schedule simple daily actions. When Khairo is open, your device can show a notification and speak the reminder using its built-in voice.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-zinc-400 sm:w-64">
            <div className="flex items-center gap-2 font-semibold text-white"><BellRing size={16} /> Notification status</div>
            <p className="mt-2 capitalize">{notificationPermission}</p>
            {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
              <button type="button" onClick={() => void requestNotifications()} className="mt-3 rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white">
                Enable notifications
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Create a reminder</h2>
          <p className="mt-1 text-sm text-zinc-500">This first prototype stores reminders on this device.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-400">
              <span className="flex items-center gap-2"><Clock3 size={15} /> Time</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/10 px-3 text-white outline-none focus:border-[#0d9488]" />
            </label>

            <label className="space-y-2 text-sm text-zinc-400">
              <span>Activity</span>
              <select value={activity} onChange={(e) => setActivity(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-white outline-none focus:border-[#0d9488]">
                {ACTIVITIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm text-zinc-400">
            <span>Optional custom voice message</span>
            <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={4} placeholder={`Hey ${name}, it's {time}. Time for your movement break.`} className="w-full rounded-xl border border-white/10 bg-black/10 p-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#0d9488]" />
            <span className="text-xs text-zinc-600">Use <code>{"{time}"}</code> to insert the actual reminder time.</span>
          </label>

          <div className="mt-5 rounded-2xl border border-[#0d9488]/15 bg-[#0d9488]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">AI-style preview</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{customMessage.trim() || generatedMessage}</p>
            <button type="button" onClick={() => speak(customMessage.trim() || generatedMessage)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5">
              <Play size={14} /> Test voice
            </button>
          </div>

          <button type="button" onClick={addReminder} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white">
            <Plus size={16} /> Add daily reminder
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Daily reminders</h2>
          <p className="mt-1 text-sm text-zinc-500">Leave this prototype open to test automatic spoken reminders.</p>

          <div className="mt-5 space-y-3">
            {reminders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-600">No reminders yet.</div>
            ) : reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{reminder.time}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${reminder.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-500"}`}>{reminder.enabled ? "ON" : "OFF"}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-300">{reminder.activity}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">{reminder.message}</p>
                  </div>
                  <button type="button" onClick={() => removeReminder(reminder.id)} className="rounded-full p-2 text-zinc-600 hover:bg-red-500/10 hover:text-red-400" aria-label="Delete reminder"><Trash2 size={15} /></button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => fireReminder(reminder)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white"><Volume2 size={13} /> Test now</button>
                  <button type="button" onClick={() => toggleReminder(reminder.id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-400">Turn {reminder.enabled ? "off" : "on"}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100/70">
        <strong className="text-amber-200">Prototype limitation:</strong> normal web pages cannot reliably start spoken audio while the browser/app is fully closed. The production version should add web push or a mobile-app wrapper for background delivery, while the AI coach generates the personalized message on the server.
      </section>
    </div>
  );
}
