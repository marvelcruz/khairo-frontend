"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Send } from "lucide-react";
import { api } from "../../../lib/api";

type Message = {
  _id: string;
  senderType:
    | "client"
    | "staff";
  senderName?: string;
  category: string;
  body: string;
  createdAt: string;
};

export default function MessagesPage() {
  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [body, setBody] =
    useState("");

  const [
    category,
    setCategory,
  ] = useState("general");

  const [sending, setSending] =
    useState(false);

  const load =
    useCallback(async () => {
      try {
        const response =
          await api.get<{
            messages:
              Message[];
          }>(
            "/client-experience/messages",
            true
          );

        setMessages(
          response.messages ||
            []
        );
      } catch {
      }
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!body.trim()) return;

    setSending(true);

    try {
      await api.post(
        "/client-experience/messages",
        {
          body,
          category,
        },
        true
      );

      setBody("");

      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Messages
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          Talk to Khairo Diet Clinic
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Ask a question here and keep the conversation with your Khairo Diet Clinic team in one place.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-4 sm:p-6">
        <div className="min-h-64 space-y-3">
          {!messages.length ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No messages yet. Send your first question below.
              </p>
            </div>
          ) : (
            messages.map(
              (message) => (
                <div
                  key={
                    message._id
                  }
                  className={`flex ${
                    message.senderType ===
                    "client"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.senderType ===
                      "client"
                        ? "bg-[#0d9488] text-white"
                        : "border border-white/10 bg-black/25 text-zinc-300"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {
                        message.body
                      }
                    </p>

                    <p className={`mt-1 text-[10px] ${
                      message.senderType ===
                      "client"
                        ? "text-white/60"
                        : "text-zinc-600"
                    }`}>
                      {new Date(
                        message.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            )
          )}
        </div>

        <form
          onSubmit={send}
          className="mt-5 border-t border-white/8 pt-5"
        >
          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="h-10 rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-xs text-zinc-300"
          >
            <option value="general">
              General question
            </option>
            <option value="plan">
              My plan
            </option>
            <option value="appointment">
              Appointment
            </option>
            <option value="billing">
              Billing
            </option>
            <option value="technical">
              Technical help
            </option>
          </select>

          <textarea
            required
            value={body}
            onChange={(e) =>
              setBody(
                e.target.value
              )
            }
            rows={4}
            placeholder="Type your message..."
            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[var(--theme-page)] px-4 py-3 text-sm text-white outline-none focus:border-[#0d9488]"
          />

          <button
            disabled={sending}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Send
              size={15}
            />

            {sending
              ? "Sending..."
              : "Send message"}
          </button>
        </form>
      </section>
    </div>
  );
}
